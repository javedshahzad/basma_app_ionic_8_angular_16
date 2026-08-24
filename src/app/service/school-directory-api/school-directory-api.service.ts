import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { StudentDataService } from '../student-data/student-data.service';
import { ApiResponse } from '../../model/api-response.model';
import { Student } from '../../model/student.model';
import { UserDetails } from '../../model/logged-in-user.model';

export interface School {
  id?: string | number;
  pic?: string;
  school_name?: string;
  detail?: string;
}

// getSchoolUsersList item shape — only the fields users-list.page.ts's
// template actually reads; the rest of the real payload is unenumerated.
export interface SchoolUser {
  user_no?: string | number;
  first_name?: string;
  last_name?: string;
  username?: string;
  pic?: string;
  [key: string]: unknown;
}

interface SchoolUsersHttpResponse {
  session?: boolean;
  msg?: string;
  response?: SchoolUser[];
}

interface GetChildrensHttpResponse {
  success?: boolean;
  child?: Student[];
  can_view_absent?: boolean;
  msg?: string;
}

interface GetChildrensResult {
  data?: Student[];
  permit?: boolean;
}

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

  getSchoolStudents(data: Record<string, unknown>): Promise<ApiResponse<Student[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<Student[]>>(data, 'get_school_stu').then((response) => {
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
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /* get all the users except teacher studet and parent */
  getAllUsers(users: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: SchoolUser[] }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<SchoolUsersHttpResponse>(users, 'getSchoolUsersList')
        .then((response) => {
          if (response) {
            console.log('alluserslist', response);
            if (response.session == false) {
              resolve({ session: false, message: response.msg });
            } else if (response.session == true) {
              resolve({ session: true, data: response.response });
            } else {
              reject(response.msg);
            }
          } else {
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** Get a parent's own children (and whether they can view absence data). */
  getChildrens(data: Record<string, unknown>): Promise<GetChildrensResult> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<GetChildrensHttpResponse>(data, 'getChildrens')
        .then((response) => {
          if (response) {
            if (response.success) {
              resolve({ data: response.child, permit: response.can_view_absent });
            } else {
              reject(response.msg);
            }
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** get all student of a school
  */
  getSchoolUsers(data: Record<string, unknown>): Promise<ApiResponse<UserDetails[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<UserDetails[]>>(data, 'get_school_users').then((response) => {
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

  getAllSchoolUsers(data: Record<string, unknown>): Promise<ApiResponse<UserDetails[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<UserDetails[]>>(data, 'get_school_users_all').then((response) => {
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

  getCountStudents(data: Record<string, unknown>): Promise<{ session: boolean; data?: number; success: boolean; msg?: string }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ data?: number; msg?: string }>(data, 'getCountStudents')
        .then((response) => {
          if (response) {
            resolve({ session: true, data: response.data, success: true, msg: response.msg });
          } else {
            reject(undefined);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** Get school list from API.
   * @returns Array of school list or error
   */
  getSchool(country_code: string): Promise<School[]> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          let url =
            environment.serverURL +
            'getSchoolsHavingMaterials/' +
            (country_code && typeof country_code !== 'undefined' ? '?country_code=' + country_code : '');
          this.http.post<{ success?: boolean; schools?: School[] }>(url, country_code, { headers: header }).subscribe(
            (response) => {
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
  getTeachers(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: UserDetails[] }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ response?: boolean; msg?: string; profile?: UserDetails[] }>(data, 'getAllTeachers')
        .then((response) => {
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
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** Get student details.
   * @param {Object} data - user_no, session_id, cid, date, sid
   * @returns Student details or error
   */
  getStudentDetails(data: Record<string, unknown>): Promise<{ session: boolean; data?: Student; message?: string }> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string; details?: Student }>(data, 'viewStudent/' + data.sid)
            .then((response) => {
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
            .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
        }
      });
    });
  }

  /** get today's dashboard/seminar stats for a school
   */
  todayDashboard(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: unknown }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          this.apiClient
            .postRequest<{ response?: unknown; msg?: string }>(data, 'todayDashboard/' + data.school_id)
            .then((response) => {
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
                reject(undefined);
              }
            })
            .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
        } else {
          this.studentService.getOfflineStatical(data.user_no).then(res => {
            resolve({ session: true, data: res });
          });
        }
      });
    });
  }
}
