import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

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

  getPlan(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getPlan').then((response: any) => {
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

  getUserPlan(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getUserPlan').then((response: any) => {
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

  purchase(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'purchase').then((response: any) => {
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
}
