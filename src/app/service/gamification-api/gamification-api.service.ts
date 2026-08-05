import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { ApiResponse } from '../../model/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class GamificationApiService {

  constructor(private apiClient: ApiClient) { }

  getStudentInventory(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'getStudentInventory');
  }

  equipTitle(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'equipTitle');
  }

  craftSkillTitle(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'craftSkillTitle');
  }

  getStudentProfileDashboard(data: Record<string, unknown>): Promise<ApiResponse | false> {
    return this.apiClient.postRequest(data, 'getStudentProfileDashboard');
  }
}
