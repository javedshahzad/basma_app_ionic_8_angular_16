import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpRequest,
  HttpEventType,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams
} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { Platform, LoadingController, ModalController, NavController, PopoverController } from '@ionic/angular';
//import { HttpParams, Http, Headers } from '@angular/common/http';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { DatabaseService } from '../database/database.service';
//import { TranslateService } from '@ngx-translate/core';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
// import { PhotoLibrary } from '@awesome-cordova-plugins/photo-library/ngx';
import { TranslateService } from '@ngx-translate/core';
//import { EditCalssPage } from '../../common-modal/edit-calss/edit-calss.page';
// import { ViewClassNotesPage } from '../../common-modal/view-class-notes/view-class-notes.page';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { BehaviorSubject } from 'rxjs';
import { tap, map, last } from 'rxjs/operators';

import { StudentDataService } from '../student-data/student-data.service';
import { StorageService } from '../storage.service';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { OverlayService } from '../overlay/overlay.service';
import { ApiClient } from '../api-client/api-client.service';

const env = environment;

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // نواقل بث عامة على مستوى التطبيق — Subject بدل EventEmitter لأنها ليست
  // ربط @Output لمكوّن، بل قنوات بث يشترك بها عدة مستهلكين مستقلين
  public events: Subject<any>;
  public language: Subject<any>;
  public selectedUsers: Subject<any>;

  // قناة اتصال مخصصة لنقل الخبر المعدل أو الجديد
  public newsUpdated = new Subject<any>();

  loader: any;
  lang: any = {};
  mediaDirectory: string = '';
  popOver: any;
  img = '';
  unread = false;
  private_message = false;
  deactivate_date: any = '';
  public uploadProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  /**
   * Represents a Data provider from API.
   * @constructor
   * @param {Http} http - for making http request.
   * @param {LoadingController} loadingCtrl - Loading popup.
   */
  constructor(
    public httpClient: HttpClient,
    public http: HttpClient,
    public platform: Platform,
    public loadingCtrl: LoadingController,
    public translate: TranslateService,
    public modalController: ModalController,
    public network: Network,
    public popoverController: PopoverController,
    public dbProvider: DatabaseService,
    public studentService: StudentDataService,
    private appRate: AppRate,
    private storageSr: StorageService,
    private overlay: OverlayService,
    private apiClient: ApiClient
    // public photoLibrary: PhotoLibrary
  ) {
    this.events = new Subject();
    this.language = new Subject();
    this.selectedUsers = new Subject();
    this.platform.ready().then(() => {
      setTimeout(res => {
        this.translate.get('alertmessages').subscribe(res => {
          this.lang = res;
          // console.log(this.translate.instant('alertmessages'))
        });
      }, 2000);
    });
    this.language.subscribe(res => {
      environment.lang_code = res;
    });
    this.network.onDisconnect().subscribe(() => {
      this.showToast('No Internet connection...');
    });

    this.network.onConnect().subscribe(() => {
      this.showToast('Internet connected');
    });
  }

  // دالة مساعدة لاستقبال طلب التبديل من واجهة Lineone الجديدة
  async triggerUserSwitch(user: any) {
    if (user === 'add') {
      // التوجيه لصفحة تسجيل الدخول
    } else {
      // الحفظ الآمن وبدون JSON.stringify
      await this.storageSr.set('userloggedin', user);

      if (this.events) {
        this.events.next(user);
      }
      window.location.href = '/tabs';
    }
  }

  async openAvatarModel(pic) {
    this.img = pic;
    // 🟢 استيراد ديناميكي: يمنع دمج هذا المكوّن ضمن الحزمة الرئيسية (main.js)
    // التي تُحمَّل عند كل صفحة، طالما أن DataService يُحقَن مبكراً (root)
    const { ProfileImagePage } = await import('../../modals/profile-image/profile-image.page');
    const modal = await this.modalController.create({
      component: ProfileImagePage,
      componentProps: { pic: pic }
    });
    return await modal.present();
  }

  // Function to convert base64 string to blob
  base64toBlob(base64Data: string, contentType: string): Blob {
    const sliceSize = 512;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }
  dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: 'image/jpeg' });
  }

  generateRandomFileName(extension: string = ''): string {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2);
    const fileName = `file_${timestamp}_${randomString}${extension}`;
    return fileName;
  }

  /**
   * This is a user rating popup
   * @return rating in int
   * @param ev - event
   */
  async presentRatingPopover(lang, note, callback: any) {
    // console.log('call');
    const { RateAppComponent } = await import('../../components/rate-app/rate-app.component');
    const popover = await this.popoverController.create({
      component: RateAppComponent,
      // event: ev,
      translucent: false,
      mode: 'ios',
      cssClass: 'ratePopup',
      backdropDismiss: false,
      componentProps: { lang: lang, data: note }
    });
    await popover.present();
    popover.onDidDismiss().then(response => {
      // console.log('call',response);
      if (response.data) {
        callback(response.data);
      } else {
        callback(false);
      }
    });
  }

  showRatePrompt(lang) {
    this.appRate.setPreferences({
      // ملاحظة: قمنا بمسح السطر (...this.appRate.preferences) لأنه لم يعد مطلوباً
      // ضع باقي إعداداتك الموجودة مسبقاً هنا كما هي، مثال:
      displayAppName: 'اسم تطبيقك',
      promptAgainForEachNewVersion: true,
      storeAppURL: {
        ios: 'رقم_التطبيق_هنا',
        android: 'market://details?id=حزمة_التطبيق_هنا'
      }
    });
    // this.appRate.preferences.openUrl = function(url) {
    // window.open(url, '_system', 'location=yes');
    // };
    this.appRate.promptForRating(true);
  }

  async switchAccount(ev, lang) {
    const { SwitchAccountComponent } = await import('../../components/switch-account/switch-account.component');
    const popover = await this.popoverController.create({
      component: SwitchAccountComponent,
      // event: ev,
      translucent: false,
      cssClass: 'switch-account',
      backdropDismiss: true,
      componentProps: { lang: lang }
    });
    await popover.present();
  }
  async editStudentClass(ev, student, classes, user, callback: any) {
    const { EditStudentProfileComponent } =
      await import('../../components/edit-student-profile/edit-student-profile.component');
    const popover = await this.popoverController.create({
      component: EditStudentProfileComponent,
      event: ev,
      translucent: false,
      mode: 'ios',
      cssClass: 'edit-student',
      backdropDismiss: true,
      componentProps: { student: student, classes: classes }
    });
    await popover.present();
    popover.onDidDismiss().then(response => {
      // console.log('call',response);
      if (response.data) {
        if (response.data.deleteClass) {
          let deleteData = {
            sid: response.data.student.sid,
            cid: response.data.student.cid,
            user_no: user.user_no,
            school_id: user.school_id,
            session_id: user.session_id
          };
          this.apiClient
            .postRequest(deleteData, 'deleteStudentClass')
            .then((res: any) => {
              if (res) {
                this.showToast(res.msg);
                callback(res);
              }
            })
            .catch(error => {
              console.log(error);
            });
        } else {
          let updateData = {
            sid: response.data.student.sid,
            cid: response.data.student.cid,
            student_name: response.data.studentName,
            class_id: response.data.studentSemester,
            user_no: user.user_no,
            school_id: user.school_id,
            session_id: user.session_id
          };
          this.apiClient
            .postRequest(updateData, 'updateStudentProfile')
            .then((res: any) => {
              if (res) {
                if (!res.response) {
                  this.errorALertMessage(res.msg);
                } else {
                  callback(res);
                  this.showToast(this.lang.edit_student_success_msg);
                }
              }
            })
            .catch(error => {
              console.log(error);
            });
        }
      }
    });
  }

  /**
   * This is a user defined loader
   * @param ev - event
   */
  async presentPopover(ev: any) {
    // 🔴 حماية إضافية: التأكد من إغلاق أي نافذة سابقة قبل فتح واحدة جديدة
    if (this.popOver) {
      this.closePopup();
    }

    this.popOver = await this.overlay.createLoader(true);
  }

  // 🔴 الكود الآمن لإغلاق النافذة
  closePopup() {
    if (this.popOver) {
      this.overlay.dismissLoader(this.popOver);
      this.popOver = null;
    }
  }

  /** Show Loading popup. */
  async showLoading() {
    this.presentPopover('');
  }

  /** Hide loading popup. */
  async hideLoading() {
    setTimeout(() => {
      this.closePopup();
    }, 900);
  }

  /**
   * Wraps an API call with showLoading()/hideLoading(), guaranteeing
   * hideLoading() always fires even if the call throws — unlike the
   * hand-written show/hide pairs scattered across pages, a missed
   * catch branch here can't leave the spinner stuck. Success/error
   * handling stays with the caller; this only removes the mechanical
   * show/hide duplication.
   */
  async run<T>(work: () => Promise<T>): Promise<T> {
    this.showLoading();
    try {
      return await work();
    } finally {
      this.hideLoading();
    }
  }

  /**
   * This is a toast message function
   * @param message - string of message to be shown
   */
  async showToast(message: string) {
    await this.overlay.showToast(message);
  }

  /** ALert message popup.
   * @param {String} error - Error message to display
   */
  async errorALertMessage(error: string) {
    await this.overlay.presentAlert('تحذير', this.removeUrlFromString(error), ['Ok'], undefined, false);
  }

  removeUrlFromString(inputString) {
    return this.overlay.removeUrlFromString(inputString);
  }

  /** ALert message popup.
   * @param {String} msg - Error message to display
   */
  async msgALertMessage(msg: string) {
    await this.overlay.presentAlert('معلومات', msg, ['Ok'], undefined, false);
  }

  /** Search all user from API.
   * @returns Array of users list or error
   */

  getCountStudents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getCountStudents')
        .then((response: any) => {
          if (response) {
            resolve({ session: true, data: response.data, success: true, msg: response.msg });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }
  getCountTodayNewsPost(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getCountTodayNewsPost')
        .then((response: any) => {
          if (response) {
            resolve({ session: true, data: response.data, success: true, msg: response.msg });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }
  ApplyVoucherCode(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'ApplyVoucherCode')
        .then((response: any) => {
          if (response) {
            resolve({ session: response.session, success: response.success, msg: response.msg });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }
  //==========added on 28/12/21 for print class notes as pdf=========
  printAllClassNotes(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, data.is_multi ? 'printMultipleClassNotes' : 'printClassNotes')
        .then((response: any) => {
          // this.postRequest(data, 'printClassNotes').then((response: any) => {
          if (response.success) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }

  editAbsentNotes(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'editAbsentNotes')
        .then((response: any) => {
          if (response) {
            resolve({ session: true, data: response, message: response.mg });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }
  /** Search all student of School from API.
   * @returns Array of users list or error
   */

  /** Get school list from API.
   * @returns Array of school list or error
   */
  getSchool(country_code): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          let url =
            env.serverURL +
            'getSchoolsHavingMaterials/' +
            (country_code && typeof country_code !== 'undefined' ? '?country_code=' + country_code : '');
          this.httpClient.post(url, country_code, { headers: header }).subscribe(
            (response: any) => {
              if (response.success) {
                resolve(response.schools);
              } else {
                reject('Server is not responding');
              }
            },
            error => {
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.lang.usnexpectedError);
              }
            }
          );
        } else {
          reject(this.lang.networkNotWorking);
        }
      });
    });
  }
  /** Get teacher list of a perticular school  from API.
   * @returns Array of teacher list or error
   */
  getTeachers(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getAllTeachers')
        .then((response: any) => {
          if (response) {
            console.log('tescherList', response);
            if (response.response == false) {
              resolve({ session: false, message: response.msg });
            } else if (response.response == true) {
              // this.dbProvider.insertClasses(response.courses);
              resolve({ session: true, data: response.profile });
            } else {
              reject(response.msg);
            }
          } else {
            // this.dbProvider.getClasses().then((classes) => {
            //   resolve({ session: true, data: classes });
            // }).catch((error) => {
            //   reject(error);
            // })
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /* get all the users except teacher studet and parent */

  getAllUsers(users): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(users, 'getSchoolUsersList')
        .then((response: any) => {
          if (response) {
            console.log('alluserslist', response);
            if (response.session == false) {
              resolve({ session: false, message: response.msg });
            } else if (response.session == true) {
              resolve({ session: true, data: response.response });
            } else {
              reject(response.msg);
            }
          } else {
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** update teacher list of a perticular class of a school .
   * @returns updation status
   */
  updateTeacher(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      data.lang_code = environment.lang_code;
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      let body = new HttpParams();
      body = body.append('class_id', data.class_id);
      body = body.append('school_id', data.school_id);
      body = body.append('user_no', data.user_no);
      body = body.append('lang_code', data.lang_code);
      body['teachersList'] = <any>[];
      let obj = [];
      for (let i = 0; i < data.teachersList.length; i++) {
        // code...
      }
      Object.keys(data.teachersList).map(key => {
        console.log('key', key);
        Object.keys(data.teachersList[key]).map(sid => {
          console.log('ap', sid);
          body = body.append('teachersList' + '[' + key + ']' + '[' + sid + ']', data.teachersList[key][sid]);
        });
      });
      // console.log(body);

      this.httpClient.post(env.serverURL + 'updateTeachers', body, { headers: header }).subscribe(
        (response: any) => {
          if (response) {
            console.log('tescherList', response);
            if (response.response == false) {
              resolve({ session: false, message: response.msg });
            } else if (response.response == true) {
              // this.dbProvider.insertClasses(response.courses);
              resolve({ session: true, data: response.msg });
            } else {
              reject(response.msg);
            }
          } else {
            // this.dbProvider.getClasses().then((classes) => {
            //   resolve({ session: true, data: classes });
            // }).catch((error) => {
            //   reject(error);
            // })
          }
        },
        error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        }
      );
    });
  }
  /** update teacher list of a perticular class of a school .
   * @returns updation status
   */
  createBulletins(data) {
    let header = new HttpHeaders();
    header.append('Content-Type', 'application/json');
    data.lang_code = environment.lang_code;
    let req = new HttpRequest('POST', env.serverURL + 'createBulletins', data, {
      responseType: 'arraybuffer',
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.getStatusMessage(event)),
      tap(message => message),
      last()
    );
  }
  createclassNotes(data) {
    let header = new HttpHeaders();
    header.append('Content-Type', 'application/json');
    data.lang_code = environment.lang_code;
    let req = new HttpRequest('POST', env.serverURL + 'createNotes', data, {
      responseType: 'arraybuffer',
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.getStatusMessage(event)),
      tap(message => message),
      last()
    );
  }
  getStatusMessage(event) {
    let status;
    switch (event.type) {
      case HttpEventType.UploadProgress:
        status = Math.round((100 * event.loaded) / event.total);
        this.uploadProgress.next(status);
        this.events.next(status);
        return status;

      case HttpEventType.Response:
        return `Done`;
    }
  }
  // createBulletins(data): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //       // console.log(data['FormData']);
  //      let header = new HttpHeaders();
  //         header.append('Content-Type', 'application/json');
  //        //   let body = new HttpParams();
  //        // body= body.append("title", data.title);
  //        // body= body.append("school_id", data.school_id);
  //        // body= body.append("user_no", data.user_no);
  //        // body['files']=<any>[];
  //        //   Object.keys(data.files).map((key) => {
  //        //     console.log('key',key);
  //        //       Object.keys(data.files[key]).map((k) => {
  //        //         console.log('key',key);
  //        //          body=body.append('files'+'['+ key+']'+'['+k+']', data.files[key][k]);
  //        //      })
  //        //  })
  //        //       console.log(body);

  //     this.httpClient.post( env.serverURL + 'createBulletins',data, { headers: header }).subscribe((response: any) => {
  //       if (response) {
  //        console.log('tescherList',response);
  //          if (response.success==true) {
  //           resolve({ session: true, data: response.msg});
  //         } else {
  //           reject(response.msg)
  //         }
  //       } else {
  //       }
  //     },(error) => {
  //       console.log(error);
  //       if (error.message != undefined && error.message != '' && error.message != null) {
  //         reject(error.message)
  //       } else {
  //         reject(this.lang.usnexpectedError)
  //       }
  //     });
  //   })
  // }

  /** delete a class from a school.
   * @returns status of deletion
   */
  deleteClass(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'deleteClass')
        .then((response: any) => {
          if (response) {
            console.log('tescherList', response);
            if (response.response == false) {
              resolve({ session: false, message: response.msg });
            } else if (response.response == true) {
              // this.dbProvider.insertClasses(response.courses);
              resolve({ session: true, data: response.msg });
            } else {
              reject(response.msg);
            }
          } else {
            // this.dbProvider.getClasses().then((classes) => {
            //   resolve({ session: true, data: classes });
            // }).catch((error) => {
            //   reject(error);
            // })
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  openPdf(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'check_user_plan')
        .then((response: any) => {
          if (response) {
            if (response.response) {
              resolve(response);
            } else {
              reject(response);
            }
          } else {
            reject(response);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
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

  getPointsValue(): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/json');
      this.http.get(environment.serverURL + 'getPointsValue', { headers: header }).subscribe(
        res => {
          resolve(res);
        },
        e => {
          resolve(e);
        }
      );
    });
  }
  /** Get parent list of a perticular school who recently registered on app  from API.
   * @returns Array of parent list or error
   */
  /** Get E-Learning categories list from API.
   * @returns Array of category list or error
   */
  getShareLink(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');

          let url = env.serverURL + 'getAppShareLink?' + 'lang=en';
          this.httpClient.get(url, { headers: header }).subscribe(
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
                reject(this.lang.usnexpectedError);
              }
            }
          );
        } else {
          reject(this.lang.networkNotWorking);
        }
      });
    });
  }

  /** Get E-Learning material data from API.
   * @returns Array of material data or error
   */
  /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
   */
  getCourses(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getCourses/' + data.school_id)
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              this.dbProvider.insertClasses(response.courses);
              resolve({ session: true, data: response.courses, linkData: response.activeLink });
            } else {
              reject(response.msg);
            }
          } else {
            this.dbProvider
              .getClasses()
              .then(classes => {
                resolve({ session: true, data: classes });
              })
              .catch(error => {
                reject(error);
              });
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
   */
  getTeachersClass(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getTeachersClass/' + data.school_id)
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve({ session: true, data: response.courses });
            } else {
              reject(response.msg);
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }
  /** Get follow up fields.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
   */
  getSelectedCourses(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getSelectedCourses/' + data.school_id)
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve({ session: true, data: response.selectedCourses });
            } else {
              reject(response.msg);
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }
  /** get all seminars and their total present absent total student

*/

  getSeminarClassList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getSeminarClassList/' + data.school_id)
        .then((response: any) => {
          if (response) {
            if (!response.response) {
              resolve({ session: false, message: response.msg });
            } else if (response.response) {
              resolve({ session: true, data: response.response });
            } else {
              reject(response.msg);
            }
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** reorder all classes 

*/

  reorderClasses(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);

      data.lang_code = environment.lang_code;
      let header = new HttpHeaders();
      header.append('Content-Type', 'application/x-www-form-urlencoded');
      let body: HttpParams = new HttpParams();
      body = body.append('school_id', data.school_id);
      body = body.append('user_no', data.user_no);
      body = body.append('lang_code', data.lang_code);
      Object.keys(data.list).map(key => {
        Object.keys(data.list[key]).map(sid => {
          body = body.append('list[' + key + '][' + sid + ']', data.list[key][sid]);
        });
      });
      this.http.post(environment.serverURL + 'reorderClasses', body, { headers: header }).subscribe(
        (res: any) => {
          let response = res;
          if (response.success == true) {
            resolve(true);
          } else {
            // this.errorALertMessage(response.msg);
            resolve(false);
          }
        },
        error => {
          console.log(error);
          resolve(false);
        }
      );
    });
  }

  /** submit email for forgot password
   */

  /** get all student of a school
   */
  todayDashboard(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          this.postRequest(data, 'todayDashboard/' + data.school_id)
            .then((response: any) => {
              if (response) {
                if (!response.response) {
                  resolve({ session: false, message: response.msg });
                } else if (response.response) {
                  resolve({ session: true, data: response.response });
                  this.studentService.setStaticalData(data.user_no, response.response);
                } else {
                  reject(response.msg);
                }
              } else {
                reject(response.msg);
              }
            })
            .catch(error => {
              console.log(error);
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.lang.usnexpectedError);
              }
            });
        } else {
          this.studentService.getOfflineStatical(data.user_no).then(res => {
            resolve({ session: true, data: res });
          });
        }
      });
    });
  }

  /** Register new course.
   * @param {Object} data - contains user_no, school_id, code, name, desc, semno
   * @returns Success or error msg
   */
  createNewCourse(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'createCourse')
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg });
            } else {
              reject(response.msg);
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Register new teacher.
   * @param {Object} data - contains user_no, school_id, Teacher Id, teacher name, teacher password
   * @returns Success or error msg
   */
  registerNewTeacher(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'registerNewTeacher')
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve(response.msg);
            } else {
              reject(response.msg);
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  registerNewParent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'registerNewParent')
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve(response.msg);
            } else {
              reject(response.msg);
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  getAllRules(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getAllRules')
        .then((response: any) => {
          if (response) {
            if (response.details) {
              resolve(response.details);
            } else {
              reject(response.msg);
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            //  reject(this.lang.usnexpectedError)
          }
        });
    });
  }

  /** Register new Student.
   * @param {Object} data - contains user_no, school_id, name, student_id
   * @returns Success or Error msg
   */
  registerStudent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'registerStudent')
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg });
            } else {
              reject(response.msg);
            }
          } else {
            this.dbProvider
              .getClasses()
              .then(classes => {
                resolve({ session: true, data: classes });
              })
              .catch(error => {
                reject(error);
              });
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /**
   * Update course description
   * @param data user_no, session_id, cid, course object
   */
  updateCourseDesc(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let headers = new HttpHeaders();
          headers.set('Content-Type', 'application/x-www-form-urlencoded');
          let body = new HttpParams();
          body = body.append('cid', data.cid);
          body = body.append('session_id', data.session_id);
          body = body.append('user_no', data.user_no);
          body = body.append('lang_code', data.lang_code);
          body = body.append('course[name]', data.course.name);
          body = body.append('course[desc]', data.course.desc);
          this.http.post(environment.serverURL + '/manageCourse', body, { headers }).subscribe(
            res => {
              let response = res;
              if (!response['session']) {
                resolve({ session: false, message: response['msg'] });
              } else if (response['success']) {
                resolve({ session: true, data: response['courses'] });
              } else {
                reject(response['msg']);
              }
            },
            error => {
              console.log(error);
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.lang.usnexpectedError);
              }
            }
          );
        } else {
          reject(this.lang.networkNotWorking);
        }
      });
    });
  }

  /**
   * Get holiday list from backend
   * @param data user_no, school_id, session_id
   */
  /** Get student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  getClassStudentList(data: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // 👈 أضفنا async هنا
      this.postRequest(data, 'getStudents/' + data.course_id)
        .then(async (response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              this.dbProvider.insertStudentList(response.students, 5);
              resolve({ session: true, data: response });
            } else {
              reject(response.msg);
            }
          } else {
            // 👈 التعديل الجذري للحفظ الأوفلاين هنا
            let attendance = await this.storageSr.get('classlocalatt');
            if (attendance) {
              if (attendance[data.course_id]) {
                resolve({ session: true, data: attendance[data.course_id] });
              } else {
                this.dbProvider
                  .getStudentList(data.course_id)
                  .then(students => {
                    resolve({ session: true, data: { students: students, last_cem: 0, semteacher: [] } });
                  })
                  .catch(error => {
                    reject(error);
                  });
              }
            } else {
              this.dbProvider
                .getStudentList(data.course_id)
                .then(students => {
                  resolve({ session: true, data: { students: students, last_cem: 0, semteacher: [] } });
                })
                .catch(error => {
                  reject(error);
                });
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Get student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  getFollowUpStudentList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getFollowUpStudentList/' + data.course_id)
        .then((response: any) => {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, data: response });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Delete student marks according to course and user id with selected date.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  deleteFollowUpStudentList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'deleteFollowUpStudentList/' + data.course_id)
        .then((response: any) => {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, data: response });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Get student PDF.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  sendPushMessageToStudentParent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'sendPushMessageToStudentParent')
        .then((response: any) => {
          if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Get delay student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
   */
  getDelayClassStudentList(data: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // 👈 أضفنا async هنا
      this.postRequest(data, 'getStudents_delay/' + data.course_id)
        .then(async (response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: response.session, message: response.msg, success: response.success, data: response });
            } else if (response.success) {
              this.dbProvider.insertStudentList(response.students, response.delay_rule);
              resolve({ session: response.session, data: response, success: response.success });
            } else {
              reject(response.msg);
            }
          } else {
            // 👈 القراءة الآمنة من الذاكرة هنا
            let attendance = await this.storageSr.get('delayclasslocalatt');
            if (attendance) {
              if (attendance[data.course_id]) {
                resolve({ session: true, data: attendance[data.course_id] });
              } else {
                this.dbProvider
                  .getStudentList(data.course_id)
                  .then(students => {
                    if (students.length > 0) {
                      resolve({
                        session: true,
                        data: { students: students, last_cem: 0, semteacher: [], delay_rule: students[0].delay_rule }
                      });
                    } else {
                      resolve({
                        session: true,
                        data: { students: students, last_cem: 0, semteacher: [], delay_rule: 5 }
                      });
                    }
                  })
                  .catch(error => {
                    reject(error);
                  });
              }
            } else {
              this.dbProvider
                .getStudentList(data.course_id)
                .then(students => {
                  if (students.length > 0) {
                    resolve({
                      session: true,
                      data: { students: students, last_cem: 0, semteacher: [], delay_rule: students[0].delay_rule }
                    });
                  } else {
                    resolve({
                      session: true,
                      data: { students: students, last_cem: 0, semteacher: [], delay_rule: 5 }
                    });
                  }
                })
                .catch(error => {
                  reject(error);
                });
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Get student details.
   * @param {Object} data - user_no, session_id, cid, date, sid
   * @returns Student details or error
   */
  getStudentDetails(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          this.postRequest(data, 'viewStudent/' + data.sid)
            .then((response: any) => {
              if (response) {
                if (!response.session) {
                  reject(response.msg);
                } else if (response.success) {
                  resolve({ session: true, data: response.details });
                  let a = response.details;
                  let data = [];
                  data.push(a);
                } else {
                  reject(response.msg);
                }
              } else {
                reject(this.lang.networkNotWorking);
              }
            })
            .catch(error => {
              console.log(error);
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.lang.usnexpectedError);
              }
            });
        }
      });
    });
  }

  /** Get notes of the student.
   * @param {Object} data - user_no, session_id, cid, date, sid
   * @returns List of notes or error
   */
  getAllWarning(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getWarningReport')
        .then((response: any) => {
          if (response) {
            if (response.response) {
              resolve(response.response);
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.lang.networkNotWorking);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }
  printWarning(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getWarningReportPdf')
        .then((response: any) => {
          if (response) {
            if (response.response) {
              resolve(response.response);
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.lang.networkNotWorking);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Get notification of the school.
   * @param {Object} data- user_no, school_id, session_id
   * @returns list of notifications or error
   */
  getNotifications(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getNotifications/' + data.school_id)
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              this.dbProvider.insertPrivateMessages(response.list);
              resolve({ session: true, data: response.list });
            } else {
              reject(response.msg);
            }
          } else {
            this.dbProvider.getPrivateMessages().then(messages => {
              resolve({ session: true, data: messages });
            });
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /**
   * delete user notification
   * @param data user_no, nid, session_id
   */
  deleteNotification(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'deleteNotifications')
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg });
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.lang.networkNotWorking);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /**
   * Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  /**
   * Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  submitMarks(data: any, marksheet): Promise<any> {
    // console.log(data);
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body = body.append('cid', data.course_id);
          body = body.append('date', data.date);
          body = body.append('session_id', data.session_id);
          body = body.append('user_no', data.user_no);
          body = body.append('lang_code', data.lang_code);

          Object.keys(marksheet).map(key => {
            Object.keys(marksheet[key]).map(sid => {
              body = body.append('marksheet[' + key + '][' + sid + ']', marksheet[key][sid]);
            });
          });

          this.http
            .post(environment.serverURL + 'saveStudentMarks/' + data.school_id, body, { headers: header })
            .subscribe(
              (res: any) => {
                let response = res;
                if (!response.session) {
                  resolve({ session: false, message: response.msg });
                } else if (response.success) {
                  resolve({ session: true, message: response.msg });
                } else {
                  reject(response.msg);
                }
              },
              error => {
                console.log(error);
                if (error.message != undefined && error.message != '' && error.message != null) {
                  reject(error.message);
                } else {
                  reject(this.lang.usnexpectedError);
                }
              }
            );
        } else {
          reject(this.lang.networkNotWorking);
        }
      });
    });
  }

  /**
   * Delay attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   * @param submittedByUser submitted by which user 1 - admin, 2- moderator
   */
  /**
   * Absence save note
   * @param data sid, cid, date, note, user_no, session_id
   */
  saveAbsenceNote(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'saveNote')
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg, res: response });
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.lang.networkNotWorking);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /**
   * Absence delete note
   * @param data user_no, session_id
   * @param note_id Note id which will be deleted
   */
  deleteAbsenceNote(data: any, note_id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'deleteNote/' + note_id)
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg });
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.lang.networkNotWorking);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /**
   * Submit Student note
   * @param data sid, note, user_id
   */
  addStudentPoints(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'addStudentPoints')
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve(response);
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.lang.networkNotWorking);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  // 🔴 دالة جلب بيانات شجرة المهارات للطالب (تم حل مشكلة CORS)
  getStudentSkillTree(data: any) {
    return new Promise((resolve, reject) => {
      // 1. تحويل البيانات إلى FormData لتتطابق مع سياسة السيرفر وتتجاوز الـ CORS
      let formData = new FormData();
      formData.append('sid', data.sid);

      // 2. تجهيز الرابط (تأكد أن تستخدم environment.serverURL أو this.serverURL حسب ما يعمل لديك)
      let url = environment.serverURL + 'getStudentSkillTree';

      // 3. إرسال الـ formData بدلاً من كائن الـ data العادي
      this.http.post(url, formData).subscribe(
        (res: any) => {
          resolve(res);
        },
        err => {
          reject(err);
        }
      );
    });
  }

  /**
   * Update user image
   * @param data Base64 image data
   */
  updateUserImage(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'updateStudentImage/' + data.sid)
        .then((response: any) => {
          if (response) {
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, url: response.imageUrl });
            } else {
              reject(response.msg);
            }
          } else {
            reject(this.lang.networkNotWorking);
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /**
   * send Private message
   * @param data user_no, session_id, notification, isemail, school_id
   */
  addNews(data, school_id) {
    let header = new HttpHeaders();
    header.append('Content-Type', 'application/json');
    data.lang_code = environment.lang_code;
    let req = new HttpRequest('POST', env.serverURL + 'postNews', data, {
      responseType: 'arraybuffer',
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.getStatusMessage(event)),
      tap(message => message),
      last()
    );
  }
  sendMessage(data, school_id) {
    let header = new HttpHeaders();
    header.append('Content-Type', 'application/json');
    data.lang_code = environment.lang_code;
    let req = new HttpRequest('POST', env.serverURL + 'sendMessage/' + school_id, data, {
      responseType: 'arraybuffer',
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.getStatusMessage(event)),
      tap(message => message),
      last()
    );
  }

  /**
   * Update user settings
   * @param data user_no, session_id, user object
   */
  updateUserSettings(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = this.makeObjectToUrlParams(data);
          Object.keys(data.users).map(key => {
            if (data.users[key] != '') {
              body = body.append('user[' + key + ']', data.users[key]);
            }
          });
          this.http.post(environment.serverURL + 'saveUser', body, { headers: header }).subscribe(
            (res: any) => {
              let response = res;
              if (!response.session) {
                resolve({ session: false, message: response.msg });
              } else if (response.success) {
                resolve({ session: true, message: response.msg, pic: response.picUrl });
              } else {
                reject(response.msg);
              }
            },
            error => {
              console.log(error);
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.lang.usnexpectedError);
              }
            }
          );
        } else {
          reject(this.lang.networkNotWorking);
        }
      });
    });
  }

  deleteSchoolSettings(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = this.makeObjectToUrlParams(data);
          Object.keys(data).map(key => {
            if (data[key] != '') {
              body = body.append(key, data[key]);
            }
          });
          this.http.post(environment.serverURL + 'deleteSchool', body, { headers: header }).subscribe(
            (res: any) => {
              let response = res;
              if (!response.session) {
                resolve({ session: false, message: response.msg, deactive_date: response.response.deactivate_date });
              } else if (response.success) {
                resolve({ session: true, message: response.msg, deactivate_date: response.response.deactivate_date });
              } else {
                reject(response.msg);
              }
            },
            error => {
              console.log(error);
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.lang.usnexpectedError);
              }
            }
          );
        } else {
          reject(this.lang.networkNotWorking);
        }
      });
    });
  }

  revertDeletedSchoolSettings(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then(isNetworkAvailable => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = this.makeObjectToUrlParams(data);
          Object.keys(data).map(key => {
            if (data[key] != '') {
              body = body.append(key, data[key]);
            }
          });
          this.http.post(environment.serverURL + 'revertDeleteSchool', body, { headers: header }).subscribe(
            (res: any) => {
              let response = res;
              if (!response.session) {
                resolve({ session: false, message: response.msg, deactive_date: response.response.deactivate_date });
              } else if (response.success) {
                resolve({ session: true, message: response.msg, deactive_date: response.response.deactivate_date });
              } else {
                reject(response.msg);
              }
            },
            error => {
              console.log(error);
              if (error.message != undefined && error.message != '' && error.message != null) {
                reject(error.message);
              } else {
                reject(this.lang.usnexpectedError);
              }
            }
          );
        } else {
          reject(this.lang.networkNotWorking);
        }
      });
    });
  }

  /**
   * Get parent connect listing
   * @param data
   */
  /**
   * Send the contact form
   * @param data
   */
  /**
   * Absence delete note
   * @param data user_no, session_id
   * @param note_id Note id which will be deleted
   */
  /**
   * Offline Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  getChildrens(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getChildrens')
        .then((response: any) => {
          if (response) {
            if (response.success) {
              resolve({ data: response.child, permit: response.can_view_absent });
            } else {
              reject(response.msg);
            }
          }
        })
        .catch(error => {
          console.log(error);
          if (error.message != undefined && error.message != '' && error.message != null) {
            reject(error.message);
          } else {
            reject(this.lang.usnexpectedError);
          }
        });
    });
  }

  /** Post request function.
   * @param {Object} data - contains the properties to post to API
   * @param {String} slug - contains the API method to call
   * @returns Success or error
   */
  postRequest(data: any, slug: string): Promise<any> {
    return this.apiClient.postRequest(data, slug);
  }

  /** Function to convert object into param string
   * @param {Object} data - contains the properties to post to API
   * @returns Param string
   */

  makeObjectToUrlParams(data: any) {
    return this.apiClient.makeObjectToUrlParams(data);
  }

  /**
   * get date in yyyy-mm-dd
   * @param date date object
   */
  getFormatedDate(date: Date) {
    let m = date.getMonth() + 1;
    return date.getFullYear() + '-' + m + '-' + date.getDate();
  }

  /**
   * Check whether network is available or not
   */
  getNetworkInformation(): Promise<boolean> {
    return this.apiClient.getNetworkInformation();
  }

  /**
   * Download image
   * @param url image url
   */
  /**
   * Download image (Modern Capacitor Way)
   * @param url image url
   */
  downloadImage(url: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let n = new Date().valueOf();
        let fileName = `Download_${n}.png`;

        // استخدام تقنية كاباسيتور الحديثة للتحميل المباشر بدون مكتبات خارجية
        const result = await Filesystem.downloadFile({
          url: encodeURI(url),
          path: fileName,
          directory: Directory.Documents // حفظ آمن وموحد للاندرويد والايفون
        });

        console.log('تم التحميل بنجاح: ', result);
        resolve(true);
      } catch (error) {
        console.error('خطأ في التحميل: ', error);
        reject(this.lang?.usnexpectedError || 'حدث خطأ غير متوقع أثناء التحميل');
      }
    });
  }
  deliverPushNotification(data: any) {
    let updateData = {
      deviceToken: data.deviceToken,
      title: data.title,
      body: data.body,
      data: data.data
    };
    this.apiClient
      .postRequest(updateData, 'SendPushNotification')
      .then((res: any) => {
        if (res && !res.response) {
          this.errorALertMessage(res.msg);
        }
      })
      .catch(error => {
        console.log(error);
      });
  }
  caclulateHours(start, end) {
    var date1: any = new Date(end);
    var date2: any = new Date(start);
    var diffInSeconds = Math.abs(date1 - date2) / 1000;
    var days = Math.floor(diffInSeconds / 60 / 60 / 24);
    var hours = Math.floor((diffInSeconds / 60 / 60) % 24);
    var minutes = Math.floor((diffInSeconds / 60) % 60);
    var seconds = Math.floor(diffInSeconds % 60);
    var milliseconds = Math.round((diffInSeconds - Math.floor(diffInSeconds)) * 1000);
    return `${hours}:${minutes}:${seconds}`;
  }
  addHoursToDate(date: any, hours: number): Date {
    return new Date(new Date(date).setHours(date.getHours() + hours));
  }
  getStudentsListByCourseId(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getStudentsListByCourseId/' + data.cid)
        .then((response: any) => {
          if (response) {
            resolve({ session: response.session, msg: response.msg, success: response.success, data: response.data });
          } else {
            reject(response.msg);
          }
        })
        .catch(error => {
          console.log(error);
        });
    });
  }
}

export function getFileReader(): FileReader {
  const fileReader = new FileReader();
  const zoneOriginalInstance = (fileReader as any)['__zone_symbol__originalInstance'];
  return zoneOriginalInstance || fileReader;
}
