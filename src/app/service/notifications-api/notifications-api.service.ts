import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';

/**
 * Private-message/notification HTTP calls, split out of DataService.
 * Depends on DataService for `lang` (error-message fallbacks) and on
 * DatabaseService for getNotifications' offline cache read/write.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationsApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService,
    private dbProvider: DatabaseService
  ) { }

  /** Get notification of the school.
   * @param {Object} data- user_no, school_id, session_id
   * @returns list of notifications or error
   */
  getNotifications(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getNotifications/' + data.school_id)
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              this.dbProvider.insertPrivateMessages(response.list);
              resolve({ session: true, data: response.list });
            } else {
              reject(response.msg);
            }
          } else {
            this.dbProvider.getPrivateMessages().then(messages => {
              resolve({ session: true, data: messages });
            });
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.dataService.lang.usnexpectedError);
          }
        });
    });
  }

  /**
   * delete user notification
   * @param data user_no, nid, session_id
   */
  deleteNotification(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteNotifications')
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg });
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.dataService.lang.networkNotWorking);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.dataService.lang.usnexpectedError);
          }
        });
    });
  }
}
