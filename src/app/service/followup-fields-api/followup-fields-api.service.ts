import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

/**
 * Follow-up field configuration + teacher/class assignment HTTP calls,
 * split out of DataService. Depends on DataService for `lang`
 * (error-message fallbacks).
 */
@Injectable({
  providedIn: 'root'
})
export class FollowupFieldsApiService {

  constructor(
    private http: HttpClient,
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getFollowupFields(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getFollowupFields').then((response: any) => {
        if (response) {
           if (response.success) {
            resolve({ session: true, data: response.result});
          } else {
            reject(response.msg)
          }
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

  /** delete fields.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  deleteFollowupFields(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'deleteFollowupFields').then((response: any) => {
        if (response) {
           if (response.success) {
            resolve({ session: true, data: response.result});
          } else {
            reject(response.msg)
          }
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

  /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  setTeachersClass(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
           let body = new HttpParams();
           data.lang_code = environment.lang_code;
           Object.keys(data).forEach(function (key) {
              body = body.append(key, data[key]);
          });
           Object.keys(data.updates).map((key) => {
            Object.keys(data.updates[key]).map((sid) => {
              body=body.append('courcesData'+'['+ key+']'+'['+sid+']' , data.updates[key][sid]);
            })
          })
      this.http.post( environment.serverURL + 'setTeachersClass/'+ data.school_id,body, { headers: header }).subscribe((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
            resolve({ session: true, data: response.msg});
          } else {
            resolve(response.msg)
          }
        } else {
        }
      },(error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.dataService.lang.usnexpectedError)
        }
      });
    })
  }

  /** set inpu5t field for follow up student.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  saveFollowupFields(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
           let body = new HttpParams();
           data.lang_code = environment.lang_code;
           Object.keys(data).forEach(function (key) {
             if(key != 'field') body = body.append(key, data[key]);
          });
           Object.keys(data.field).map((key) => {
            Object.keys(data.field[key]).map((sid) => {
              body=body.append('field'+'['+ key+']'+'['+sid+']' , data.field[key][sid]);
            })
          })
      this.http.post( environment.serverURL + 'saveFollowupFields',body, { headers: header }).subscribe((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.success==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.success==true) {
            resolve({ session: true, data: response.result});
          } else {
            resolve(response.msg)
          }
        } else {
        }
      },(error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.dataService.lang.usnexpectedError)
        }
      });
    })
  }
}
