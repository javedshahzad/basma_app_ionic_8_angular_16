import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';

export interface Course {
  cid?: string | number;
  name?: string;
  desc?: string;
  code?: string;
  semno?: string | number;
  backgroundColor?: string;
}

export interface ActiveLink {
  link?: string;
  parent_link_active?: string;
}

export interface SeminarClassGroup {
  classess?: { class_name?: string; present?: string | number; absent?: string | number }[];
  group_total_pre?: string | number;
  group_total_abs?: string | number;
  group_total_stu?: string | number;
}

export interface SeminarClassList {
  records?: SeminarClassGroup[];
  all_present_total?: string | number;
  all_absent_total?: string | number;
  all_student_total?: string | number;
  total_per_sent?: string | number;
}

/**
 * Course/class management HTTP calls, split out of DataService. Depends
 * on DataService for `lang` (error-message fallbacks) and on
 * DatabaseService for getCourses' offline class cache.
 */
@Injectable({
  providedIn: 'root'
})
export class CoursesApiService {

  constructor(
    private apiClient: ApiClient,
    private http: HttpClient,
    private dataService: DataService,
    private dbProvider: DatabaseService
  ) { }

  /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
   */
  getCourses(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: Course[]; linkData?: ActiveLink }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ session?: boolean; msg?: string; success?: boolean; courses?: Course[]; activeLink?: ActiveLink }>(data, 'getCourses/' + data.school_id)
        .then((response) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              this.dbProvider.insertClasses(response.courses || []);
              resolve({ session: true, data: response.courses, linkData: response.activeLink });
            } else {
              reject(response.msg);
            }
          } else {
            this.dbProvider
              .getClasses()
              .then(classes => {
                resolve({ session: true, data: classes });
              })
              .catch((error) => this.apiClient.handleApiError(error, reject));
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** delete a class from a school.
   * @returns status of deletion
   */
  deleteClass(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: string }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ response?: boolean; msg?: string }>(data, 'deleteClass')
        .then((response) => {
          if (response) {
            console.log('tescherList', response);
            if (response.response == false) {
              resolve({ session: false, message: response.msg });
            } else if (response.response == true) {
              resolve({ session: true, data: response.msg });
            } else {
              reject(response.msg);
            }
          } else {
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** get all seminars and their total present absent total student
  */
  getSeminarClassList(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: SeminarClassList }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ response?: SeminarClassList; msg?: string }>(data, 'getSeminarClassList/' + data.school_id)
        .then((response) => {
          if (response) {
            if (!response.response) {
              resolve({ session: false, message: response.msg });
            } else if (response.response) {
              resolve({ session: true, data: response.response });
            } else {
              reject(response.msg);
            }
          } else {
            reject(undefined);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** reorder all classes
  */
  reorderClasses(data: { school_id: string | number; user_no: string | number; lang_code?: string; list: unknown }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // console.log(data);

      data.lang_code = environment.lang_code;
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/x-www-form-urlencoded');
      let body: HttpParams = new HttpParams();
      body = body.append('school_id', data.school_id);
      body = body.append('user_no', data.user_no);
      body = body.append('lang_code', data.lang_code);
      // `list` is really an array of per-class {cid, sem, ...} records, but
      // is iterated here via Object.keys() (works fine on arrays at runtime
      // too — Object.keys returns numeric-string indices); typed as unknown
      // and cast here so the array/record structural mismatch doesn't leak
      // into the public signature.
      const list = data.list as Record<string, Record<string, string | number>>;
      Object.keys(list).map(key => {
        Object.keys(list[key]).map(sid => {
          body = body.append('list[' + key + '][' + sid + ']', list[key][sid]);
        });
      });
      this.http.post<{ success?: boolean }>(environment.serverURL + 'reorderClasses', body, { headers: header }).subscribe(
        (response) => {
          if (response.success == true) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error => {
          console.log(error);
          resolve(false);
        }
      );
    });
  }

  /** Register new course.
   * @param {Object} data - contains user_no, school_id, code, name, desc, semno
   * @returns Success or error msg
   */
  createNewCourse(data: Record<string, unknown>): Promise<{ session: boolean; message?: string }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string }>(data, 'createCourse')
        .then((response) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg });
            } else {
              reject(response.msg);
            }
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /**
   * Update course description
   * @param data user_no, session_id, cid, course object
   */
  updateCourseDesc(data: { cid: string | number; session_id: string; user_no: string | number; lang_code?: string; course: { name?: string; desc?: string } }): Promise<{ session: boolean; message?: string; data?: Course[] }> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let headers = new HttpHeaders();
          headers.set('Content-Type', 'application/x-www-form-urlencoded');
          let body = new HttpParams();
          body = body.append('cid', data.cid);
          body = body.append('session_id', data.session_id);
          body = body.append('user_no', data.user_no);
          body = body.append('lang_code', data.lang_code);
          body = body.append('course[name]', data.course.name || '');
          body = body.append('course[desc]', data.course.desc || '');
          this.http.post<{ session?: boolean; success?: boolean; msg?: string; courses?: Course[] }>(environment.serverURL + '/manageCourse', body, { headers }).subscribe(
            (response) => {
              if (!response.session) {
                resolve({ session: false, message: response.msg });
              } else if (response.success) {
                resolve({ session: true, data: response.courses });
              } else {
                reject(response.msg);
              }
            },
            error => {
              console.log(error);
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
}
