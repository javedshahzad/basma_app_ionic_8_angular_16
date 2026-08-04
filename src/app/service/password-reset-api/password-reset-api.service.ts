import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

/**
 * Forgot-password flow HTTP calls, split out of DataService. Depends on
 * DataService for `lang` (error-message fallbacks).
 */
@Injectable({
  providedIn: 'root'
})
export class PasswordResetApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  submitEmail(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'forgot_password').then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
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

  /** Check OTP for sorgot password
  */
  checkOtp(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'checkOtp').then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
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

  /** reset pass. for sorgot password
  */
  resetPassword(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'reset_password').then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
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
