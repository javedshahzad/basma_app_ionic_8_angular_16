import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';

// The parent-connect "ticket" object — same shape whether it's shown in the
// list (parentconnect.page.ts, loop var `chatuser`) or the detail/thread
// view (connect-chat.page.ts, loop var `chat`).
export interface ParentConnectChat {
  id?: string | number;
  name?: string;
  pic?: string;
  title?: string;
  message?: string;
  message_image?: string;
  ticket_status?: string;
  updated_time?: string;
  created?: string;
  parent_user_no?: string | number;
  school_id?: string | number;
  typehere?: string;
}

export interface ChatMessage {
  id?: number | string;
  datetime?: string;
  message?: string;
  receiver?: string;
  msg_from?: string | number;
  msg_to?: string | number;
  attachment_url?: string;
  message_time?: string;
  sender_name?: string;
}

interface ChatAckResponse {
  session: boolean;
  message?: string;
}

/**
 * Parent-connect chat HTTP calls, split out of DataService. Depends on
 * DataService for `lang` (error-message fallbacks) and DatabaseService
 * for the offline-cache fallback in getConnectChatList.
 */
@Injectable({
  providedIn: 'root'
})
export class ParentConnectApiService {

  constructor(
    private http: HttpClient,
    private apiClient: ApiClient,
    private dataService: DataService,
    private dbProvider: DatabaseService
  ) { }

  getConnectChatList(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; chatList?: ParentConnectChat[] }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string; chat_list?: ParentConnectChat[] }>(data, 'getParentConnectChatList').then((response) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            this.dbProvider.insertParentConnectMessages(response.chat_list || []);
            resolve({ session: true, chatList: response.chat_list });
          } else {
            reject(response.msg)
          }
        } else {
          this.dbProvider.getParentConnectMessages().then((messages) => {
            resolve({ session: true, chatList: messages });
          }).catch((error) => this.apiClient.handleApiError(error, reject))
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /**
   * create parent connect chat
   * @param data user_no, school_id, session_id, message object
   */
  createParentConnectChat(
    data: Record<string, unknown> & {
      user_no: string | number;
      session_id: string;
      school_id: string | number;
      chat_msg?: Record<string, string | number>;
      message: Record<string, string>;
    }
  ): Promise<{ session: boolean; message?: string; url?: string; data?: unknown }> {
    console.log(data);
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("user_no", data.user_no);
          body= body.append("session_id", data.session_id);
          body= body.append("school_id", data.school_id);
          body= body.append("lang_code", data.lang_code as string);
          if(data.chat_msg){
             const chatMsg = data.chat_msg;
             Object.keys(chatMsg).forEach((key) => {
                 body= body.append('chat_msg[' + key + ']', chatMsg[key]);
              });
          }
          Object.keys(data.message).map((key) => {
            if (data.message[key] != '') {
              body= body.append('message[' + key + ']', data.message[key]);
            }
          })
          this.http.post<{ session?: boolean; success?: boolean; msg?: string }>(environment.serverURL + 'createParentConnectChat', body, { headers: header }).subscribe((response) => {
            if (!response.session) {
              resolve({ session: false, data: response, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, url: response.msg });
            } else {
              reject(response.msg)
            }
          }, (error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      })
    })
  }

  /**
   * Close parent connect chat
   * @param data user_no, chat_list_id, session_id
   */
  closeParentConnectChat(data: { user_no: string | number; chat_list_id: string | number; session_id: string }): Promise<ChatAckResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string }>(data, 'closeParentConnectChat').then((response) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /**
   * Reopen parent connect chat
   * @param data user_no, chat_list_id, session_id
   */
  reopenParentConnectChat(data: { user_no: string | number; chat_list_id: string | number; session_id: string }): Promise<ChatAckResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string }>(data, 'reopenParentConnectChat').then((response) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /**
   * Get parent connect chat messages
   * @param data user_no, school_id, user_type, session_id, chat_id
   */
  getParentConnectChatMessages(data: {
    user_no: string | number;
    school_id: string | number;
    user_type: string;
    session_id: string;
    chat_id: string | number;
    last_msg_id: number;
  }): Promise<{ session: boolean; message?: string; chat?: ChatMessage[] }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string; chat?: ChatMessage[] }>(data, 'getParentConnectChatMessages').then((response) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, chat: response.chat });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /**
   * Send parent connect chat message
   * @param data session_id, user_type, chat_msg object
   */
  sendParentConnectChatMsg(
    data: Record<string, unknown> & {
      session_id: string;
      user_no: string | number;
      user_type: string;
      chat_msg: Record<string, string | number>;
    }
  ): Promise<{ session: boolean; message?: string; msg_id?: string | number; attachment_url?: string }> {
    // console.log(data);
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body=body.append("session_id", data.session_id);
          body=body.append("user_no", data.user_no);
         body=body.append("user_type", data.user_type);
         body=body.append("lang_code", data.lang_code as string);
            Object.keys(data.chat_msg).forEach((key) => {
               body= body.append('chat_msg[' + key + ']', data.chat_msg[key]);
            });
          this.http.post<{ session?: boolean; success?: boolean; msg?: string; msg_id?: string | number; attachment_url?: string }>(environment.serverURL + 'sendParentConnectChatMessage', body, { headers: header }).subscribe((response) => {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              if(response.attachment_url){
                resolve({ session: true, message: response.msg, msg_id: response.msg_id, attachment_url: response.attachment_url });
              }else{
                resolve({ session: true, message: response.msg, msg_id: response.msg_id });
              }
            } else {
              reject(response.msg)
            }
          }, (error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      })
    })
  }
}
