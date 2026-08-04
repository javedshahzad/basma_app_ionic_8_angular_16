import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';

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

  getConnectChatList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getParentConnectChatList').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            this.dbProvider.insertParentConnectMessages(response.chat_list);
            resolve({ session: true, chatList: response.chat_list });
          } else {
            reject(response.msg)
          }
        } else {
          this.dbProvider.getParentConnectMessages().then((messages) => {
            resolve({ session: true, chatList: messages });
          }).catch((error) => {
            reject(error);
          })
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

  /**
   * create parent connect chat
   * @param data user_no, school_id, session_id, message object
   */
  createParentConnectChat(data: any): Promise<any> {
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
          body= body.append("lang_code", data.lang_code);
          if(data.chat_msg){
             Object.keys(data.chat_msg).forEach(function (key) {
                 body= body.append('chat_msg[' + key + ']', data.chat_msg[key]);
              });
          }
          Object.keys(data.message).map((key) => {
            if (data.message[key] != '') {
              body= body.append('message[' + key + ']', data.message[key]);
            }
          })
          this.http.post(environment.serverURL + 'createParentConnectChat', body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (!response.session) {
              resolve({ session: false,data:response, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, url: response.msg });
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.dataService.lang.usnexpectedError)
            }
          })
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
  closeParentConnectChat(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'closeParentConnectChat').then((response: any) => {
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

  /**
   * Reopen parent connect chat
   * @param data user_no, chat_list_id, session_id
   */
  reopenParentConnectChat(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'reopenParentConnectChat').then((response: any) => {
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

  /**
   * Get parent connect chat messages
   * @param data user_no, school_id, user_type, session_id, chat_id
   */
  getParentConnectChatMessages(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getParentConnectChatMessages').then((response: any) => {
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

  /**
   * Send parent connect chat message
   * @param data session_id, user_type, chat_msg object
   */
  sendParentConnectChatMsg(data: any): Promise<any> {
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
         body=body.append("lang_code", data.lang_code);
            Object.keys(data.chat_msg).forEach(function (key) {
               body= body.append('chat_msg[' + key + ']', data.chat_msg[key]);
            });
          this.http.post(environment.serverURL + 'sendParentConnectChatMessage', body, { headers: header }).subscribe((res:any) => {
            let response = res;
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
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.dataService.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      })
    })
  }
}
