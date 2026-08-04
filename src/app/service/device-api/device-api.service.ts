import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceApiService {

  constructor(private apiClient: ApiClient) { }

  GetAllDevices(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'get_devices_by_user_no').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  LogInSingleDevice(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'update_device_by_id_and_user_no').then((response: any) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  LogOutAllDevice(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'update_device_logout_status').then((response: any) => {
        if (response) {
            resolve({ session: response.session, data: response.data,success:response.success});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  CheckDeviceLogInStatus(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'get_device_by_id_and_user_no').then((response: any) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  Delete_device(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'Delete_device').then((response: any) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
}
