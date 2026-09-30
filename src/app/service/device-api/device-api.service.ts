import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { ApiResponse } from '../../model/api-response.model';

export interface Device {
  device_id?: string;
  os_type?: string;
  is_logged_out?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceApiService {

  constructor(private apiClient: ApiClient) { }

  GetAllDevices(data: Record<string, unknown>): Promise<ApiResponse<Device[]>> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<ApiResponse<Device[]>>(data, 'get_devices_by_user_no').then((response) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  LogInSingleDevice(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'update_device_by_id_and_user_no').then((response) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  LogOutAllDevice(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'update_device_logout_status').then((response) => {
        if (response) {
            resolve({ session: response.session, data: response.data,success:response.success});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  CheckDeviceLogInStatus(data: Record<string, unknown>): Promise<ApiResponse<{ is_logged_out?: string; user?: { status?: string } }>> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<ApiResponse<{ is_logged_out?: string; user?: { status?: string } }>>(data, 'get_device_by_id_and_user_no').then((response) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }

  Delete_device(data: Record<string, unknown>): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'Delete_device').then((response) => {
        if (response) {
            resolve({ session: response.session, msg: response.msg,success:response.success});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject))
    })
  }
}
