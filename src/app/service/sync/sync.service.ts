import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Network } from '@capacitor/network';
import { StorageService } from '../storage.service';
import { OverlayService } from '../overlay/overlay.service';
import { AttendanceApiService } from '../attendance-api/attendance-api.service';

/**
 * Owns the offline attendance sync loop: retries queued attendance /
 * delay-attendance submissions once the network is back, then every 20s
 * while there's still a queue.
 */
@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private syncInterval: any = null;
  private isSyncing = false;

  constructor(
    private platform: Platform,
    private storageSr: StorageService,
    private overlay: OverlayService,
    private attendanceApi: AttendanceApiService
  ) {
    Network.addListener('networkStatusChange', status => {
      if (status.connected) {
        this.syncOffileData();
      }
    });
  }

  async syncOffileData() {
    if (this.syncInterval) {
      return;
    }

    // Run immediately
    await this.performOfflineSync();

    // Run every 20 seconds
    this.syncInterval = setInterval(async () => {
      await this.performOfflineSync();
    }, 20000);
  }

  private async getNetworkInformation(): Promise<boolean> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      return (await Network.getStatus()).connected;
    }
    return navigator.onLine;
  }

  private async performOfflineSync() {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      const isNetworkAvailable = await this.getNetworkInformation();

      if (!isNetworkAvailable) {
        return;
      }

      /**
       * Sync Attendance
       */
      const attendances = await this.storageSr.get("attendance") || [];

      if (attendances.length > 0) {
        const remainingAttendance = [];

        for (const attendance of attendances) {
          try {
            await this.attendanceApi.markAttendance(attendance);
          } catch (error) {
            console.error("Attendance sync failed", error);
            remainingAttendance.push(attendance);
          }
        }

        if (remainingAttendance.length === 0) {
          await this.storageSr.remove("attendance");
          this.overlay.showToast("Attendance Synced Successfully");
        } else {
          await this.storageSr.set("attendance", remainingAttendance);
        }
      }

      /**
       * Sync Delay Attendance
       */
      const delayAttendances = await this.storageSr.get("delayattendance") || [];

      if (delayAttendances.length > 0) {
        const remainingDelayAttendance = [];

        for (const item of delayAttendances) {
          try {
            await this.attendanceApi.markOfflineDelayAttendance(
              item.attendance,
              item.submittedByUser
            );
          } catch (error) {
            console.error("Delay attendance sync failed", error);
            remainingDelayAttendance.push(item);
          }
        }

        if (remainingDelayAttendance.length === 0) {
          await this.storageSr.remove("delayattendance");
          this.overlay.showToast("Delay Attendance Synced Successfully");
        } else {
          await this.storageSr.set("delayattendance", remainingDelayAttendance);
        }
      }
    } catch (error) {
      console.error("Offline Sync Error", error);
    } finally {
      this.isSyncing = false;
    }
  }
}
