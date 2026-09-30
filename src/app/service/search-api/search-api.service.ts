import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { ApiResponse } from '../../model/api-response.model';
import { Student } from '../../model/student.model';
import { UserDetails } from '../../model/logged-in-user.model';

@Injectable({
  providedIn: 'root'
})
export class SearchApiService {

  constructor(private apiClient: ApiClient) { }

  searchUser(data: Record<string, unknown>): Promise<ApiResponse<UserDetails[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<UserDetails[]>(data, 'search_user').then((response) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
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
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  /** Search all student of School from API.
   * @returns Array of users list or error
  */
  serachStudent(data: Record<string, unknown>): Promise<ApiResponse<ApiResponse<Student[]>>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<Student[]>>(data, 'search_student').then((response) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
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
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  /** Search all parent of School from API.
   * @returns Array of users list or error
  */
  serachParent(data: Record<string, unknown>): Promise<ApiResponse<unknown[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<unknown[]>>(data, 'serachParent').then((response) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }
}
