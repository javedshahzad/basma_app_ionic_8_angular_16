import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

/** dayOfWeek: 0 = Sunday .. 6 = Saturday (matches JS Date.getDay(), same
 * convention staging.basmapp uses). School week is Sunday-Thursday. */
export interface TimetableSlot {
  dayOfWeek: number;
  periodNo: number;
  subjectId: number;
  subjectName?: string;
  userNo: number;
  teacherName?: string;
  room?: string | null;
  cid: number;
  className?: string;
}

/**
 * Read-only "my own weekly schedule" -- Basma App plan, phase 1. Admin-
 * managed under Timetable in basmacp-admin; this only ever reads the
 * authenticated user's own slots (server-enforced via AuthorizeActorSelf,
 * not just a client-side convention).
 */
@Injectable({
  providedIn: 'root'
})
export class TimetableApiService {
  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) {}

  getMyTimetable(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: TimetableSlot[] }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; session?: boolean; data?: TimetableSlot[]; msg?: string }>(data, 'getMyTimetable')
        .then(response => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, data: response.data || [] });
            } else {
              reject(response.msg);
            }
          } else {
            reject(undefined);
          }
        })
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }
}
