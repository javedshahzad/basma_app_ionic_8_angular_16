import { Injectable } from '@angular/core';
import { OverlayService } from '../overlay/overlay.service';
import { AttendanceApiService } from '../attendance-api/attendance-api.service';
import { StudentEngagementService } from '../student-engagement/student-engagement.service';
import { AbsentApplicationApiService } from '../absent-application-api/absent-application-api.service';
import { OfflineQueueService } from '../offline-queue/offline-queue.service';

/**
 * Registers every offline-write handler with OfflineQueueService, which
 * owns the actual storage, retry/backoff, and drain-triggering (reconnect
 * events, app-startup check, bounded poll — see offline-queue.service.ts).
 * This service just supplies the domain-specific "how do I actually submit
 * this" callbacks and stays injected in app.component.ts so all of them
 * get registered from app launch.
 */
@Injectable({
  providedIn: 'root'
})
export class SyncService {
  constructor(
    private overlay: OverlayService,
    private attendanceApi: AttendanceApiService,
    private studentEngagement: StudentEngagementService,
    private absentApplicationApi: AbsentApplicationApiService,
    private offlineQueue: OfflineQueueService
  ) {
    this.offlineQueue.registerHandler(
      'attendance',
      payload => this.attendanceApi.markAttendance(payload as Parameters<AttendanceApiService['markAttendance']>[0]),
      () => this.overlay.showToast('Attendance Synced Successfully')
    );

    this.offlineQueue.registerHandler(
      'delayattendance',
      payload => {
        const item = payload as { attendance: Parameters<AttendanceApiService['markOfflineDelayAttendance']>[0]; submittedByUser: number };
        return this.attendanceApi.markOfflineDelayAttendance(item.attendance, item.submittedByUser);
      },
      () => this.overlay.showToast('Delay Attendance Synced Successfully')
    );

    this.offlineQueue.registerHandler(
      'note',
      payload => this.studentEngagement.addNote(payload as Record<string, unknown>),
      () => this.overlay.showToast('Note Synced Successfully')
    );

    this.offlineQueue.registerHandler(
      'absent_application',
      payload => this.absentApplicationApi.saveAbsentApplication(payload as Record<string, unknown>),
      () => this.overlay.showToast('Absence Application Synced Successfully')
    );
  }

  /** Kept for the existing call sites (classlist/tasks-calendar) — now just delegates. */
  async syncOffileData(): Promise<void> {
    await this.offlineQueue.drain();
  }
}
