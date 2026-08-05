import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { ApiResponse } from '../../model/api-response.model';

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
      }).catch((error) => {
        console.log(error);
      })
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
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  getAbsentApplication(data: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<ApiResponse<any[]>>(data, 'getAbsentApplication').then((response) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
      })
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
      }).catch((error) => {
        console.log(error);
      })
    })
  }
}
