import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { Course } from '../courses-api/courses-api.service';

export interface FollowupField {
  id?: string | number;
  marks_id?: string | number;
  field_id?: string | number;
  field_name?: string;
  field_max_marks?: string | number;
  marks_on_present?: string | number;
  marks?: string | number;
  absent_marks?: string | number | boolean;
}

export interface TeacherClassAssignment {
  courses?: Course;
  is_selected?: boolean;
}

// Distinct from Student.sheet (the attendance dictionary): in this
// follow-up-marks context, a student's `sheet` is an ARRAY of per-field
// mark entries, not a 'cem-N'-keyed dictionary — a different endpoint,
// a different shape, confirmed by its consumer (followup-student-list.page.ts).
export interface FollowupMarkEntry {
  marks?: string | number;
  marks_id?: string | number;
  field_id?: string | number;
  field_max_marks?: string | number;
  field_name?: string;
}

export interface FollowupStudentRecord {
  sid?: string | number;
  cid?: string | number;
  name?: string;
  pic?: string;
  sheet?: FollowupMarkEntry[];
  unacceptable_absent_days?: number;
  suspend_days?: number;
  medical_days?: number;
  student_points?: number;
  frozen_until?: string;
  current_streak?: number;
  // Client-computed (followup-student-list.page.ts), not sent by the backend:
  isFrozen?: boolean;
}

export interface FollowupStudentListResponse {
  session?: boolean;
  success?: boolean;
  msg?: string;
  students?: FollowupStudentRecord[];
  submittedMsg?: string;
}

interface SaveMarksHttpResponse {
  session?: boolean;
  success?: boolean;
  msg?: string;
}

interface SaveMarksResult {
  session: boolean;
  message?: string;
}

/**
 * Follow-up field configuration + teacher/class assignment HTTP calls,
 * split out of DataService. Depends on DataService for `lang`
 * (error-message fallbacks).
 */
@Injectable({
  providedIn: 'root'
})
export class FollowupFieldsApiService {

  constructor(
    private http: HttpClient,
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getFollowupFields(data: Record<string, unknown>): Promise<{ session: boolean; data?: FollowupField[] }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ success?: boolean; result?: FollowupField[]; msg?: string }>(data, 'getFollowupFields').then((response) => {
        if (response) {
           if (response.success) {
            resolve({ session: true, data: response.result});
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /** delete fields.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  deleteFollowupFields(data: Record<string, unknown>): Promise<{ session: boolean; data?: FollowupField[] }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ success?: boolean; result?: FollowupField[]; msg?: string }>(data, 'deleteFollowupFields').then((response) => {
        if (response) {
           if (response.success) {
            resolve({ session: true, data: response.result});
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  setTeachersClass(data: Record<string, unknown> & { school_id: string | number; updates: unknown }): Promise<{ session: boolean; message?: string; data?: string } | string> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
           let body = new HttpParams();
           data.lang_code = environment.lang_code;
           Object.keys(data).forEach(function (key) {
              body = body.append(key, data[key] as string | number | boolean);
          });
           // `updates` is really an array of {cid, status} records, iterated
           // here via Object.keys() (works fine on arrays at runtime); typed
           // as unknown and cast here rather than in the public signature.
           const updates = data.updates as Record<string, Record<string, string | number | boolean>>;
           Object.keys(updates).map((key) => {
            Object.keys(updates[key]).map((sid) => {
              body=body.append('courcesData'+'['+ key+']'+'['+sid+']' , updates[key][sid]);
            })
          })
      this.http.post<{ response?: boolean; msg?: string }>( environment.serverURL + 'setTeachersClass/'+ data.school_id,body, { headers: header }).subscribe((response) => {
        if (response) {
         console.log('tescherList',response);
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
            resolve({ session: true, data: response.msg});
          } else {
            resolve(response.msg)
          }
        } else {
        }
      }, (error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    })
  }

  /** set inpu5t field for follow up student.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  saveFollowupFields(data: Record<string, unknown> & { field: unknown }): Promise<{ session: boolean; message?: string; data?: FollowupField[] } | string> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
           let body = new HttpParams();
           data.lang_code = environment.lang_code;
           Object.keys(data).forEach(function (key) {
             if(key != 'field') body = body.append(key, data[key] as string | number | boolean);
          });
           // `field` is really an array of FollowupField records, iterated
           // here via Object.keys() (works fine on arrays at runtime); typed
           // as unknown and cast here rather than in the public signature.
           const field = data.field as Record<string, Record<string, string | number | boolean>>;
           Object.keys(field).map((key) => {
            Object.keys(field[key]).map((sid) => {
              body=body.append('field'+'['+ key+']'+'['+sid+']' , field[key][sid]);
            })
          })
      this.http.post<{ success?: boolean; msg?: string; result?: FollowupField[] }>( environment.serverURL + 'saveFollowupFields',body, { headers: header }).subscribe((response) => {
        if (response) {
         console.log('tescherList',response);
          if (response.success==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.success==true) {
            resolve({ session: true, data: response.result});
          } else {
            resolve(response.msg)
          }
        } else {
        }
      }, (error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    })
  }

  /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
   */
  getTeachersClass(data: Record<string, unknown>): Promise<{ session: boolean; data?: TeacherClassAssignment[] }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ success?: boolean; courses?: TeacherClassAssignment[]; msg?: string }>(data, 'getTeachersClass/' + data.school_id)
        .then((response) => {
          if (response) {
            if (response.success) {
              resolve({ session: true, data: response.courses });
            } else {
              reject(response.msg);
            }
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** Get follow up fields.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
   */
  getSelectedCourses(data: Record<string, unknown>): Promise<{ session: boolean; data?: Course[] }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ success?: boolean; selectedCourses?: Course[]; msg?: string }>(data, 'getSelectedCourses/' + data.school_id)
        .then((response) => {
          if (response) {
            if (response.success) {
              resolve({ session: true, data: response.selectedCourses });
            } else {
              reject(response.msg);
            }
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /** Get student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  getFollowUpStudentList(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: FollowupStudentListResponse }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<FollowupStudentListResponse>(data, 'getFollowUpStudentList/' + data.course_id)
        .then((res) => {
          const response = res as FollowupStudentListResponse;
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, data: response });
          } else {
            reject(response.msg);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /**
   * Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  submitMarks(
    data: Record<string, unknown> & {
      course_id: string | number;
      date: string;
      session_id: string;
      user_no: string | number;
      school_id: string | number;
    },
    marksheet: unknown
  ): Promise<SaveMarksResult> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body = body.append('cid', data.course_id);
          body = body.append('date', data.date);
          body = body.append('session_id', data.session_id);
          body = body.append('user_no', data.user_no);
          body = body.append('lang_code', data.lang_code as string);

          // `marksheet` is really an array of per-student mark records,
          // iterated here via Object.keys() (works fine on arrays at
          // runtime); typed as unknown and cast here rather than in the
          // public signature.
          const marksheetData = marksheet as Record<string, Record<string, string | number>>;
          Object.keys(marksheetData).map(key => {
            Object.keys(marksheetData[key]).map(sid => {
              body = body.append('marksheet[' + key + '][' + sid + ']', marksheetData[key][sid]);
            });
          });

          this.http
            .post<SaveMarksHttpResponse>(environment.serverURL + 'saveStudentMarks/' + data.school_id, body, { headers: header })
            .subscribe(
              (response) => {
                if (!response.session) {
                  resolve({ session: false, message: response.msg });
                } else if (response.success) {
                  resolve({ session: true, message: response.msg });
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

  /** Delete student marks according to course and user id with selected date.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  deleteFollowUpStudentList(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: FollowupStudentListResponse }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<FollowupStudentListResponse>(data, 'deleteFollowUpStudentList/' + data.course_id)
        .then((res) => {
          const response = res as FollowupStudentListResponse;
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, data: response });
          } else {
            reject(response.msg);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }
}
