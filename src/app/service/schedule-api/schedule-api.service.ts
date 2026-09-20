import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

export interface ScheduleSlot {
  dayOfWeek: number;
  periodNo: number;
  subjectName?: string;
  teacherName?: string;
  room?: string;
}

export interface SchedulePeriod {
  periodNo: number;
  startTime: string;
  endTime: string;
  label: string | null;
}

export interface ClassSchedule {
  cid: number;
  className: string;
  periods: SchedulePeriod[];
  slots: ScheduleSlot[];
}

/**
 * Parent/student in-app class schedule view -- Basma App plan, phase 5.
 * A STUDENT sees their own class; a PARENT must pass a child's sid
 * (ownership is verified server-side).
 */
@Injectable({
  providedIn: 'root'
})
export class ScheduleApiService {
  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) {}

  getMyClassSchedule(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: ClassSchedule }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; session?: boolean; data?: ClassSchedule; msg?: string }>(data, 'getMyClassSchedule')
        .then(response => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, data: response.data });
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
