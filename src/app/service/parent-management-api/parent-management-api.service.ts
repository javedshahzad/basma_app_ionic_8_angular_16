import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

export interface Parent {
  user_no?: string | number;
  profile?: string;
  pic?: string;
  name?: string;
  first_name?: string;
  username?: string;
  datetime?: string;
  access_mode?: string;
  student_info?: { name?: string }[];
  isChecked?: boolean;
  // docs/SELF_REGISTRATION_VIA_SCHOOL_CODE_PLAN.md §6.7 -- only present on
  // pending (getNewParents) rows; a self-registered parent may have no
  // linked student yet (cross-school/nonexistent id at signup time).
  student_linked?: boolean;
  student_names?: string[];
}

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

  getRequestedParents(data: Record<string, unknown>): Promise<{ session: boolean; message?: string; data?: Parent[] }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ response?: boolean; msg?: string; parents?: Parent[] }>(data, 'getNewParents').then((response) => {
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
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  getAllParents(data: Record<string, unknown>): Promise<{ session: boolean; data?: Parent[] }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ response?: Parent[] }>(data, 'getAllParents').then((response) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /** take action on requested registered parents.
   * @returns status of action
   * @param parent id
   * @param school id
  */
  acceptRequestedParents(data: Record<string, unknown>): Promise<{ session: boolean }> {
    return new Promise((resolve, reject) => {
         //console.log('requtedprrr=>>>',data);
      this.apiClient.postRequest<{ response?: boolean }>(data, 'acceptParentRequest').then((response) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false });
          } else {
            resolve({ session: true });
          }
        } else {
          reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  changeParentStatus(data: Record<string, unknown>): Promise<{ session: boolean; msg?: string }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ response?: boolean; msg?: string }>(data, 'changeParentStatus').then((response) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false,msg:response.msg });
          } else {
            resolve({ session: true,msg:response.msg });
          }
        } else {
          reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /** delete requested registered parents.
   * @returns status of action
   * @param parent id
   * @param school id
  */
  deleteRequestedParents(data: Record<string, unknown>): Promise<{ session: boolean }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ response?: boolean }>(data, 'deleteParentRequest').then((response) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false });
          } else {
            resolve({ session: true });
          }
        } else {
          reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  createNewParent(data: Record<string, unknown>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'createNewParent').then((response) => {
        if (response) {
          if(response.success) {
            resolve(response.msg || '');
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }
}
