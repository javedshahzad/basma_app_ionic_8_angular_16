import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

// Shared shape for the "no envelope, raw passthrough" methods below — every
// confirmed caller reads only `.msg`/`.response`/`.success` off the raw
// backend object, in varying combinations (defensive coding against an
// inconsistent envelope, not a sign these are genuinely different shapes).
export interface RawActionResponse {
  // requestTodeleteSchoolAccount/deleteSchoolPermanentlyRequest use this as
  // a plain boolean flag ("did the request go through") on failure, but as
  // an object carrying the school's new deactivate_date on success —
  // confirmed by real consumers of both (settings.page.ts, classlist.page.ts).
  response?: boolean | { deactivate_date?: string };
  success?: boolean;
  msg?: string;
}

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

  deleteStudentClass(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'deleteStudentClass').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  deleteStudent(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'deleteStudent').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  deleteTeacher(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'deleteTeacher').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  deleteParent(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'deleteParent').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  /** Deletes a user (except parent, student, and teacher). */
  deleteUser(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'deleteUser').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  deleteNote(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'deleteNotes').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  updateStudentProfile(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'updateStudentProfile').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  updateStudentPhone(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'updateStudentPhone').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  SendPushNotification(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'SendPushNotification').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  requestTodeleteSchoolAccount(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'RequestdeleteSchool').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  deleteSchoolPermanentlyRequest(data: Record<string, unknown>): Promise<RawActionResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<RawActionResponse>(data, 'deleteSchoolPermanentlyRequest').then((response) => {
        if (response) {
          resolve(response);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject));
    });
  }

  updateTeacherProfile(data: Record<string, unknown> & { class: unknown }): Promise<{ session: boolean; message?: string; data?: string } | string> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      data.lang_code = environment.lang_code;
      let body = new HttpParams();
      Object.keys(data).forEach(function (key) {
        body = body.append(key, data[key] as string | number | boolean);
      });
      body['class'] = [];
      // `class` is really an array of {cid, ...} records, iterated here via
      // Object.keys() (works fine on arrays at runtime); typed as unknown
      // and cast here rather than in the public signature.
      const classList = data.class as Record<string, Record<string, string | number>>;
      Object.keys(classList).map((key) => {
        Object.keys(classList[key]).map((sid) => {
          body = body.append('classes' + '[' + key + ']' + '[' + sid + ']', classList[key][sid]);
        });
      });

      this.httpClient.post<{ response?: boolean; msg?: string }>(environment.serverURL + 'updateTeacherProfile', body, { headers: header }).subscribe((response) => {
        if (response) {
          if (response.response == false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response == true) {
            resolve({ session: true, data: response.msg });
          } else {
            resolve(response.msg);
          }
        }
      }, (error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  updateUserProfile(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: string } | string> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
      header.append('content-type', 'application/json');
      data.lang_code = environment.lang_code;
      let body = new HttpParams();
      Object.keys(data).forEach(function (key) {
        body = body.append(key, data[key] as string | number | boolean);
      });

      this.httpClient.post<{ response?: boolean; msg?: string }>(environment.serverURL + 'updateNewUser', body, { headers: header }).subscribe((response) => {
        if (response) {
          if (response.response == false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response == true) {
            resolve({ session: true, data: response.msg });
          } else {
            resolve(response.msg);
          }
        }
      }, (error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  /**
   * Update user image
   * @param data Base64 image data
   */
  updateUserImage(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; url?: string }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string; imageUrl?: string }>(data, 'updateStudentImage/' + data.sid)
        .then((response) => {
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
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  sendPushMessageToStudentParent(data: Record<string, unknown>): Promise<{ session: boolean; data?: unknown }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ response?: unknown; msg?: string }>(data, 'sendPushMessageToStudentParent')
        .then((res) => {
          const response = res as { response?: unknown; msg?: string };
          if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }
}
