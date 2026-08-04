import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class GamificationApiService {

  constructor(private apiClient: ApiClient) { }

  getStudentInventory(data: any): Promise<any> {
    return this.apiClient.postRequest(data, 'getStudentInventory');
  }

  equipTitle(data: any): Promise<any> {
    return this.apiClient.postRequest(data, 'equipTitle');
  }

  craftSkillTitle(data: any): Promise<any> {
    return this.apiClient.postRequest(data, 'craftSkillTitle');
  }

  getStudentProfileDashboard(data: any): Promise<any> {
    return this.apiClient.postRequest(data, 'getStudentProfileDashboard');
  }
}
