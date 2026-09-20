import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

export interface SubstituteAssignment {
  id: number;
  date: string;
  dayOfWeek: number;
  periodNo: number;
  cid: number;
  className?: string;
  subjectId: number;
  subjectName?: string;
  absentUserNo: number;
  absentTeacherName?: string;
  substituteUserNo: number | null;
  substituteTeacherName?: string;
  status: 'pending' | 'accepted' | 'uncovered';
}

/**
 * Substitute (reserve) teacher rotation -- Basma App plan, phase 3. A
 * teacher's own coverage requests (as the one covering, not the one who
 * was absent) and their accept/decline response. Server-enforced via
 * AuthorizeActorSelf -- this can never show or affect another teacher's
 * assignment.
 */
@Injectable({
  providedIn: 'root'
})
export class SubstitutesApiService {
  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) {}

  getMySubstituteRequests(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: SubstituteAssignment[] }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; session?: boolean; data?: SubstituteAssignment[]; msg?: string }>(data, 'getMySubstituteRequests')
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

  /** @param data.accept truthy accepts, falsy declines (and immediately
   * tries the next fairest candidate for the same slot server-side). */
  respondToSubstitute(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: SubstituteAssignment }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; session?: boolean; data?: SubstituteAssignment; msg?: string }>(data, 'respondToSubstitute')
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
