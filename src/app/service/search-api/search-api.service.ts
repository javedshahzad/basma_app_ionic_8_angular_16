import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class SearchApiService {

  constructor(private apiClient: ApiClient) { }

  searchUser(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'search_user').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  searchAllUser(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'search_user_all').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  /** Search all student of School from API.
   * @returns Array of users list or error
  */
  serachStudent(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'search_student').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  searTeacher(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getTeacherWithPagging').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  /** Search all parent of School from API.
   * @returns Array of users list or error
  */
  serachParent(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'serachParent').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
}
