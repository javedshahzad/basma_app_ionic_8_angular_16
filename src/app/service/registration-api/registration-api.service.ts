import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';
import { ApiResponse } from '../../model/api-response.model';

/**
 * Teacher/user registration HTTP calls, split out of DataService.
 * Depends on DataService for `lang` (error-message fallbacks) and
 * DatabaseService for registerStudent's offline-classes fallback.
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationApiService {

  constructor(
    private apiClient: ApiClient,
    private http: HttpClient,
    private dataService: DataService,
    private dbProvider: DatabaseService
  ) { }

  registerTeacher(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'createNewTeacher').then((response) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response.msg);
          }
        } else {
            reject(response);
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

  /*=================create new user except teacher,parent and student======================*/

  registerNewUser(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'addNewUser').then((response) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response.msg);
          }
        } else {
            reject(response);
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

  /** Register new teacher.
   * @param {Object} data - contains user_no, school_id, Teacher Id, teacher name, teacher password
   * @returns Success or error msg
   */
  registerNewTeacher(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'registerNewTeacher')
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve(response.msg);
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

  registerNewParent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'registerNewParent')
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve(response.msg);
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

  /** Register new Student.
   * @param {Object} data - contains user_no, school_id, name, student_id
   * @returns Success or Error msg
   */
  registerStudent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'registerStudent')
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg });
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

  /** update teacher list of a perticular class of a school .
   * @returns updation status
   */
  updateTeacher(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      data.lang_code = environment.lang_code;
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      let body = new HttpParams();
      body = body.append('class_id', data.class_id);
      body = body.append('school_id', data.school_id);
      body = body.append('user_no', data.user_no);
      body = body.append('lang_code', data.lang_code);
      Object.keys(data.teachersList).map(key => {
        console.log('key', key);
        Object.keys(data.teachersList[key]).map(sid => {
          console.log('ap', sid);
          body = body.append('teachersList' + '[' + key + ']' + '[' + sid + ']', data.teachersList[key][sid]);
        });
      });

      this.http.post(environment.serverURL + 'updateTeachers', body, { headers: header }).subscribe(
        (response: any) => {
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
    });
  }
}
