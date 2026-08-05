import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { ApiResponse } from '../../model/api-response.model';

/**
 * School roster lookups (students/users), split out of DataService.
 * Depends on DataService for `lang` (error-message fallback in
 * getSchoolStudents).
 */
@Injectable({
  providedIn: 'root'
})
export class SchoolDirectoryApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getSchoolStudents(data: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<any[]>>(data, 'get_school_stu').then((response) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.dataService.lang.usnexpectedError)
        }
      })
    })
  }

  /** get all student of a school
  */
  getSchoolUsers(data: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<any[]>>(data, 'get_school_users').then((response) => {
          if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
          reject(error.message)

      })
    })
  }

  getAllSchoolUsers(data: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<any[]>>(data, 'get_school_users_all').then((response) => {
          if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(undefined)
        }
      }).catch((error) => {
        console.log(error);
          reject(error.message)

      })
    })
  }
}
