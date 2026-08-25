import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';
import { ApiResponse } from '../../model/api-response.model';

export interface AppNotification {
  ID?: string | number;
  date?: string;
  notification?: string;
  notification_image?: string;
}

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
  getNotifications(data: Record<string, unknown>): Promise<ApiResponse<AppNotification[]>> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string; list?: AppNotification[] }>(data, 'getNotifications/' + data.school_id)
        .then((response) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              this.dbProvider.insertPrivateMessages(response.list || []);
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
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /**
   * delete user notification
   * @param data user_no, nid, session_id
   */
  deleteNotification(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<ApiResponse>(data, 'deleteNotifications')
        .then((response) => {
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
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }
}
