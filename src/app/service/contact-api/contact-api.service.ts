import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

@Injectable({
  providedIn: 'root'
})
export class ContactApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  sendContact(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'sendcontact').then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(true);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
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
