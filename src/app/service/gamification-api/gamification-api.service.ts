import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { ApiResponse } from '../../model/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GamificationApiService {

  constructor(
    private apiClient: ApiClient,
    private http: HttpClient,
    private dataService: DataService
  ) { }

  getStudentInventory(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'getStudentInventory');
  }

  equipTitle(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'equipTitle');
  }

  craftSkillTitle(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'craftSkillTitle');
  }

  getStudentProfileDashboard(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'getStudentProfileDashboard');
  }

  getPointsValue(): Promise<any> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      this.http.get(environment.serverURL + 'getPointsValue', { headers: header }).subscribe(
        res => {
          resolve(res);
        },
        e => {
          resolve(e);
        }
      );
    });
  }

  addStudentPoints(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest(data, 'addStudentPoints')
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve(response);
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
    });
  }

  // 🔴 دالة جلب بيانات شجرة المهارات للطالب (تم حل مشكلة CORS)
  getStudentSkillTree(data: any) {
    return new Promise((resolve, reject) => {
      // 1. تحويل البيانات إلى FormData لتتطابق مع سياسة السيرفر وتتجاوز الـ CORS
      let formData = new FormData();
      formData.append('sid', data.sid);

      // 2. تجهيز الرابط (تأكد أن تستخدم environment.serverURL أو this.serverURL حسب ما يعمل لديك)
      let url = environment.serverURL + 'getStudentSkillTree';

      // 3. إرسال الـ formData بدلاً من كائن الـ data العادي
      this.http.post(url, formData).subscribe(
        (res: any) => {
          resolve(res);
        },
        err => {
          reject(err);
        }
      );
    });
  }
}
