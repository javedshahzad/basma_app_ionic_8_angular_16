import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

@Injectable({
  providedIn: 'root'
})
export class HolidaysApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getHolidays(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getHolidays/' + data.school_id).then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(response);
          } else {
            reject(response.msg)
          }
        } else {
          resolve(false);
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
