import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

export interface ExitDayRecord {
  id?: string | number;
  date?: string;
  time?: string;
}

export interface LeaveRecord {
  id?: string | number;
  start_date?: string;
  end_date?: string;
  amount_days?: string | number;
}

export interface StudentReportsSummary {
  suspend?: LeaveRecord[];
  exitdays?: ExitDayRecord[];
  medical?: LeaveRecord[];
  exittoday?: unknown[];
}

export interface DegreeViolation {
  id?: string | number;
  description?: string;
  desc_number?: string | number;
}

export interface DegreeAction {
  id?: string | number;
  description?: string;
  action_number?: string | number;
  /** Escalation step this action belongs to (الإجراء الأول/الثاني/الثالث). */
  tier?: string | number;
  tier_label?: string;
}

export interface Degree {
  id?: string | number;
  /** Arabic label. `name_en` is the English one; violations and actions have
   * no English equivalent (the source regulation is Arabic-only). */
  name?: string;
  name_en?: string;
  /** Degrees are per-education-stage now, so the same name (البسيطة …) appears
   * once per stage the school has adopted. Filter by this before display. */
  stage_id?: string | number;
  degree_key?: string;
}

export interface PledgesReport {
  id?: string | number;
  date?: string;
  degree_name?: string;
  degree_name_en?: string;
  violation_desc_number?: string | number;
  violation_description?: string;
  violation_desc?: string;
  action_desc_number?: string | number;
  action_description?: string;
  action_desc?: string;
}

/**
 * Student behaviour/degree/pledge report HTTP calls, split out of
 * DataService. Depends on DataService for `lang` (error-message
 * fallbacks) used by getMarksReport/getStudentReport.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportsApiService {

  constructor(
    private apiClient: ApiClient,
    private http: HttpClient,
    private dataService: DataService
  ) { }

  getStudentReports(data: Record<string, unknown>): Promise<{ session: boolean; data?: StudentReportsSummary }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ response?: StudentReportsSummary }>(data, 'getStudentReports').then((response) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  GetAllDegrees(data: Record<string, unknown>): Promise<{ session: boolean; data?: Degree[]; success: boolean }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ data?: Degree[] }>(data, 'getAllDegress').then((response) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  GetAllDegreeActions(data: Record<string, unknown>): Promise<{ session: boolean; data?: DegreeAction[]; success: boolean }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ data?: DegreeAction[] }>(data, 'getViolationActions').then((response) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  GetAllCallOfStudentReport(data: Record<string, unknown>): Promise<{ session: boolean; data?: unknown[]; success: boolean }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ data?: unknown[] }>(data, 'GetCallOfStudentsRepoerts').then((response) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  GetStudentPledgesReport(data: Record<string, unknown>): Promise<{ session: boolean; data?: PledgesReport[]; success: boolean }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ data?: PledgesReport[] }>(data, 'GetStudentPledgesReport').then((response) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  generateStudentPledgesReportPDF(data: Record<string, unknown>): Promise<{ session: boolean; data?: unknown; success?: boolean }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ data?: unknown; success?: boolean }>(data, 'generateStudentPledgesReportPDF').then((response) => {
        if (response) {
            resolve({ session: true, data: response.data,success:response.success});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  generateCallOfStudentPDF(data: Record<string, unknown>): Promise<{ session: boolean; data?: unknown; success?: boolean }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ data?: unknown; success?: boolean }>(data, 'generateCallOfStudentPDF').then((response) => {
        if (response) {
            resolve({ session: true, data: response.data,success:response.success});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  GetAllDegreeViolations(data: Record<string, unknown>): Promise<{ session: boolean; data?: DegreeViolation[]; success: boolean }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ data?: DegreeViolation[] }>(data, 'getDegreeViolations').then((response) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  submitStudentReports(data: Record<string, unknown>): Promise<{ session: boolean; data?: { success?: boolean; msg?: string } }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'submitStudentReports').then((res) => {
        const response = res as { success?: boolean; msg?: string };
        if (response.success) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  removeStudentReportByType(data: Record<string, unknown>): Promise<{ session: boolean; data?: { success?: boolean; msg?: string } }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'removeStudentReportByType').then((res) => {
        const response = res as { success?: boolean; msg?: string };
        if (response.success) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  deleteCallOfParentReport(data: Record<string, unknown>): Promise<{ success?: boolean; msg?: string }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'deleteCallOfParentReport').then((res) => {
        const response = res as { success?: boolean; msg?: string };
        if (response.success) {
          resolve({ success: response.success, msg: response.msg});
        } else {
            reject(response.msg)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  deletePledgesReport(data: Record<string, unknown>): Promise<{ success?: boolean; msg?: string }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ success?: boolean; msg?: string }>(data, 'deletePledgesReport').then((res) => {
        const response = res as { success?: boolean; msg?: string };
        if (response.success) {
            resolve({ success: response.success, msg: response.msg});
        } else {
            reject(response.msg)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  printAllReports(data: Record<string, unknown>): Promise<{ session: boolean; data?: unknown }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<{ success?: boolean; response?: unknown; msg?: string }>(data, 'printAllReports').then((res) => {
        const response = res as { success?: boolean; response?: unknown; msg?: string };
        if (response.success) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  getMarksReport(data: Record<string, unknown>): Promise<{ session: boolean; data?: unknown }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ response?: unknown; msg?: string }>(data, 'getMarksReport/' + data.course_id).then((res) => {
           const response = res as { response?: unknown; msg?: string };
           if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  getStudentReport(data: Record<string, unknown>): Promise<{ session: boolean; data?: unknown }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ response?: unknown; msg?: string }>(data, 'student_report_new_excel').then((res) => {
           const response = res as { response?: unknown; msg?: string };
           if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  getAllWarning(data: Record<string, unknown>): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ response?: unknown[]; msg?: string }>(data, 'getWarningReport')
        .then((response) => {
          if (response) {
            if (response.response) {
              resolve(response.response);
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.dataService.lang.networkNotWorking);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  printWarning(data: Record<string, unknown>): Promise<{ url?: string }> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ response?: { url?: string }; msg?: string }>(data, 'getWarningReportPdf')
        .then((response) => {
          if (response) {
            if (response.response) {
              resolve(response.response);
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.dataService.lang.networkNotWorking);
          }
        })
        .catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    });
  }

  openStudentReport(url: string): Promise<{ url?: string; data?: unknown }> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      this.http.get<{ url?: string; data?: unknown }>(url, { headers: header }).subscribe(
        res => {
          resolve(res);
        },
        e => {
          resolve(e);
        }
      );
    });
  }

  getShareLink(data: unknown): Promise<{ short_url?: string }> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');

          let url = environment.serverURL + 'getAppShareLink?' + 'lang=en';
          this.http.get<{ short_url?: string }>(url, { headers: header }).subscribe(
            (response) => {
              if (response) {
                resolve(response);
              } else {
                reject('Server is not responding');
              }
            },
            error => {
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.dataService.lang.usnexpectedError);
              }
            }
          );
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      });
    });
  }
}
