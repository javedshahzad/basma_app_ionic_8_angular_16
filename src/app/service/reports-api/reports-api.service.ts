import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

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
    private dataService: DataService
  ) { }

  getStudentReports(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getStudentReports').then((response: any) => {
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

  GetAllDegrees(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getAllDegress').then((response: any) => {
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

  GetAllDegreeActions(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getViolationActions').then((response: any) => {
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

  GetAllCallOfStudentReport(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'GetCallOfStudentsRepoerts').then((response: any) => {
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

  GetStudentPledgesReport(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'GetStudentPledgesReport').then((response: any) => {
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

  generateStudentPledgesReportPDF(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'generateStudentPledgesReportPDF').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.data,success:response.success});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  generateCallOfStudentPDF(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'generateCallOfStudentPDF').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.data,success:response.success});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  GetAllDegreeViolations(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getDegreeViolations').then((response: any) => {
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

  submitStudentReports(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'submitStudentReports').then((response: any) => {
        if (response.success) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  removeStudentReportByType(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'removeStudentReportByType').then((response: any) => {
        if (response.success) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  deleteCallOfParentReport(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deleteCallOfParentReport').then((response: any) => {
        if (response.success) {
          resolve({ success: response.success, msg: response.msg});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  deletePledgesReport(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'deletePledgesReport').then((response: any) => {
        if (response.success) {
            resolve({ success: response.success, msg: response.msg});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  printAllReports(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'printAllReports').then((response: any) => {
        if (response.success) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  getMarksReport(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getMarksReport/' + data.course_id).then((response: any) => {
           if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.dataService.lang.usnexpectedError)
        }
      })
    })
  }

  getStudentReport(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'student_report_new_excel').then((response: any) => {
           if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.dataService.lang.usnexpectedError)
        }
      })
    })
  }
}
