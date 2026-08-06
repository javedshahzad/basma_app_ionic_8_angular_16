import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { StudentDataService } from '../student-data/student-data.service';
import { ApiResponse } from '../../model/api-response.model';

/**
 * School roster lookups (students/users), split out of DataService.
 * Depends on DataService for `lang` (error-message fallback in
 * getSchoolStudents). Depends on StudentDataService for todayDashboard's
 * online/offline stat caching.
 */
@Injectable({
  providedIn: 'root'
})
export class SchoolDirectoryApiService {

  constructor(
    private apiClient: ApiClient,
    private http: HttpClient,
    private dataService: DataService,
    private studentService: StudentDataService
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

  getCountStudents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getCountStudents')
        .then((response: any) => {
          if (response) {
            resolve({ session: true, data: response.data, success: true, msg: response.msg });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }

  /** Get school list from API.
   * @returns Array of school list or error
   */
  getSchool(country_code): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          let url =
            environment.serverURL +
            'getSchoolsHavingMaterials/' +
            (country_code && typeof country_code !== 'undefined' ? '?country_code=' + country_code : '');
          this.http.post(url, country_code, { headers: header }).subscribe(
            (response: any) => {
              if (response.success) {
                resolve(response.schools);
              } else {
                reject('Server is not responding');
              }
            },
            error => {
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.dataService.lang.usnexpectedError);
              }
            }
          );
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      });
    });
  }

  /** Get teacher list of a perticular school  from API.
   * @returns Array of teacher list or error
   */
  getTeachers(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getAllTeachers')
        .then((response: any) => {
          if (response) {
            console.log('tescherList', response);
            if (response.response == false) {
              resolve({ session: false, message: response.msg });
            } else if (response.response == true) {
              resolve({ session: true, data: response.profile });
            } else {
              reject(response.msg);
            }
          } else {
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.dataService.lang.usnexpectedError);
          }
        });
    });
  }

  /** Get student details.
   * @param {Object} data - user_no, session_id, cid, date, sid
   * @returns Student details or error
   */
  getStudentDetails(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          this.apiClient.postRequest(data, 'viewStudent/' + data.sid)
            .then((response: any) => {
              if (response) {
                if (!response.session) {
                  reject(response.msg);
                } else if (response.success) {
                  resolve({ session: true, data: response.details });
                } else {
                  reject(response.msg);
                }
              } else {
                reject(this.dataService.lang.networkNotWorking);
              }
            })
            .catch(error => {
              console.log(error);
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.dataService.lang.usnexpectedError);
              }
            });
        }
      });
    });
  }

  /** get today's dashboard/seminar stats for a school
   */
  todayDashboard(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          this.apiClient
            .postRequest(data, 'todayDashboard/' + data.school_id)
            .then((response: any) => {
              if (response) {
                if (!response.response) {
                  resolve({ session: false, message: response.msg });
                } else if (response.response) {
                  resolve({ session: true, data: response.response });
                  this.studentService.setStaticalData(data.user_no, response.response);
                } else {
                  reject(response.msg);
                }
              } else {
                reject(response.msg);
              }
            })
            .catch(error => {
              console.log(error);
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.dataService.lang.usnexpectedError);
              }
            });
        } else {
          this.studentService.getOfflineStatical(data.user_no).then(res => {
            resolve({ session: true, data: res });
          });
        }
      });
    });
  }
}
