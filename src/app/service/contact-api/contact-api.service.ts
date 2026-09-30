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

  sendContact(data: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'sendcontact').then((response) => {
        if (response) {
          if (response.success) {
            resolve(true);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }
}
