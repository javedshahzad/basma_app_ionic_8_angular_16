import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

export interface PendingTeacher {
  user_no?: string | number;
  name?: string;
  user_id?: string;
  school_id?: string;
  datetime?: string;
}

/**
 * docs/SELF_REGISTRATION_VIA_SCHOOL_CODE_PLAN.md §5.4/§6.6 -- pending
 * self-registered teacher approvals, mirroring
 * ParentManagementApiService's getRequestedParents/accept/delete trio.
 */
@Injectable({
  providedIn: 'root'
})
export class TeacherManagementApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getPendingTeachers(data: Record<string, unknown>): Promise<{ session: boolean; data?: PendingTeacher[] }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ response?: boolean; teachers?: PendingTeacher[] }>(data, 'getNewTeachers')
        .then((response) => {
          if (response) {
            resolve({ session: !!response.response, data: response.teachers || [] });
          } else {
            reject(undefined);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  acceptPendingTeacher(data: Record<string, unknown>): Promise<{ session: boolean }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ ok?: boolean }>(data, 'acceptTeacherRequest')
        .then((response) => {
          resolve({ session: !!(response && response.ok) });
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  deletePendingTeacher(data: Record<string, unknown>): Promise<{ session: boolean }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ ok?: boolean }>(data, 'deleteTeacherRequest')
        .then((response) => {
          resolve({ session: !!(response && response.ok) });
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }
}
