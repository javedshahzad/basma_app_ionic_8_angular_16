import { Injectable, effect, signal } from '@angular/core';
import { StorageService } from '../storage.service';
import { ConnectivityService } from '../connectivity/connectivity.service';

export interface QueueItem<T = unknown> {
  id: string;
  type: string;
  payload: T;
  queuedAt: number;
  retryCount: number;
}

type QueueHandler = (payload: unknown) => Promise<unknown>;

/**
 * Generic offline write-queue: any write-capable service registers a
 * handler for its own `type` and pushes payloads via `enqueue()` when
 * offline; this service owns storage, retry/backoff, and drain triggering
 * (reconnect events + a bounded poll while non-empty), independent of which
 * page happens to be open.
 *
 * Note on duplicate writes: `id` is a locally-generated tracking key, not
 * a server-recognized idempotency token — the backend endpoints this
 * drains into (markAttendance/markOfflineDelayAttendance) don't accept one
 * today. A drain attempt whose request actually succeeded server-side but
 * whose response was lost (e.g. connection drops mid-response) can still
 * retry into a duplicate write on next drain — the same risk the original
 * hand-rolled per-page queues already carried. Closing that fully needs a
 * backend-side idempotency-key contract, out of scope for this pass.
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private readonly STORAGE_KEY = 'offline_queue';
  private readonly LEGACY_KEYS: { key: string; type: string }[] = [
    { key: 'attendance', type: 'attendance' },
    { key: 'delayattendance', type: 'delayattendance' }
  ];
  private readonly MAX_RETRIES = 5;

  private readonly handlers = new Map<string, QueueHandler>();
  private readonly batchCallbacks = new Map<string, (syncedCount: number) => void>();
  private readonly _pendingCount = signal(0);
  readonly pendingCount = this._pendingCount.asReadonly();

  private isDraining = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private ready: Promise<void>;

  constructor(
    private storageSr: StorageService,
    private connectivity: ConnectivityService
  ) {
    this.ready = this.migrateLegacyQueues().then(() => this.refreshPendingCount());

    // Fires immediately with whatever isOnline() currently is, and again on
    // every transition — covers both "already online at app launch" (the
    // gap the old per-page-triggered sync never closed) and "just
    // reconnected".
    effect(() => {
      if (this.connectivity.isOnline()) {
        this.drain();
      }
    });
  }

  /**
   * @param onBatchSynced Optional — called once per drain() pass with the
   * count of this type's items that synced successfully in that pass (not
   * once per item), so a caller can show one summary toast/notification
   * per batch instead of spamming one per queued item.
   */
  registerHandler(type: string, handler: QueueHandler, onBatchSynced?: (syncedCount: number) => void): void {
    this.handlers.set(type, handler);
    if (onBatchSynced) this.batchCallbacks.set(type, onBatchSynced);
  }

  async enqueue<T>(type: string, payload: T): Promise<void> {
    await this.ready;
    const items = await this.getAll();
    items.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      queuedAt: Date.now(),
      retryCount: 0
    });
    await this.saveAll(items);
    this.armPoll();
  }

  async drain(): Promise<void> {
    await this.ready;
    if (this.isDraining || !this.connectivity.isOnline()) return;

    this.isDraining = true;
    try {
      const items = await this.getAll();
      if (items.length === 0) {
        this.disarmPoll();
        return;
      }

      const remaining: QueueItem[] = [];
      const syncedCounts = new Map<string, number>();

      for (const item of items) {
        const handler = this.handlers.get(item.type);
        if (!handler) {
          // No handler registered yet (e.g. drained before the owning
          // service finished constructing) — keep it queued, don't drop it.
          remaining.push(item);
          continue;
        }
        try {
          await handler(item.payload);
          syncedCounts.set(item.type, (syncedCounts.get(item.type) || 0) + 1);
        } catch (error) {
          item.retryCount++;
          if (item.retryCount < this.MAX_RETRIES) {
            remaining.push(item);
          } else {
            console.error(`OfflineQueueService: giving up on "${item.type}" item ${item.id} after ${this.MAX_RETRIES} attempts`, error);
          }
        }
      }

      for (const [type, count] of syncedCounts) {
        this.batchCallbacks.get(type)?.(count);
      }

      await this.saveAll(remaining);
      if (remaining.length > 0) this.armPoll();
      else this.disarmPoll();
    } finally {
      this.isDraining = false;
    }
  }

  private async migrateLegacyQueues(): Promise<void> {
    const items = (await this.storageSr.get(this.STORAGE_KEY)) || [];
    let migrated = false;

    for (const legacy of this.LEGACY_KEYS) {
      const legacyItems = (await this.storageSr.get(legacy.key)) || [];
      if (legacyItems.length === 0) continue;

      for (const payload of legacyItems) {
        items.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: legacy.type,
          payload,
          queuedAt: Date.now(),
          retryCount: 0
        });
      }
      await this.storageSr.remove(legacy.key);
      migrated = true;
    }

    if (migrated) await this.storageSr.set(this.STORAGE_KEY, items);
  }

  private async getAll(): Promise<QueueItem[]> {
    return (await this.storageSr.get(this.STORAGE_KEY)) || [];
  }

  private async saveAll(items: QueueItem[]): Promise<void> {
    await this.storageSr.set(this.STORAGE_KEY, items);
    this._pendingCount.set(items.length);
  }

  private async refreshPendingCount(): Promise<void> {
    this._pendingCount.set((await this.getAll()).length);
  }

  private armPoll(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.drain(), 20000);
  }

  private disarmPoll(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
