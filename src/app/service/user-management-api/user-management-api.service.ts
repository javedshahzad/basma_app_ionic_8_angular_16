import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

/**
 * User/student/teacher/parent CRUD + push-notification/school-deletion-request
 * calls, split out of DataService. Depends on DataService for `lang`
 * (error-message fallbacks) only — no UI side effects (toasts/alerts) live
 * here, those stay with the caller, same as the other extracted API services.
 */
@Injectable({
  providedIn: 'root'
})
export class UserManagementApiService {

  constructor(
    private apiClient: ApiClient,
    private httpClient: HttpClient,
    private dataService: DataService
  ) { }

  deleteStudentClass(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteStudentClass').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  deleteStudent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteStudent').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  deleteTeacher(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteTeacher').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  deleteParent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteParent').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  /** Deletes a user (except parent, student, and teacher). */
  deleteUser(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteUser').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  deleteNote(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteNotes').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  updateStudentProfile(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'updateStudentProfile').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  updateStudentPhone(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'updateStudentPhone').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  SendPushNotification(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'SendPushNotification').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  requestTodeleteSchoolAccount(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'RequestdeleteSchool').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  deleteSchoolPermanentlyRequest(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteSchoolPermanentlyRequest').then((response: any) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  updateTeacherProfile(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      data.lang_code = environment.lang_code;
      let body = new HttpParams();
      Object.keys(data).forEach(function (key) {
        body = body.append(key, data[key]);
      });
      body['class'] = [];
      Object.keys(data.class).map((key) => {
        Object.keys(data.class[key]).map((sid) => {
          body = body.append('classes' + '[' + key + ']' + '[' + sid + ']', data.class[key][sid]);
        });
      });

      this.httpClient.post(environment.serverURL + 'updateTeacherProfile', body, { headers: header }).subscribe((response: any) => {
        if (response) {
          if (response.response == false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response == true) {
            resolve({ session: true, data: response.msg });
          } else {
            resolve(response.msg);
          }
        }
      }, (error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message);
        } else {
          reject(this.dataService.lang.usnexpectedError);
        }
      });
    });
  }

  updateUserProfile(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
      header.append('content-type', 'application/json');
      data.lang_code = environment.lang_code;
      let body = new HttpParams();
      Object.keys(data).forEach(function (key) {
        body = body.append(key, data[key]);
      });

      this.httpClient.post(environment.serverURL + 'updateNewUser', body, { headers: header }).subscribe((response: any) => {
        if (response) {
          if (response.response == false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response == true) {
            resolve({ session: true, data: response.msg });
          } else {
            resolve(response.msg);
          }
        }
      }, (error) => {
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
   * Update user image
   * @param data Base64 image data
   */
  updateUserImage(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'updateStudentImage/' + data.sid)
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, url: response.imageUrl });
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

  sendPushMessageToStudentParent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'sendPushMessageToStudentParent')
        .then((response: any) => {
          if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg);
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
