import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class AbsentApplicationApiService {

  constructor(private apiClient: ApiClient) { }

  GetAbsentStudents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getAttendanceData').then((response: any) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  saveAbsentApplication(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'saveAbsentApplication').then((response: any) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  getAbsentApplication(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getAbsentApplication').then((response: any) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  AcceptAndRejectApplication(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'AcceptAndRejectApplication').then((response: any) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
}
