import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { ApiResponse } from '../../model/api-response.model';
import { environment } from '../../../environments/environment';

export interface StudentInventory {
  success?: boolean;
  wallet?: Record<string, string | number>;
  unlocked_titles?: string[];
  unlocked_badges?: string[];
  active_title?: string | { title_ar?: string; title_name?: string; title?: string };
}

export interface SkillData {
  cognitive?: number;
  social?: number;
  discipline?: number;
  emotional?: number;
  practical?: number;
}

export interface StudentProfileDashboard {
  success?: boolean;
  inventory?: {
    active_title?: string | { code?: string; title_name?: string };
    unlocked_badges?: string[];
  };
  skill_tree?: {
    skill_tree_total?: number;
    skills?: SkillData;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GamificationApiService {

  constructor(
    private apiClient: ApiClient,
    private http: HttpClient,
    private dataService: DataService
  ) { }

  getStudentInventory(data: Record<string, unknown>): Promise<StudentInventory | false> {
    return this.apiClient.postRequest(data, 'getStudentInventory');
  }

  equipTitle(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'equipTitle');
  }

  craftSkillTitle(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'craftSkillTitle');
  }

  getStudentProfileDashboard(data: Record<string, unknown>): Promise<StudentProfileDashboard | false> {
    return this.apiClient.postRequest(data, 'getStudentProfileDashboard');
  }

  getPointsValue(): Promise<{ points?: number[] }> {
    return new Promise((resolve) => {
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      this.http.get<{ points?: number[] }>(environment.serverURL + 'getPointsValue', { headers: header }).subscribe(
        res => {
          resolve(res);
        },
        e => {
          resolve(e);
        }
      );
    });
  }

  addStudentPoints(data: { sid?: string | number; userId?: string | number; points?: string | number }): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse>(data, 'addStudentPoints')
        .then((response) => {
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
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  // 🔴 دالة جلب بيانات شجرة المهارات للطالب (تم حل مشكلة CORS)
  getStudentSkillTree(data: { sid?: string | number }): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // 1. تحويل البيانات إلى FormData لتتطابق مع سياسة السيرفر وتتجاوز الـ CORS
      let formData = new FormData();
      formData.append('sid', String(data.sid));

      // 2. تجهيز الرابط (تأكد أن تستخدم environment.serverURL أو this.serverURL حسب ما يعمل لديك)
      let url = environment.serverURL + 'getStudentSkillTree';

      // 3. إرسال الـ formData بدلاً من كائن الـ data العادي
      this.http.post(url, formData).subscribe(
        (res) => {
          resolve(res);
        },
        err => {
          reject(err);
        }
      );
    });
  }
}
