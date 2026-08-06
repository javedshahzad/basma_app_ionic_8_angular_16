import { Injectable } from '@angular/core';
import { HttpHeaders, HttpRequest, HttpClient } from '@angular/common/http';
import { map, tap, last } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

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

  getStudentNotes(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getStudentNote/' + data.sid).then((response: any) => {
        if (response) {
          if (response.status) {
            resolve(response);
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

  getClassNotes(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'studentClassNotes').then((response: any) => {
        if (response) {
          if (response.response) {
            resolve(response.response);
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

  getAllClassNotes(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'all_classNotes').then((response: any) => {
        if (response) {
          if (response.response) {
            resolve(response.response);
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

  addStudentNote(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'addStudentNote').then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(response.note_id);
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
   * Submit Student note
   * @param data sid, note, user_id
   */
  EditStudentNote(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'editStudentNote').then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(response.note_id);
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

  deleteStudentNote(data: any, note_id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteStudentNote/' + note_id).then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(true);
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

  //==========added on 28/12/21 for print class notes as pdf=========
  printAllClassNotes(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, data.is_multi ? 'printMultipleClassNotes' : 'printClassNotes')
        .then((response: any) => {
          if (response.success) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }

  editAbsentNotes(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'editAbsentNotes')
        .then((response: any) => {
          if (response) {
            resolve({ session: true, data: response, message: response.mg });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }

  createclassNotes(data) {
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
  saveAbsenceNote(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'saveNote')
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg, res: response });
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

  /**
   * Absence delete note
   * @param data user_no, session_id
   * @param note_id Note id which will be deleted
   */
  deleteAbsenceNote(data: any, note_id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteNote/' + note_id)
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
