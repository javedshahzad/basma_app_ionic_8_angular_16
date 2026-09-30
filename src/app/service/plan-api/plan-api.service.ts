import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { ApiResponse } from '../../model/api-response.model';

export interface Plan {
  name?: string;
  slug?: string;
  no_of_classes?: string | number;
  no_of_students?: string | number;
  news_post_per_day?: string;
  e_learning_material?: string;
  student_report_pdf?: string;
  student_report_excel?: string;
  follow_up_teacher_report_pdf?: string;
  follow_up_teacher_report_excel?: string;
}

export interface UserPlan {
  plan?: { slug?: string };
  exp_date?: string;
  billingPeriodUnit?: string;
  isExpire?: boolean;
  cardColor?: string;
}

interface CheckUserPlanResponse {
  response?: boolean;
  msg?: string;
}

/**
 * Subscription plan HTTP calls, split out of DataService. Depends on
 * DataService for `lang` (error-message fallbacks).
 */
@Injectable({
  providedIn: 'root'
})
export class PlanApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getPlan(data: Record<string, unknown>): Promise<ApiResponse<Plan[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<Plan[]>>(data, 'getPlan').then((response) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response);
          }
        } else {
            reject(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /** Checks the current user's subscription-plan status (despite the
   * legacy endpoint name, this has nothing to do with PDFs). */
  checkUserPlan(data: Record<string, unknown>): Promise<CheckUserPlanResponse> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<CheckUserPlanResponse>(data, 'check_user_plan')
        .then((response) => {
          if (response) {
            if (response.response) {
              resolve(response);
            } else {
              reject(response);
            }
          } else {
            reject(response);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  getUserPlan(data: Record<string, unknown>): Promise<ApiResponse<UserPlan>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<UserPlan>>(data, 'getUserPlan').then((response) => {
        if (response) {
            resolve(response);
        } else {
            reject(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  purchase(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'purchase').then((response) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response);
          }
        } else {
            reject(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  ApplyVoucherCode(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse>(data, 'ApplyVoucherCode')
        .then((response) => {
          if (response) {
            resolve({ session: response.session, success: response.success, msg: response.msg });
          } else {
            reject(undefined);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }
}
