import { Injectable } from '@angular/core';
import { HttpHeaders, HttpRequest, HttpClient } from '@angular/common/http';
import { map, tap, last } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

export interface StudentNote {
  id?: string | number;
  note?: string;
  date?: string;
  rating?: number | string;
  new_ratting?: string;
  user_id?: string | number;
  pic?: string;
  teacher_pic?: string;
  first_name?: string;
  last_name?: string;
  // Client-computed (student-detail.page.ts):
  display_pic?: string;
  selections?: string[];
}

export interface StudentNotesResponse {
  status?: boolean;
  msg?: string;
  notes?: StudentNote[];
  agg_ranking?: number;
  total_notes?: number;
  total_rating?: Record<string, number>;
}

export interface ClassNote {
  send_to?: string;
  datetime?: string;
  examNoteDate?: string;
  description?: string;
  image_file?: string;
  file_link?: string;
  pdf?: string;
}

/**
 * Student/class notes HTTP calls, split out of DataService. Depends on
 * DataService for `lang` (error-message fallbacks) and, for
 * createclassNotes' upload-progress reporting, DataService.getStatusMessage()
 * (which also pushes to DataService's own shared uploadProgress/events
 * Subjects that some pages still subscribe to directly).
 */
@Injectable({
  providedIn: 'root'
})
export class NotesApiService {

  constructor(
    private apiClient: ApiClient,
    private http: HttpClient,
    private dataService: DataService
  ) { }

  getStudentNotes(data: Record<string, unknown>): Promise<StudentNotesResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<StudentNotesResponse>(data, 'getStudentNote/' + data.sid).then((response) => {
        if (response) {
          if (response.status) {
            resolve(response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  getClassNotes(data: Record<string, unknown>): Promise<ClassNote[]> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ response?: ClassNote[]; msg?: string }>(data, 'studentClassNotes').then((response) => {
        if (response) {
          if (response.response) {
            resolve(response.response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  getAllClassNotes(data: Record<string, unknown>): Promise<ClassNote[]> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ response?: ClassNote[]; msg?: string }>(data, 'all_classNotes').then((response) => {
        if (response) {
          if (response.response) {
            resolve(response.response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  addStudentNote(data: Record<string, unknown>): Promise<string | number> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; note_id?: string | number; msg?: string }>(data, 'addStudentNote').then((response) => {
        if (response) {
          if (response.success) {
            resolve(response.note_id);
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
   * Submit Student note
   * @param data sid, note, user_id
   */
  EditStudentNote(data: Record<string, unknown>): Promise<string | number> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; note_id?: string | number; msg?: string }>(data, 'editStudentNote').then((response) => {
        if (response) {
          if (response.success) {
            resolve(response.note_id);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  deleteStudentNote(data: Record<string, unknown>, note_id: string | number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'deleteStudentNote/' + note_id).then((response) => {
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

  //==========added on 28/12/21 for print class notes as pdf=========
  printAllClassNotes(data: Record<string, unknown> & { is_multi?: boolean }): Promise<{ session: boolean; data?: string }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ success?: boolean; response?: string; msg?: string }>(data, data.is_multi ? 'printMultipleClassNotes' : 'printClassNotes')
        .then((res) => {
          const response = res as { success?: boolean; response?: string; msg?: string };
          if (response.success) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  editAbsentNotes(data: Record<string, unknown>): Promise<{ session: boolean; data?: { msg?: string }; message?: string }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ msg?: string; mg?: string }>(data, 'editAbsentNotes')
        .then((response) => {
          if (response) {
            resolve({ session: true, data: response, message: response.mg });
          } else {
            reject(undefined);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  createclassNotes(data: any) {
    let header = new HttpHeaders();
    header.append('Content-Type', 'application/json');
    data.lang_code = environment.lang_code;
    let req = new HttpRequest('POST', environment.serverURL + 'createNotes', data, {
      responseType: 'arraybuffer',
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.dataService.getStatusMessage(event)),
      tap(message => message),
      last()
    );
  }

  /**
   * Absence save note
   * @param data sid, cid, date, note, user_no, session_id
   */
  saveAbsenceNote(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; note_id?: string | number }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string; note_id?: string | number }>(data, 'saveNote')
        .then((response) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg, note_id: response.note_id });
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

  /**
   * Absence delete note
   * @param data user_no, session_id
   * @param note_id Note id which will be deleted
   */
  deleteAbsenceNote(data: Record<string, unknown>, note_id: string | number): Promise<{ session: boolean; message?: string }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string }>(data, 'deleteNote/' + note_id)
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
