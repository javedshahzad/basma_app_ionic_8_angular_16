import { Injectable, NgZone, signal } from '@angular/core';
import { Platform } from '@ionic/angular';
import { isNetworkConnected, onNetworkChange } from '../network-status';

/**
 * Single source of truth for "are we online right now" — replaces the
 * ad-hoc `platform.is('cordova'/'capacitor') ? Network.getStatus() :
 * navigator.onLine` checks previously duplicated across ~20 call sites.
 *
 * A disconnect is debounced 2s before flipping `isOnline` false, matching
 * the behavior app.component.ts used to implement inline (avoids the
 * offline banner flashing on brief network blips); a reconnect is applied
 * immediately.
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private readonly _isOnline = signal(true);
  readonly isOnline = this._isOnline.asReadonly();

  /** True for a few seconds after a real outage ends, so the banner can say "back online". */
  private readonly _justReconnected = signal(false);
  readonly justReconnected = this._justReconnected.asReadonly();

  private readonly isNative: boolean;
  private offlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectedTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private platform: Platform,
    private zone: NgZone
  ) {
    this.isNative = this.platform.is('cordova') || this.platform.is('capacitor');
    this.init();
  }

  private async init() {
    if (this.isNative) {
      // isNetworkConnected / onNetworkChange never throw: with the native Network
      // plugin missing they use the browser's online state and events instead.
      this._isOnline.set(await isNetworkConnected());

      onNetworkChange(connected => {
        this.zone.run(() => this.handleStatusChange(connected));
      });

      this.platform.resume.subscribe(() => {
        setTimeout(async () => {
          const connected = await isNetworkConnected();
          this.zone.run(() => this.handleStatusChange(connected));
        }, 1000);
      });
    } else {
      this._isOnline.set(navigator.onLine);
      window.addEventListener('online', () => this.zone.run(() => this.handleStatusChange(true)));
      window.addEventListener('offline', () => this.zone.run(() => this.handleStatusChange(false)));
    }
  }

  private handleStatusChange(connected: boolean) {
    if (this.offlineDebounceTimer) {
      clearTimeout(this.offlineDebounceTimer);
      this.offlineDebounceTimer = null;
    }

    if (connected) {
      this.setOnline();
      return;
    }

    this.offlineDebounceTimer = setTimeout(async () => {
      const stillDown = this.isNative ? !(await isNetworkConnected()) : !navigator.onLine;
      if (stillDown) this._isOnline.set(false);
    }, 2000);
  }

  /** Force a fresh read (e.g. before a critical write) rather than waiting on the next event. */
  async refresh(): Promise<boolean> {
    const connected = this.isNative ? await isNetworkConnected() : navigator.onLine;
    if (connected) {
      this.setOnline();
    } else {
      this._isOnline.set(false);
    }
    return connected;
  }

  /**
   * Marks the device online. Only a change from offline counts as a reconnect: the
   * native Network plugin also reports "connected" on every app launch and resume, and
   * that must stay silent.
   */
  private setOnline() {
    const wasOffline = !this._isOnline();
    this._isOnline.set(true);
    if (!wasOffline) return;

    this._justReconnected.set(true);
    if (this.reconnectedTimer) clearTimeout(this.reconnectedTimer);
    this.reconnectedTimer = setTimeout(() => this._justReconnected.set(false), 3000);
  }
}
