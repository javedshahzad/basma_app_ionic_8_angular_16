import { Injectable, NgZone, signal } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Network } from '@capacitor/network';
import { TranslateService } from '@ngx-translate/core';
import { OverlayService } from '../overlay/overlay.service';

/**
 * Single source of truth for "are we online right now" — replaces the
 * ad-hoc `platform.is('cordova'/'capacitor') ? Network.getStatus() :
 * navigator.onLine` checks previously duplicated across ~20 call sites.
 *
 * A disconnect is debounced 2s before flipping `isOnline` false, matching
 * the behavior app.component.ts used to implement inline (avoids the
 * offline banner flashing on brief network blips); a reconnect is applied
 * immediately. The "connected" toast is shown only after a confirmed
 * offline stretch — Capacitor also fires connected:true on wifi/cellular
 * switches, resume, and plugin init, which used to toast randomly.
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private readonly _isOnline = signal(true);
  readonly isOnline = this._isOnline.asReadonly();

  private readonly isNative: boolean;
  private offlineDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private hasBeenOffline = false;

  constructor(
    private platform: Platform,
    private zone: NgZone,
    private overlay: OverlayService,
    private translate: TranslateService
  ) {
    this.isNative = this.platform.is('cordova') || this.platform.is('capacitor');
    this.init();
  }

  private async init() {
    if (this.isNative) {
      const status = await Network.getStatus();
      this._isOnline.set(status.connected);
      this.hasBeenOffline = !status.connected;

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
      this.hasBeenOffline = !navigator.onLine;
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
      this.applyConnected();
      return;
    }

    this.offlineDebounceTimer = setTimeout(async () => {
      const stillDown = this.isNative ? !(await Network.getStatus()).connected : !navigator.onLine;
      if (stillDown) this.applyDisconnected();
    }, 2000);
  }

  private applyConnected() {
    const wasOffline = !this._isOnline();
    this._isOnline.set(true);
    if (wasOffline && this.hasBeenOffline) {
      this.hasBeenOffline = false;
      this.overlay.showToast(
        this.translate.instant('alertmessages.online') || 'Connected to internet'
      );
    }
  }

  private applyDisconnected() {
    if (!this._isOnline()) {
      this.hasBeenOffline = true;
      return;
    }
    this._isOnline.set(false);
    this.hasBeenOffline = true;
    this.overlay.showToast(
      this.translate.instant('alertmessages.not_online') || 'You are not Connected to Internet'
    );
  }

  /** Force a fresh read (e.g. before a critical write) rather than waiting on the next event. */
  async refresh(): Promise<boolean> {
    const connected = this.isNative ? (await Network.getStatus()).connected : navigator.onLine;
    if (connected) {
      this.applyConnected();
    } else {
      this._isOnline.set(false);
      this.hasBeenOffline = true;
    }
    return connected;
  }
}
