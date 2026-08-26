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

  addStudentPoints(data: { sid?: string | number; userId?: string | number; points?: string | number; skill_type?: string; session_id?: string }): Promise<ApiResponse> {
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

  // Was previously sent as multipart/form-data to work around a CORS issue
  // against the legacy PHP backend. The new Node.js API only parses
  // application/x-www-form-urlencoded bodies (per its OpenAPI spec) -- a
  // multipart body reaches the server but never populates req.body, so every
  // call silently failed with "Please fill all required fields." regardless
  // of which fields were sent. Every other endpoint in this app already
  // posts url-encoded via ApiClient successfully against this same host, so
  // the CORS workaround is no longer needed either.
  getStudentSkillTree(data: { sid?: string | number; session_id?: string }): Promise<unknown> {
    return this.apiClient.postRequest(data, 'getStudentSkillTree');
  }
}
