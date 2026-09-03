import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';

export interface EducationStage {
  id: number;
  schoolId: number;
  nameAr: string;
  nameEn: string;
  minAge: number;
  maxAge: number;
  sortOrder: number;
  createdAt?: string;
}

export interface EducationStageInput {
  name_ar: string;
  name_en: string;
  min_age: number;
  max_age: number;
  sort_order?: number;
}

/**
 * Per-school education stages (المراحل التعليمية) -- owned entirely by the
 * school that creates them, managed from Settings. See
 * خطة الاستفادة من اللائحة التنظيمية لتطوير بصمة.pdf, Phase 2.
 */
@Injectable({
  providedIn: 'root'
})
export class EducationStagesApiService {
  constructor(private apiClient: ApiClient) {}

  getEducationStages(data: Record<string, unknown>): Promise<EducationStage[]> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; data?: EducationStage[]; msg?: string }>(data, 'getEducationStages')
        .then(response => {
          if (response && response.success) {
            resolve(response.data || []);
          } else {
            reject(response ? response.msg : undefined);
          }
        })
        .catch(error => this.apiClient.handleApiError(error, reject));
    });
  }

  addEducationStage(data: Record<string, unknown> & EducationStageInput): Promise<EducationStage> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; data?: EducationStage; msg?: string }>(data, 'addEducationStage')
        .then(response => {
          if (response && response.success && response.data) {
            resolve(response.data);
          } else {
            reject(response ? response.msg : undefined);
          }
        })
        .catch(error => this.apiClient.handleApiError(error, reject));
    });
  }

  updateEducationStage(data: Record<string, unknown> & { id: number }): Promise<EducationStage> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; data?: EducationStage; msg?: string }>(data, 'updateEducationStage')
        .then(response => {
          if (response && response.success && response.data) {
            resolve(response.data);
          } else {
            reject(response ? response.msg : undefined);
          }
        })
        .catch(error => this.apiClient.handleApiError(error, reject));
    });
  }

  deleteEducationStage(data: Record<string, unknown> & { id: number }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; msg?: string }>(data, 'deleteEducationStage')
        .then(response => {
          if (response && response.success) {
            resolve(true);
          } else {
            reject(response ? response.msg : undefined);
          }
        })
        .catch(error => this.apiClient.handleApiError(error, reject));
    });
  }
}
