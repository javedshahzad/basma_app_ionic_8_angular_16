import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

export interface ExamInvigilator {
  userNo: number;
  name?: string;
}

export interface ExamSession {
  id: number;
  date: string;
  periodNo: number;
  cid: number;
  className?: string;
  subjectId: number;
  subjectName?: string;
  room: string;
  invigilators: ExamInvigilator[];
}

/**
 * Exam-week invigilation -- Basma App plan, phase 4. Read-only: unlike a
 * substitute assignment (SubstitutesApiService), an invigilation assignment
 * is a duty roster entry, not a request needing a response -- there's no
 * accept/decline here.
 */
@Injectable({
  providedIn: 'root'
})
export class ExamsApiService {
  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) {}

  getMyInvigilationDuties(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: ExamSession[] }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; session?: boolean; data?: ExamSession[]; msg?: string }>(data, 'getMyInvigilationDuties')
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
