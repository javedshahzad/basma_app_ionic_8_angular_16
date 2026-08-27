import { Injectable, NgZone, signal } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Network } from '@capacitor/network';

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

  private readonly isNative: boolean;
  private offlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private platform: Platform,
    private zone: NgZone
  ) {
    this.isNative = this.platform.is('cordova') || this.platform.is('capacitor');
    this.init();
  }

  private async init() {
    if (this.isNative) {
      const status = await Network.getStatus();
      this._isOnline.set(status.connected);

      Network.addListener('networkStatusChange', status => {
        this.zone.run(() => this.handleStatusChange(status.connected));
      });

      this.platform.resume.subscribe(() => {
        setTimeout(async () => {
          const current = await Network.getStatus();
          this.zone.run(() => this.handleStatusChange(current.connected));
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
      this._isOnline.set(true);
      return;
    }

    this.offlineDebounceTimer = setTimeout(async () => {
      const stillDown = this.isNative ? !(await Network.getStatus()).connected : !navigator.onLine;
      if (stillDown) this._isOnline.set(false);
    }, 2000);
  }

  /** Force a fresh read (e.g. before a critical write) rather than waiting on the next event. */
  async refresh(): Promise<boolean> {
    const connected = this.isNative ? (await Network.getStatus()).connected : navigator.onLine;
    this._isOnline.set(connected);
    return connected;
  }
}
