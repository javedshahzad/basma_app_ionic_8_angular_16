import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { ApiResponse } from '../../model/api-response.model';

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

  getPlan(data: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<any[]>>(data, 'getPlan').then((response) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response);
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

  getUserPlan(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getUserPlan').then((response) => {
        if (response) {
            resolve(response);
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

  ApplyVoucherCode(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'ApplyVoucherCode')
        .then((response: any) => {
          if (response) {
            resolve({ session: response.session, success: response.success, msg: response.msg });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }
}
