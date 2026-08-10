import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { ApiResponse } from '../../model/api-response.model';

export interface AbsentApplication {
  id?: string | number;
  cid?: string | number;
  sid?: string | number;
  application_status?: string;
  studentObj?: { name?: string };
  courseObj?: { name?: string };
}

@Injectable({
  providedIn: 'root'
})
export class AbsentApplicationApiService {

  constructor(private apiClient: ApiClient) { }

  GetAbsentStudents(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getAttendanceData').then((response) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  saveAbsentApplication(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'saveAbsentApplication').then((response) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  getAbsentApplication(data: Record<string, unknown>): Promise<ApiResponse<AbsentApplication[]>> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<ApiResponse<AbsentApplication[]>>(data, 'getAbsentApplication').then((response) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  AcceptAndRejectApplication(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'AcceptAndRejectApplication').then((response) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }
}
