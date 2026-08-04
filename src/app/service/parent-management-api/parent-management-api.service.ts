import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

/**
 * Requested-parent management HTTP calls, split out of DataService.
 * Depends on DataService for `lang` (error-message fallbacks).
 */
@Injectable({
  providedIn: 'root'
})
export class ParentManagementApiService {

  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getRequestedParents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getNewParents').then((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
           // this.dbProvider.insertClasses(response.courses);
            resolve({ session: true, data: response.parents});
          } else {
            reject(response.msg)
          }
        } else {
          // this.dbProvider.getClasses().then((classes) => {
          //   resolve({ session: true, data: classes });
          // }).catch((error) => {
          //   reject(error);
          // })
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

  getAllParents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getAllParents').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
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

  /** take action on requested registered parents.
   * @returns status of action
   * @param parent id
   * @param school id
  */
  acceptRequestedParents(data): Promise<any> {
    return new Promise((resolve, reject) => {
         //console.log('requtedprrr=>>>',data);
      this.apiClient.postRequest(data, 'acceptParentRequest').then((response: any) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false });
          } else {
            resolve({ session: true });
          }
        } else {
          reject(response.msg)
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

  changeParentStatus(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'changeParentStatus').then((response: any) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false,msg:response.msg });
          } else {
            resolve({ session: true,msg:response.msg });
          }
        } else {
          reject(response.msg)
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

  /** delete requested registered parents.
   * @returns status of action
   * @param parent id
   * @param school id
  */
  deleteRequestedParents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'deleteParentRequest').then((response: any) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false });
          } else {
            resolve({ session: true });
          }
        } else {
          reject(response.msg)
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

  createNewParent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'createNewParent').then((response: any) => {
        if (response) {
          if(response.success) {
            resolve(response.msg);
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
}
