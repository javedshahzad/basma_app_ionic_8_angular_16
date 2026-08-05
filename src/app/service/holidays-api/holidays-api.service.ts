import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { ApiResponse } from '../../model/api-response.model';

export interface HolidaysResponse extends ApiResponse {
  holidays?: { date: string }[];
  holiday_string?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HolidaysApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getHolidays(data: Record<string, unknown>): Promise<HolidaysResponse | false> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<HolidaysResponse>(data, 'getHolidays/' + data.school_id).then((response) => {
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
