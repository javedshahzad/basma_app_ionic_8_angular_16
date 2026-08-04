import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

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

  getSchoolStudents(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'get_school_stu').then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
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
  getSchoolUsers(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'get_school_users').then((response: any) => {
          if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
          reject(error.message)

      })
    })
  }

  getAllSchoolUsers(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'get_school_users_all').then((response: any) => {
          if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
          reject(error.message)

      })
    })
  }
}
