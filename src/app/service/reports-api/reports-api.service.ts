import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
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
    private http: HttpClient,
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

  getAllWarning(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getWarningReport')
        .then((response: any) => {
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
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.dataService.lang.usnexpectedError);
          }
        });
    });
  }

  printWarning(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'getWarningReportPdf')
        .then((response: any) => {
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
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.dataService.lang.usnexpectedError);
          }
        });
    });
  }

  openStudentReport(url): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      this.http.get(url, { headers: header }).subscribe(
        res => {
          resolve(res);
        },
        e => {
          resolve(e);
        }
      );
    });
  }

  getShareLink(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');

          let url = environment.serverURL + 'getAppShareLink?' + 'lang=en';
          this.http.get(url, { headers: header }).subscribe(
            (response: any) => {
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
