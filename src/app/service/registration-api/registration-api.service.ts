import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

/**
 * Teacher/user registration HTTP calls, split out of DataService.
 * Depends on DataService for `lang` (error-message fallbacks).
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  registerTeacher(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'createNewTeacher').then((response: any) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response.msg);
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

  /*=================create new user except teacher,parent and student======================*/

  registerNewUser(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'addNewUser').then((response: any) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response.msg);
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
