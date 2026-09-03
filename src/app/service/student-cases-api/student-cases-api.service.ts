import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { ApiResponse } from '../../model/api-response.model';

export interface CaseTypeOption {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
}

export interface CaseListRow {
  case_id: number;
  status: 'open' | 'in_progress' | 'referred' | 'closed';
  confidentiality: 'standard' | 'restricted';
  opened_at: string;
  closed_at?: string | null;
  case_type?: CaseTypeOption | null;
  summary?: string | null;
  assigned_specialist_id?: number | null;
}

export interface CaseFollowupRow {
  id: number;
  follow_up_type: 'note' | 'parent_contact' | 'meeting' | 'referral_note';
  description: string;
  contact_phone?: string | null;
  created_by: number;
  created_at: string;
}

export interface CaseReferralRow {
  id: number;
  referred_by: number;
  referred_at: string;
  reason: string;
  committee_response?: string | null;
  responded_at?: string | null;
}

export interface CaseModeratorGrantRow {
  user_no: number;
  granted_by: number;
  granted_at: string;
}

export interface CaseDetail extends CaseListRow {
  opened_by: number;
  closed_by?: number | null;
  closure_outcome?: string | null;
  followups: CaseFollowupRow[];
  referrals: CaseReferralRow[];
  moderator_grants: CaseModeratorGrantRow[];
}

export interface CaseSpecialistRow {
  user_no: number;
  first_name: string;
  qualified_case_type_ids: number[];
}

/**
 * Student case management (خطة إدارة حالات الطلاب, Chapter 10 bylaw) —
 * open/assign/follow-up/refer/close, with server-side confidentiality
 * enforcement. Mirrors staging.basmapp's src/api/v1/routes/studentCases.routes.js
 * 1:1. Does not touch phone_no/phone_no_two/medical_condition or
 * updateStudentPhone — see UserManagementApiService for those, unchanged.
 */
@Injectable({
  providedIn: 'root'
})
export class StudentCasesApiService {
  constructor(
    private apiClient: ApiClient,
    private dataService: DataService
  ) {}

  private unwrap<T>(response: ApiResponse<T> | false, reject: (reason?: unknown) => void, resolve: (value: T) => void): void {
    if (response && response.success && response.response !== undefined) {
      resolve(response.response);
    } else if (response) {
      reject(response.msg || this.dataService.lang.usnexpectedError);
    } else {
      reject(this.dataService.lang.networkNotWorking);
    }
  }

  getCaseTypes(data: Record<string, unknown>): Promise<CaseTypeOption[]> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<CaseTypeOption[]>>(data, 'getCaseTypes')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  getStudentCases(data: Record<string, unknown>): Promise<CaseListRow[]> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<CaseListRow[]>>(data, 'getStudentCases')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  getCaseDetail(data: Record<string, unknown>): Promise<CaseDetail> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<CaseDetail>>(data, 'getCaseDetail')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  openStudentCase(data: Record<string, unknown>): Promise<{ case_id: number }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<{ case_id: number }>>(data, 'openStudentCase')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  assignCaseSpecialist(data: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<boolean>>(data, 'assignCaseSpecialist')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  addCaseFollowup(data: Record<string, unknown>): Promise<{ followup_id: number }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<{ followup_id: number }>>(data, 'addCaseFollowup')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  referStudentCase(data: Record<string, unknown>): Promise<{ referral_id: number }> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<{ referral_id: number }>>(data, 'referStudentCase')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  closeStudentCase(data: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<boolean>>(data, 'closeStudentCase')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  getCaseSpecialists(data: Record<string, unknown>): Promise<CaseSpecialistRow[]> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<CaseSpecialistRow[]>>(data, 'getCaseSpecialists')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  setCaseSpecialistQualification(data: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<boolean>>(data, 'setCaseSpecialistQualification')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  grantCaseModeratorAccess(data: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<boolean>>(data, 'grantCaseModeratorAccess')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  revokeCaseModeratorAccess(data: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.apiClient
        .postRequest<ApiResponse<boolean>>(data, 'revokeCaseModeratorAccess')
        .then(response => this.unwrap(response, reject, resolve))
        .catch(error => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }
}
