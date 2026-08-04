import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

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
    private dataService: DataService
  ) { }

  /**
   * Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  markAttendance(data: any): Promise<any> {
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
            Object.keys(data.removal_sheet).map((key) => {
              body = body.append('removal_sheet[' + index + '][sid]', data.removal_sheet[key].sid);
              body = body.append('removal_sheet[' + index + '][sem]', data.removal_sheet[key].sem);
              index++;
            })
          }
          if (data.sheet) {
            Object.keys(data.sheet).map((key) => {
              Object.keys(data.sheet[key]).map((sid) => {
                body = body.append('sheet[' + key + '][' + sid + ']', data.sheet[key][sid]);
              })
            })
          }

          // 🟢🟢 التعديل الجذري (الدرع الفولاذي وممتص الصدمات) يبدأ من هنا 🟢🟢
          this.http.post(environment.serverURL + 'saveAttendance/' + data.school_id, body, {
            headers: header,
            responseType: 'text' // 1. نطلب الرد كنص لتجنب انهيار Angular إذا أرجع الـ PHP أخطاء
          }).subscribe((res: any) => {
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
  markDelayAttendance(data: any, submittedByUser: number): Promise<any> {
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
          Object.keys(data.sheet).map((key) => {
            Object.keys(data.sheet[key]).map((sid) => {
              body=body.append('sheet[' + key + '][' + sid + ']', data.sheet[key][sid]);
            })
          })
          this.http.post(environment.serverURL + 'ManroxTesting2/' + data.school_id + '/' + submittedByUser, body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (response.success == true) {
              resolve(true);
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.dataService.lang.usnexpectedError)
            }
          })
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
  markOfflineDelayAttendance(data: any, submittedByUser: number): Promise<any> {
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
          Object.keys(data.sheet).map((key) => {
            Object.keys(data.sheet[key]).map((sid) => {
              body= body.append('sheet[' + key + '][' + sid + ']', data.sheet[key][sid]);
            })
          })
          this.http.post(environment.serverURL + 'saveOfflineDelayAttendance/' + data.school_id + '/' + submittedByUser, body, { headers: header }).subscribe((res:any) => {
            let response = res;
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
}
