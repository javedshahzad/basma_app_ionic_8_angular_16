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
  /** Set when this row was adopted from a pre-defined MoE stage; null for a
   * stage the school defined itself. */
  stageKey?: string | null;
  catalogKey?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface EducationStageInput {
  /** Set to adopt one of the pre-defined MoE stages -- names, age range and
   * the whole bylaw catalogue are inherited from it. Omit for a custom stage. */
  stage_key?: string | null;
  catalog_key?: string | null;
  name_ar?: string;
  name_en?: string;
  min_age?: number;
  max_age?: number;
}

/** A pre-defined MoE stage offered by getPresetStages -- not yet a row in the
 * school's own list until it is adopted. */
export interface PresetStage {
  stageKey: string;
  nameAr: string;
  nameEn: string;
  minAge: number;
  maxAge: number;
  sortOrder: number;
  catalogKey: string;
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

  /** The pre-defined stages the school can pick from (الابتدائية /
   * المتوسطة / الثانوية), each with its canonical age range. */
  getPresetStages(data: Record<string, unknown>): Promise<PresetStage[]> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<{ success?: boolean; data?: PresetStage[]; msg?: string }>(data, 'getPresetStages')
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
