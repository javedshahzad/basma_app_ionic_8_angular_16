import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';

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
  getCourses(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getCourses/' + data.school_id)
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              this.dbProvider.insertClasses(response.courses);
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
              .catch(error => {
                reject(error);
              });
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

  /** delete a class from a school.
   * @returns status of deletion
   */
  deleteClass(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'deleteClass')
        .then((response: any) => {
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

  /** get all seminars and their total present absent total student
  */
  getSeminarClassList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getSeminarClassList/' + data.school_id)
        .then((response: any) => {
          if (response) {
            if (!response.response) {
              resolve({ session: false, message: response.msg });
            } else if (response.response) {
              resolve({ session: true, data: response.response });
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
    });
  }

  /** reorder all classes
  */
  reorderClasses(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);

      data.lang_code = environment.lang_code;
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/x-www-form-urlencoded');
      let body: HttpParams = new HttpParams();
      body = body.append('school_id', data.school_id);
      body = body.append('user_no', data.user_no);
      body = body.append('lang_code', data.lang_code);
      Object.keys(data.list).map(key => {
        Object.keys(data.list[key]).map(sid => {
          body = body.append('list[' + key + '][' + sid + ']', data.list[key][sid]);
        });
      });
      this.http.post(environment.serverURL + 'reorderClasses', body, { headers: header }).subscribe(
        (res: any) => {
          let response = res;
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
  createNewCourse(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'createCourse')
        .then((response: any) => {
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

  /**
   * Update course description
   * @param data user_no, session_id, cid, course object
   */
  updateCourseDesc(data: any): Promise<any> {
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
          body = body.append('course[name]', data.course.name);
          body = body.append('course[desc]', data.course.desc);
          this.http.post(environment.serverURL + '/manageCourse', body, { headers }).subscribe(
            res => {
              let response = res;
              if (!response['session']) {
                resolve({ session: false, message: response['msg'] });
              } else if (response['success']) {
                resolve({ session: true, data: response['courses'] });
              } else {
                reject(response['msg']);
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
