import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

/**
 * Student/class notes HTTP calls, split out of DataService. Depends on
 * DataService for `lang` (error-message fallbacks).
 */
@Injectable({
  providedIn: 'root'
})
export class NotesApiService {

  constructor(
    private apiClient: ApiClient,
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
}
