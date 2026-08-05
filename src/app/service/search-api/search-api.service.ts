import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { ApiResponse } from '../../model/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class SearchApiService {

  constructor(private apiClient: ApiClient) { }

  searchUser(data: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<any[]>(data, 'search_user').then((response) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  searchAllUser(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'search_user_all').then((response) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  /** Search all student of School from API.
   * @returns Array of users list or error
  */
  serachStudent(data: Record<string, unknown>): Promise<ApiResponse<ApiResponse<any[]>>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<any[]>>(data, 'search_student').then((response) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  searTeacher(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getTeacherWithPagging').then((response) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  /** Search all parent of School from API.
   * @returns Array of users list or error
  */
  serachParent(data: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<any[]>>(data, 'serachParent').then((response) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
}
