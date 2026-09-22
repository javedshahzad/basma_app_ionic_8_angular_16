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
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
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
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /** Register new teacher.
   * @param {Object} data - contains user_no, school_id, Teacher Id, teacher name, teacher password
   * @returns Success or error msg
   */
  registerNewTeacher(data: Record<string, unknown>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'registerNewTeacher')
        .then((response) => {
          if (response) {
            if (response.success) {
              resolve(response.msg || '');
            } else {
              reject(response.msg);
            }
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  registerNewParent(data: Record<string, unknown>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'registerNewParent')
        .then((response) => {
          if (response) {
            if (response.success) {
              resolve(response.msg || '');
            } else {
              reject(response.msg);
            }
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /**
   * docs/SELF_REGISTRATION_VIA_SCHOOL_CODE_PLAN.md §5.1/§6.4/§6.5 --
   * public, unauthenticated join-code registration flow, replacing the
   * invite-link registerNewTeacher/registerNewParent above for new
   * signups. All three calls are public (no user_no/session_id needed).
   */
  lookupSchoolByCode(joinCode: string): Promise<{ school_name: string; teacher_registration_enabled: boolean; parent_registration_enabled: boolean }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; msg?: string; school_name?: string; teacher_registration_enabled?: boolean; parent_registration_enabled?: boolean }>(
          { join_code: joinCode },
          'lookupSchoolByCode'
        )
        .then((response) => {
          if (response && response.success) {
            resolve({
              school_name: response.school_name || '',
              teacher_registration_enabled: !!response.teacher_registration_enabled,
              parent_registration_enabled: !!response.parent_registration_enabled
            });
          } else {
            reject(response && response.msg);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  registerTeacherByCode(data: { join_code: string; name: string; username: string; password: string }): Promise<string> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'registerTeacherByCode')
        .then((response) => {
          if (response && response.success) {
            resolve(response.msg || '');
          } else {
            reject(response && response.msg);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  registerParentByCode(data: { join_code: string; name: string; username: string; password: string; student_id: string }): Promise<{ msg: string; studentLinked: boolean }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; msg?: string; student_linked?: boolean }>(data, 'registerParentByCode')
        .then((response) => {
          if (response && response.success) {
            resolve({ msg: response.msg || '', studentLinked: !!response.student_linked });
          } else {
            reject(response && response.msg);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** Register new Student.
   * @param {Object} data - contains user_no, school_id, name, student_id
   * @returns Success or Error msg
   */
  registerStudent(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: unknown }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string }>(data, 'registerStudent')
        .then((response) => {
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
              .catch((error) => this.apiClient.handleApiError(error, reject));
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** update teacher list of a perticular class of a school .
   * @returns updation status
   */
  updateTeacher(data: { class_id: string | number; school_id: string | number; user_no: string | number; session_id?: string; lang_code?: string; teachersList: unknown }): Promise<{ session: boolean; message?: string; data?: string }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      data.lang_code = environment.lang_code;
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      let body = new HttpParams();
      body = body.append('class_id', data.class_id);
      body = body.append('school_id', data.school_id);
      body = body.append('user_no', data.user_no);
      body = body.append('session_id', data.session_id ?? '');
      body = body.append('lang_code', data.lang_code);
      // `teachersList` is really an array of {teacher_no, ...} records,
      // iterated here via Object.keys() (works fine on arrays at runtime);
      // typed as unknown and cast here rather than in the public signature.
      const teachersList = data.teachersList as Record<string, Record<string, string | number>>;
      Object.keys(teachersList).map(key => {
        console.log('key', key);
        Object.keys(teachersList[key]).map(sid => {
          console.log('ap', sid);
          body = body.append('teachersList' + '[' + key + ']' + '[' + sid + ']', teachersList[key][sid]);
        });
      });

      this.http.post<{ response?: boolean; msg?: string }>(environment.serverURL + 'updateTeachers', body, { headers: header }).subscribe(
        (response) => {
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
