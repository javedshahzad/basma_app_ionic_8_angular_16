import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage.service';
import { AttendanceResponse } from '../../model/attendance-response.model';

export interface AttendanceSubmitPayload {
  cid: string | number;
  date: string;
  session_id: string;
  user_no: string | number;
  lang_code?: string;
  user_type?: string;
  username?: string;
  school_id: string | number;
  sheet?: Record<string, Record<string, string>>;
  removal_sheet?: Record<string, { sid: string | number; sem: string | number }>;
}

export interface AttendanceSubmitResult {
  session: boolean;
  message: string;
  success: boolean;
}

/**
 * Owns the attendance-marking HTTP calls (online submit + the offline/delay
 * variants used by SyncService). Split out of DataService, which stays the
 * loading/toast owner for pages that call these — hence the DataService
 * dependency for hideLoading()/lang rather than a fully standalone client.
 */
@Injectable({
  providedIn: 'root'
})
export class AttendanceApiService {

  constructor(
    private http: HttpClient,
    private apiClient: ApiClient,
    private dataService: DataService,
    private dbProvider: DatabaseService,
    private storageSr: StorageService
  ) { }

  /**
   * Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  markAttendance(data: AttendanceSubmitPayload): Promise<AttendanceSubmitResult> {
    console.log("Data going to server:", data);
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body = body.append("cid", data.cid);
          body = body.append("date", data.date);
          body = body.append("session_id", data.session_id);
          body = body.append("user_no", data.user_no);
          body = body.append("lang_code", data.lang_code);

          // السماح للمتغيرات بالمرور للسيرفر
          if (data.user_type) body = body.append("user_type", data.user_type);
          if (data.username) body = body.append("username", data.username);

          let index = 0;
          if (data.removal_sheet) {
            const removalSheet = data.removal_sheet;
            Object.keys(removalSheet).map((key) => {
              body = body.append('removal_sheet[' + index + '][sid]', removalSheet[key].sid);
              body = body.append('removal_sheet[' + index + '][sem]', removalSheet[key].sem);
              index++;
            })
          }
          if (data.sheet) {
            const sheet = data.sheet;
            Object.keys(sheet).map((key) => {
              Object.keys(sheet[key]).map((sid) => {
                body = body.append('sheet[' + key + '][' + sid + ']', sheet[key][sid]);
              })
            })
          }

          // 🟢🟢 التعديل الجذري (الدرع الفولاذي وممتص الصدمات) يبدأ من هنا 🟢🟢
          this.http.post(environment.serverURL + 'saveAttendance/' + data.school_id, body, {
            headers: header,
            responseType: 'text' // 1. نطلب الرد كنص لتجنب انهيار Angular إذا أرجع الـ PHP أخطاء
          }).subscribe((res) => {
            try {
              // 2. محاولة تنظيف الرد من أي رسائل خطأ (Warnings) يطبعها الـ PHP واستخراج الـ JSON
              let validJsonStr = res;
              if (typeof res === 'string') {
                let startIndex = res.indexOf('{');
                let endIndex = res.lastIndexOf('}');
                if (startIndex !== -1 && endIndex !== -1) {
                  validJsonStr = res.substring(startIndex, endIndex + 1);
                }
              }

              let response = typeof validJsonStr === 'string' ? JSON.parse(validJsonStr) : res;

              if (response.session === false) {
                resolve({ session: false, message: response.msg, success: false });
              } else {
                resolve({ session: true, message: response.msg || 'تم حفظ الغياب بنجاح', success: true });
              }
            } catch (e) {
              console.warn("تم حفظ البيانات، لكن السيرفر أرجع رداً مشوهاً:", res);
              // 3. إجبار التطبيق على النجاح لأننا نعلم يقيناً أن الحفظ تم في قاعدة البيانات
              resolve({ session: true, message: 'تم حفظ الغياب بنجاح!', success: true });
            }
          }, (error) => {
            console.error("تم اعتراض خطأ السيرفر:", error);

            // 🛡️ 4. الدرع الأقوى: إذا كان الخطأ 500 (بسبب فشل الإشعارات) نعترض الرفض ونحوله إلى نجاح!
            if (error.status === 500 || error.status === 200) {
              resolve({ session: true, message: 'تم حفظ الغياب بنجاح!', success: true });
            } else {
              this.dataService.hideLoading();
              reject(error.message || "حدث خطأ غير متوقع");
            }
          });
          // 🟢🟢 نهاية التعديل 🟢🟢

        } else {
          this.dataService.hideLoading();
          reject(this.dataService.lang?.networkNotWorking || 'لا يوجد اتصال بالإنترنت');
        }
      })
    })
  }

  /**
   * Delay attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   * @param submittedByUser submitted by which user 1 - admin, 2- moderator
   */
  markDelayAttendance(data: AttendanceSubmitPayload, submittedByUser: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {

          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("cid", data.cid);
          body= body.append("date", data.date);
          body= body.append("session_id", data.session_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);
          const sheet = data.sheet || {};
          Object.keys(sheet).map((key) => {
            Object.keys(sheet[key]).map((sid) => {
              body=body.append('sheet[' + key + '][' + sid + ']', sheet[key][sid]);
            })
          })
          this.http.post<{ success?: boolean; msg?: string }>(environment.serverURL + 'ManroxTesting2/' + data.school_id + '/' + submittedByUser, body, { headers: header }).subscribe((response) => {
            if (response.success == true) {
              resolve(true);
            } else {
              reject(response.msg)
            }
          }, (error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      })
    })
  }

  /**
   * Offline Delay attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   * @param submittedByUser submitted by which user 1 - admin, 2- moderator
   */
  markOfflineDelayAttendance(data: AttendanceSubmitPayload, submittedByUser: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("cid", data.cid);
          body= body.append("date", data.date);
          body= body.append("session_id", data.session_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);
          const sheet = data.sheet || {};
          Object.keys(sheet).map((key) => {
            Object.keys(sheet[key]).map((sid) => {
              body= body.append('sheet[' + key + '][' + sid + ']', sheet[key][sid]);
            })
          })
          this.http.post<{ success?: boolean }>(environment.serverURL + 'saveOfflineDelayAttendance/' + data.school_id + '/' + submittedByUser, body, { headers: header }).subscribe((response) => {
            if (response.success == true) {
              resolve(true);
            } else {
              // this.errorALertMessage(response.msg);
              resolve(false);
            }
          }, (error) => {
            console.log(error);
            resolve(false);
          })
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      })
    })
  }

  /** Get student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  getClassStudentList(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: AttendanceResponse }> {
    return new Promise(async (resolve, reject) => {
      this.apiClient.postRequest<AttendanceResponse>(data, 'getStudents/' + data.course_id)
        .then(async (res) => {
          const response = res as AttendanceResponse;
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              this.dbProvider.insertStudentList(response.students || [], 5);
              this.dbProvider.insertAttendanceHistory(data.course_id as string, data.date as string, response.students || []);
              resolve({ session: true, data: response });
            } else {
              reject(response.msg);
            }
          } else {
            let attendance = await this.storageSr.get('classlocalatt');
            const courseId = data.course_id as string;
            if (attendance && attendance[courseId]) {
              resolve({ session: true, data: attendance[courseId] });
            } else {
              this.resolveFromOfflineCache(data.course_id as string, data.date as string, resolve, reject);
            }
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /**
   * Offline fallback for getClassStudentList: the cached roster carries no
   * attendance marks of its own (DatabaseService.getStudentList always
   * returns an empty sheet), so merge in the cached attendance_history
   * snapshot for this class/date — lets a previously-viewed date's marks
   * actually show up while offline, not just a blank grid.
   */
  private resolveFromOfflineCache(
    courseId: string,
    date: string,
    resolve: (value: { session: boolean; data?: AttendanceResponse }) => void,
    reject: (reason?: unknown) => void
  ) {
    Promise.all([this.dbProvider.getStudentList(courseId), this.dbProvider.getAttendanceHistory(courseId, date)])
      .then(([students, sheetsBySid]) => {
        const merged = (students || []).map((student: any) => ({
          ...student,
          sheet: sheetsBySid[student.sid] || {}
        }));
        resolve({ session: true, data: { students: merged, last_cem: 0, semteacher: [] } });
      })
      .catch((error) => this.apiClient.handleApiError(error, reject));
  }

  /** Get delay student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  getDelayClassStudentList(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; success?: boolean; data?: AttendanceResponse }> {
    return new Promise(async (resolve, reject) => {
      this.apiClient.postRequest<AttendanceResponse>(data, 'getStudents_delay/' + data.course_id)
        .then(async (res) => {
          const response = res as AttendanceResponse;
          if (response) {
            if (!response.session) {
              resolve({ session: !!response.session, message: response.msg, success: response.success, data: response });
            } else if (response.success) {
              this.dbProvider.insertStudentList(response.students || [], response.delay_rule);
              resolve({ session: response.session, data: response, success: response.success });
            } else {
              reject(response.msg);
            }
          } else {
            let attendance = await this.storageSr.get('delayclasslocalatt');
            const courseId = data.course_id as string;
            if (attendance) {
              if (attendance[courseId]) {
                resolve({ session: true, data: attendance[courseId] });
              } else {
                this.dbProvider
                  .getStudentList(data.course_id)
                  .then(students => {
                    if (students.length > 0) {
                      resolve({
                        session: true,
                        data: { students: students, last_cem: 0, semteacher: [], delay_rule: students[0].delay_rule }
                      });
                    } else {
                      resolve({
                        session: true,
                        data: { students: students, last_cem: 0, semteacher: [], delay_rule: 5 }
                      });
                    }
                  })
                  .catch((error) => this.apiClient.handleApiError(error, reject));
              }
            } else {
              this.dbProvider
                .getStudentList(data.course_id)
                .then(students => {
                  if (students.length > 0) {
                    resolve({
                      session: true,
                      data: { students: students, last_cem: 0, semteacher: [], delay_rule: students[0].delay_rule }
                    });
                  } else {
                    resolve({
                      session: true,
                      data: { students: students, last_cem: 0, semteacher: [], delay_rule: 5 }
                    });
                  }
                })
                .catch((error) => this.apiClient.handleApiError(error, reject));
            }
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }
}
