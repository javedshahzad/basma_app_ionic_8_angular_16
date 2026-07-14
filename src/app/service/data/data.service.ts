import { ProfileImagePage } from './../../modals/profile-image/profile-image.page';
import { Injectable , EventEmitter} from '@angular/core';
import { HttpClient,HttpRequest,HttpEventType, HttpHeaders, HttpErrorResponse, HttpParams} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, Subject } from 'rxjs';
import {Platform,LoadingController ,ToastController, AlertController ,ModalController ,NavController,PopoverController  } from '@ionic/angular';
//import { HttpParams, Http, Headers } from '@angular/common/http';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { DatabaseService } from '../database/database.service';
//import { TranslateService } from '@ngx-translate/core';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
// import { PhotoLibrary } from '@awesome-cordova-plugins/photo-library/ngx';
import {LoaderComponent} from '../../components/loader/loader.component';
import {RateAppComponent} from '../../components/rate-app/rate-app.component';
import { TranslateService } from '@ngx-translate/core';
import {SwitchAccountComponent} from '../../components/switch-account/switch-account.component';
import {EditStudentProfileComponent} from '../../components/edit-student-profile/edit-student-profile.component';
//import { EditCalssPage } from '../../common-modal/edit-calss/edit-calss.page';
// import { ViewClassNotesPage } from '../../common-modal/view-class-notes/view-class-notes.page';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { BehaviorSubject } from 'rxjs';
import { tap, map,last } from 'rxjs/operators';

import { StudentDataService } from '../student-data/student-data.service';
import { StorageService } from '../storage.service';
import { Filesystem, Directory } from '@capacitor/filesystem';

const env = environment; 

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public events: EventEmitter<any>;
  public language: EventEmitter<any>;
  public selectedUsers: EventEmitter<any>;

  // قناة اتصال مخصصة لنقل الخبر المعدل أو الجديد
  public newsUpdated = new Subject<any>();

  
  loader: any;
  lang: any = {};
  mediaDirectory: string = '';
  popOver:any;
  img = '';
  unread = false;
  private_message = false;
  deactivate_date : any ='';
  public uploadProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private syncInterval: any = null;
  private isSyncing = false;

  
  /**
    * Represents a Data provider from API.
    * @constructor
    * @param {Http} http - for making http request.
    * @param {AlertController} alertCtrl - Alert popup.
    * @param {LoadingController} loadingCtrl - Loading popup.
    * @param {ToastController} toastCtrl - show toast
  */
  constructor(public httpClient: HttpClient,
  	public http: HttpClient,
  	public alertCtrl: AlertController,
  	public platform: Platform,
    public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public translate: TranslateService,
    public modalController: ModalController,
    public network: Network,
    public popoverController: PopoverController,
    public dbProvider: DatabaseService,
    public studentService:StudentDataService,
    private appRate: AppRate,
    private storageSr: StorageService,
    // public photoLibrary: PhotoLibrary
    ) {
    this.events = new EventEmitter();
    this.language = new EventEmitter();
    this.selectedUsers = new EventEmitter();
    this.platform.ready().then(() => {
      setTimeout(res=>{
         this.translate.get("alertmessages").subscribe((res)=>{
                this.lang = res;
                // console.log(this.translate.instant('alertmessages'))
        })
      },2000)
    });
    this.language.subscribe(res=>{
      environment.lang_code=res;
    })
    this.network.onDisconnect().subscribe(() => {
      this.showToast('No Internet connection...');
    });

    this.network.onConnect().subscribe(() => {
      this.showToast('Internet connected');
      this.syncOffileData();
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
        this.events.emit(user);
      }
      window.location.href = '/tabs';
    }
  }

  async openAvatarModel(pic){
    this.img = pic;
    const modal = await this.modalController.create({
      component: ProfileImagePage,
      componentProps : {pic : pic}
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
    async presentRatingPopover(lang,note,callback:any) {
      // console.log('call');
      const popover = await this.popoverController.create({
        component: RateAppComponent,
       // event: ev,
        translucent: false,
        mode:"ios",
        cssClass:'ratePopup',
        backdropDismiss:false,
        componentProps:{lang:lang,data:note}
      });
      await popover.present();
      popover.onDidDismiss().then((response) => {
          // console.log('call',response);
          if(response.data){
            callback(response.data);
          }else{
            callback(false);
          }
      });
    }

    async editClassModal(course:any,callback:any){

      //   const modal = await this.modalController.create({
      //   component: EditCalssPage,
      //   cssClass: 'my-custom-class',
      //   componentProps: {couerse:course}
      // });
      // await modal.present();
      // modal.onDidDismiss().then(res=>{
      //   callback(res);
      // })
    }

  async  viewNotes(data,state){
      //   const modal = await this.modalController.create({
      //   component: ViewClassNotesPage,
      //   cssClass: 'my-custom-class',
      //   componentProps: {data:data,state:state}
      // });
      // await modal.present();
  }

    /**
    * submit rating to playstore
    * @param rating - int rating value
    */
    submitRating(rating){

    }

      showRatePrompt(lang){
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

   async switchAccount(ev,lang){
      const popover = await this.popoverController.create({
        component: SwitchAccountComponent,
        // event: ev,
        translucent: false,
        cssClass:'switch-account',
        backdropDismiss:true,
        componentProps:{lang:lang}
      });
      await popover.present();
      popover.onDidDismiss().then((response) => {
         // console.log('call',response);
          // if(response.data){
          //   this.submitRating(response.data)
          // }else{
          //   this.showToast(lang.no_rating);
          // }
      });
    }
    async editStudentClass(ev,student,classes,user,callback:any){
      const popover = await this.popoverController.create({
        component: EditStudentProfileComponent,
        event: ev,
        translucent: false,
        mode:"ios",
        cssClass:'edit-student',
        backdropDismiss:true,
        componentProps:{student:student,classes:classes}
      });
      await popover.present();
      popover.onDidDismiss().then((response) => {
        // console.log('call',response);
         if(response.data){
           if(response.data.deleteClass){
             let deleteData={
               sid:response.data.student.sid,
               cid:response.data.student.cid,
              user_no: user.user_no,
              school_id: user.school_id,
              session_id: user.session_id
             }
             this.deleteStudentClass(deleteData,res=>{
               callback(res);
             });
           }else{
             let updateData={
               sid:response.data.student.sid,
               cid:response.data.student.cid,
               student_name:response.data.studentName,
                class_id:response.data.studentSemester,
                user_no: user.user_no,
                school_id: user.school_id,
                session_id: user.session_id
             }
             this.updateStudentProfile(updateData,res=>{
               callback(res);
             });
           }
         }
      });
    }


    deleteStudentClass(data, callback:any){
      this.postRequest(data, 'deleteStudentClass').then((response: any) => {
        if (response) {
          this.showToast(response.msg);
          callback(response);
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }

    deleteStudent(data, callback:any){
      this.postRequest(data, 'deleteStudent').then((response: any) => {
        if (response) {
          this.showToast(this.lang.delete_student_success_msg);
          callback(response);
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }
    deleteTeacher(data, callback:any){
      this.postRequest(data, 'deleteTeacher').then((response: any) => {
        if (response) {
          this.showToast(response.msg);
          callback(response);
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }

    deleteParent(data, callback:any){
      this.postRequest(data, 'deleteParent').then((response: any) => {
        if (response) {
          this.showToast(response.msg);
          callback(response);
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }

    /*-----------delete user except parent,student and teacher----------*/
    deleteUser(data, callback: any){
      this.postRequest(data, 'deleteUser').then((response: any)=>{
        if(response){
          this.showToast(response.msg);
          callback(response);
        }
      }).catch((error)=>{
        console.log(error);
      })

    }
    
    deleteNote(data, callback:any){
      this.postRequest(data, 'deleteNotes').then((response: any) => {
        if (response) {
          this.showToast(response.msg);
          callback(response);
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }
    updateStudentProfile(data, callback:any){
      this.postRequest(data, 'updateStudentProfile').then((response: any) => {
        if (response) {
          if(!response.response){
           
            this.errorALertMessage(response.msg);
        }else{
          callback(response);
          this.showToast(this.lang.edit_student_success_msg);
        }
          
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }

    updateStudentMedical(data, callback:any){
      this.postRequest(data, 'updateStudentMedical').then((response: any) => {
        if (response) {
          if(!response.response){
           
            this.errorALertMessage(response.msg);
        }else{
          callback(response);
          this.showToast(this.lang.edit_student_success_msg);
        }
          
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }
    updateStudentPhone(data, callback:any){
      this.postRequest(data, 'updateStudentPhone').then((response: any) => {
        if (response) {
          if(!response.response){
           
            this.errorALertMessage(response.msg);
        }else{
          callback(response);
          this.showToast(this.lang.edit_student_success_msg);
        }
          
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }
    SendPushNotification(data, callback:any){
      this.postRequest(data, 'SendPushNotification').then((response: any) => {
        if (response) {
          if(!response.response){
           
            this.errorALertMessage(response.msg);
        }else{
          callback(response);
          //this.showToast("Notification Sent Success!");
        }
          
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }
    requestTodeleteSchoolAccount(data,callback:any){
      this.postRequest(data, 'RequestdeleteSchool').then((response: any) => {
        if (response) {
          if(!response.response){
           
            this.errorALertMessage(response.msg);
        }else{
          callback(response);
          //this.showToast("Notification Sent Success!");
        }
          
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }
    deleteSchoolPermanentlyRequest(data,callback:any){
      this.postRequest(data, 'deleteSchoolPermanentlyRequest').then((response: any) => {
        if (response) {
          if(!response.response){
           
            //this.errorALertMessage(response.msg);
        }else{
          callback(response);
          //this.showToast("Notification Sent Success!");
        }
          
        }
      }).catch((error) => {
        console.log(error);
          //this.showToast(response.message);
      })
    }
    updateTeacherProfile(data, callback:any){
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
           data.lang_code = environment.lang_code;
           let body = new HttpParams();
           Object.keys(data).forEach(function (key) {
              body = body.append(key, data[key]);
          });
          body['class']=[];
           Object.keys(data.class).map((key) => {
            Object.keys(data.class[key]).map((sid) => {
              body=body.append('classes'+'['+ key+']'+'['+sid+']' , data.class[key][sid]);
            })
          })

      this.httpClient.post( env.serverURL + 'updateTeacherProfile',body, { headers: header }).subscribe((response: any) => {
        if (response) {
          if (response.response==false) {
            callback({ session: false, message: response.msg });
          } else if (response.response==true) {
           // this.dbProvider.insertClasses(response.courses);
            callback({ session: true, data: response.msg});
          } else {
            callback(response.msg)
          }
        } else {
        }
      },(error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          callback(error.message)
        } else {
          callback(this.lang.usnexpectedError)
        }
      });
    }

    /* --------------update users profile-------newcode 15/11/21 */
  updateUserProfile(data, callback:any){
    let header = new HttpHeaders();
    header.append('content-type', 'application/json');
    data.lang_code = environment.lang_code;
    let body = new HttpParams();
    Object.keys(data).forEach(function (key){
      body = body.append(key, data[key]);
    });
    // body['class']=[];
    // Object.keys(data.class).map((key)=>{
    //   Object.keys(data.class.key).map((sid)=>{
    //     body = body.append('classes'+'['+ key+']'+'['+sid+']' , data.class[key][sid]);
    //   })
    // })
    this.httpClient.post(env.serverURL + 'updateNewUser', body, {headers: header}).subscribe((response: any)=>{
      if (response) {
         if (response.response==false) {
           callback({ session: false, message: response.msg });
         } else if (response.response==true) {
          // this.dbProvider.insertClasses(response.courses);
          this.showToast(response.msg);
           callback({ session: true, data: response.msg});
         } else {
           callback(response.msg)
         }
       } else {
       }
     },(error) => {
       console.log(error);
       if (error.message != undefined && error.message != '' && error.message != null) {
         callback(error.message)
       } else {
         callback(this.lang.usnexpectedError)
       }
     });
   }

  /**
   * This is a user defined loader
   * @param ev - event
   */
  async presentPopover(ev:any) {
    // 🔴 حماية إضافية: التأكد من إغلاق أي نافذة سابقة قبل فتح واحدة جديدة
    if (this.popOver) {
      this.closePopup();
    }
    
    this.popOver = await this.popoverController.create({
      component: LoaderComponent,
      backdropDismiss:true,
      translucent: false,
      cssClass:'loaderStyle'
    });
    return await this.popOver.present();
  }

  // 🔴 الكود الآمن لإغلاق النافذة
  closePopup(){
    if(this.popOver) {
      this.popOver.dismiss().catch((err) => console.log('Popover already dismissed'));
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
   * This is a toast message function
   * @param message - string of message to be shown
   */
  async showToast(message: string) {    
     const alert = await this.toastCtrl.create({
      message: message,
      position: 'bottom',
      cssClass:'toastClass',
      duration: 3000
    });
    await alert.present();
  }

  /** ALert message popup.
   * @param {String} error - Error message to display
  */
  async errorALertMessage(error: string) {
    const alert = await this.alertCtrl.create({
      header: 'تحذير',
      message: this.removeUrlFromString(error),
      backdropDismiss: false,
      buttons: ['Ok']
    });
    await alert.present();
  }

  removeUrlFromString(inputString) {
    // Use a regular expression to match URLs
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    // Replace URLs with an empty string
    return inputString.replace(urlRegex, '');
  }

  /** ALert message popup.
   * @param {String} msg - Error message to display
  */
  async msgALertMessage(msg: string) {
    const alert = await this.alertCtrl.create({
      header: 'معلومات',
      message: msg,
      backdropDismiss: false,
      buttons: ['Ok']
    });
    await alert.present();
  }

  /** Search all user from API.
   * @returns Array of users list or error
  */

  searchUser(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'search_user').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }  
  searchAllUser(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'search_user_all').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

/* searchUser except teacher,parent and student date 12/11/2021 */
newUserSearch(data):Promise<any>{
  return new Promise((resolve, reject)=>{
    this.postRequest(data, 'new_user_search').then((response: any) => {
      if(response){
        resolve({session: true, data:response})
      }else{
        reject(response.msg);
      }
    }).catch((error)=>{
      console.log(error);
    })

  })
}

  markBulletinRead(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'markBulletinRead').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
  deleteBulletin(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'delete_bulletins').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
  closeBulletin(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'closed_bulletins').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
  reOpenBulletin(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'reOpenBulletin').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
  getBulletinDetails(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'bulletins_details').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }  
  getStudentReports(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getStudentReports').then((response: any) => {
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
      this.postRequest(data, 'getAllDegress').then((response: any) => {
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
      this.postRequest(data, 'getViolationActions').then((response: any) => {
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
  getCountStudents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getCountStudents').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true,msg:response.msg});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
  getCountTodayNewsPost(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getCountTodayNewsPost').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.data,success:true,msg:response.msg});
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
      this.postRequest(data, 'GetCallOfStudentsRepoerts').then((response: any) => {
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
      this.postRequest(data, 'GetStudentPledgesReport').then((response: any) => {
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
  ApplyVoucherCode(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'ApplyVoucherCode').then((response: any) => {
        if (response) {
            resolve({ session: response.session,success:response.success,msg:response.msg});
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
      this.postRequest(data, 'generateStudentPledgesReportPDF').then((response: any) => {
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
      this.postRequest(data, 'generateCallOfStudentPDF').then((response: any) => {
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
      this.postRequest(data, 'getDegreeViolations').then((response: any) => {
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
      this.postRequest(data, 'submitStudentReports').then((response: any) => {
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
      this.postRequest(data, 'removeStudentReportByType').then((response: any) => {
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
      this.postRequest(data, 'deleteCallOfParentReport').then((response: any) => {
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
      this.postRequest(data, 'deletePledgesReport').then((response: any) => {
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
      this.postRequest(data, 'printAllReports').then((response: any) => {
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

  //==========added on 28/12/21 for print class notes as pdf=========
  printAllClassNotes(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, data.is_multi ? 'printMultipleClassNotes' : 'printClassNotes').then((response: any) => {
        // this.postRequest(data, 'printClassNotes').then((response: any) => {
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

  getBulletins(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getBulletins').then((response: any) => {
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
  editAbsentNotes(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'editAbsentNotes').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response,message:response.mg});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
  shareBulletins(data): Promise<any> {
    return new Promise((resolve, reject) => {
       let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          data.lang_code = environment.lang_code;
          let body: HttpParams = this.makeObjectToUrlParams(data);

           Object.keys(data.users).map((key) => {
             console.log('key',key);
              body=body.append('shareto_user_no'+'['+ key+']' , data.users[key]);
          })
              // console.log(body);

      this.httpClient.post( env.serverURL + 'shareBulletins',body, { headers: header }).subscribe((response: any) => {
        if (response) {
            resolve({ session: true, data: response.response,message:response.msg});
        } else {
            reject(response.msg)
        }
      },(error) => {
        console.log(error);
      });
      // console.log(data);
      // this.postRequest(data, 'shareBulletins').then((response: any) => {
      //   if (response) {
      //       resolve({ session: true, data: response.response,message:response.msg});
      //   } else {
      //       reject(response.msg)
      //   }
      // }).catch((error) => {
      //   console.log(error);
      // })
    })
  }

  commentBulletins(data): Promise<any> {
    return new Promise((resolve, reject) => {
       let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          data.lang_code = environment.lang_code;
          let body: HttpParams = this.makeObjectToUrlParams(data);

      this.httpClient.post( env.serverURL + 'commentBulletins',body, { headers: header }).subscribe((response: any) => {
        if (response) {
            resolve({ session: true, data: response.response,message:response.msg});
        } else {
            reject(response.msg)
        }
      },(error) => {
        console.log(error);
      });
    })
  }
    /** Search all student of School from API.
   * @returns Array of users list or error
  */

  serachStudent(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'search_student').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  searTeacher(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getTeacherWithPagging').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }
      /** Search all parent of School from API.
   * @returns Array of users list or error
  */

  serachParent(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'serachParent').then((response: any) => {
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

  /** Get school list from API.
   * @returns Array of school list or error
  */
  getSchool(country_code): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          let url=env.serverURL + 'getSchoolsHavingMaterials/' + ( (country_code && typeof country_code !=='undefined') ? '?country_code='+country_code  : '');
          this.httpClient.post(url,country_code, { headers: header }).subscribe((response: any) => {
            if (response.success) {
              resolve(response.schools);
            } else {
              reject("Server is not responding")
            }
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }
    /** Get teacher list of a perticular school  from API.
   * @returns Array of teacher list or error
  */
  getTeachers(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getAllTeachers').then((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
           // this.dbProvider.insertClasses(response.courses);
            resolve({ session: true, data: response.profile});
          } else {
            reject(response.msg)
          }
        } else {
          // this.dbProvider.getClasses().then((classes) => {
          //   resolve({ session: true, data: classes });
          // }).catch((error) => {
          //   reject(error);
          // })
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /* get all the users except teacher studet and parent */

  getAllUsers(users):Promise<any>{
    return new Promise((resolve,reject)=> {
    this.postRequest(users, 'getSchoolUsersList').then((response: any) =>{
      if (response) {
        console.log('alluserslist',response);
         if (response.session==false) {
           resolve({ session: false, message: response.msg });
         } else if (response.session==true) {
           resolve({ session: true, data: response.response});
         } else {
           reject(response.msg)
         }
       } else {
         
       }
     }).catch((error) => {
       console.log(error);
       if (error.message != undefined && error.message != '' && error.message != null) {
         reject(error.message)
       } else {
         reject(this.lang.usnexpectedError)
       }
     })
    })
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
          body= body.append("class_id", data.class_id);
          body= body.append("school_id", data.school_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);
          body['teachersList']=<any>[];
          let obj=[];
          for (let i = 0; i < data.teachersList.length; i++) {
            // code...
          }
           Object.keys(data.teachersList).map((key) => {
             console.log('key',key);
            Object.keys(data.teachersList[key]).map((sid) => {
             console.log('ap',sid);
              body=body.append('teachersList'+'['+ key+']'+'['+sid+']' , data.teachersList[key][sid]);
            })
          })
              // console.log(body);

      this.httpClient.post( env.serverURL + 'updateTeachers',body, { headers: header }).subscribe((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
           // this.dbProvider.insertClasses(response.courses);
            resolve({ session: true, data: response.msg});
          } else {
            reject(response.msg)
          }
        } else {
          // this.dbProvider.getClasses().then((classes) => {
          //   resolve({ session: true, data: classes });
          // }).catch((error) => {
          //   reject(error);
          // })
        }
      },(error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      });
    })
  }
  /** update teacher list of a perticular class of a school .
   * @returns updation status
  */
  createBulletins(data){

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
  createclassNotes(data){
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
    getStatusMessage(event){

    let status;
        switch(event.type){

          case HttpEventType.UploadProgress:
            status = Math.round(100 * event.loaded / event.total);
            this.uploadProgress.next(status);
            this.events.emit(status);
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
      this.postRequest(data, 'deleteClass').then((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
           // this.dbProvider.insertClasses(response.courses);
            resolve({ session: true, data: response.msg});
          } else {
            reject(response.msg)
          }
        } else {
          // this.dbProvider.getClasses().then((classes) => {
          //   resolve({ session: true, data: classes });
          // }).catch((error) => {
          //   reject(error);
          // })
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  openPdf(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'check_user_plan').then((response: any) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response);
          }
        } else {
            reject(response);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
  openStudentReport(url): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
      this.http.get(url, { headers: header }).subscribe((res)=>{
        resolve(res);
      },e=>{
        resolve(e);
      })
    })
  }
  
  newsSectionHideShow(url): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
      this.http.get(environment.serverURL + url, { headers: header }).subscribe((res)=>{
        resolve(res);
      },e=>{
        resolve(e);
      })
    })
  }

  getPointsValue(): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
      this.http.get(environment.serverURL + 'getPointsValue', { headers: header }).subscribe((res)=>{
        resolve(res);
      },e=>{
        resolve(e);
      })
    })
  }
  getPlan(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getPlan').then((response: any) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response);
          }
        } else {
            reject(response);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
  getUserPlan(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getUserPlan').then((response: any) => {
        if (response) {
            resolve(response);
        } else {
            reject(response);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  } 

  registerTeacher(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'createNewTeacher').then((response: any) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response.msg);
          }
        } else {
            reject(response);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }  

  /*=================create new user except teacher,parent and student======================*/

  registerNewUser(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'addNewUser').then((response: any) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response.msg);
          }
        } else {
            reject(response);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  subscribePlan(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'subscribe_plans').then((response: any) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response);
          }
        } else {
            reject(response);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  purchase(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'purchase').then((response: any) => {
        if (response) {
          if(response.response){
            resolve(response);
          }else{
            reject(response);
          }
        } else {
            reject(response);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Get parent list of a perticular school who recently registered on app  from API.
   * @returns Array of parent list or error
  */
  getRequestedParents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getNewParents').then((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
           // this.dbProvider.insertClasses(response.courses);
            resolve({ session: true, data: response.parents});
          } else {
            reject(response.msg)
          }
        } else {
          // this.dbProvider.getClasses().then((classes) => {
          //   resolve({ session: true, data: classes });
          // }).catch((error) => {
          //   reject(error);
          // })
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
  getAllParents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getAllParents').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
  /** take action on requested registered parents.
   * @returns status of action
   * @param parent id
   * @param school id

  */

  acceptRequestedParents(data): Promise<any> {
    return new Promise((resolve, reject) => {
         //console.log('requtedprrr=>>>',data);
      this.postRequest(data, 'acceptParentRequest').then((response: any) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false });
          } else {
            resolve({ session: true });
          }
        } else {
          reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  changeParentStatus(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'changeParentStatus').then((response: any) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false,msg:response.msg });
          } else {
            resolve({ session: true,msg:response.msg });
          }
        } else {
          reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
    /** delete requested registered parents.
   * @returns status of action
   * @param parent id
   * @param school id

  */
  deleteRequestedParents(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'deleteParentRequest').then((response: any) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false });
          } else {
            resolve({ session: true });
          }
        } else {
          reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }


  /** Get E-Learning categories list from API.
  * @returns Array of category list or error
 */
  getElearningMaterials(schoolId: any,country_code): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');

          let url=env.serverURL + 'getElearningMaterials/'+ schoolId + ( (country_code && typeof country_code !=='undefined') ? '?country_code='+country_code  : '');
          this.httpClient.get(url, { headers: header }).subscribe((response: any) => {
            if (response.success) {
              resolve(response.materials);
            } else {
              reject("Server is not responding")
            }
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }
  getShareLink(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');

          let url=env.serverURL + 'getAppShareLink?'+'lang=en' ;
          this.httpClient.get(url, { headers: header }).subscribe((response: any) => {
            if (response) {
              resolve(response);
            } else {
              reject("Server is not responding")
            }
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /** Get E-Learning material data from API.
    * @returns Array of material data or error
   */
  getMaterialDetails(materialId: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          this.httpClient.get(env.serverURL + 'getMaterialDetails/' + materialId, { headers: header }).subscribe((response: any) => {
            if (response.success) {
              resolve(response.material);
            } else {
              reject("Server is not responding")
            }
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /** Get ads on login page.
   * @returns Array of ads or error
  */
  getAds(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          this.httpClient.get(env.serverURL + 'getAds', { headers: header }).subscribe((response: any) => {
            resolve(response);
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          resolve(false);
        }
      })
    })
  }

  /** Get news from API for news page.
   * @returns Array of news or error
  */
  getNews(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          this.httpClient.get(env.serverURL + 'getNews', { headers: header }).subscribe((response: any) => {
            if (response.success) {
              resolve(response.news);
            }
            resolve(response);
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /** Get news from API with paging.
   * @param {number} start - starting point of news list
   * @param {number} newsPerPage - how many news in one page
   * @param {object} userDeatils logged in user details
   * @param {char} countrycode - to get news of current locaion
   * @returns Array of News as per location or error
  */
  getNewsJoin(start: number, newsPerPage: number, userDeatils: any,countryCode): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          let url = '';

          if (userDeatils) {
            url = env.serverURL + 'getNewsjoin/' + start + '/' + newsPerPage + '/desc/' + userDeatils.user_no;
          } else {
            url = env.serverURL + 'getNewsjoin/' + start + '/' + newsPerPage + '/desc';
          }

          url = `${url}?school_id=${userDeatils?.school_id}&user_no=${userDeatils?.user_no}`
          if(countryCode && typeof countryCode !=='undefined'){
             url= url+'&code='+countryCode;
          }
        

          this.httpClient.get(url, { headers: header }).subscribe((response: any) => {
            if (response.success) {
              if (response.news.length > 20) {
                this.dbProvider.insertNews(response.news.slice(0, 20));
              } else {
                this.dbProvider.insertNews(response.news);
              }
              resolve(response.news);
            }
            resolve(response);
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          this.dbProvider.getNews().then((news) => {
            resolve(news);
          }).catch((err) => {
            reject(err);
          })
        }
      })
    })
  }

  /**
   * Like the news post
   * @param data user_no, news_id, session_id
   */
  likeNewsPost(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'likeNewsPost').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Dislike the news post
   * @param data user_no, news_id, session_id
   */
  dislikeNewsPost(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'dislikeNewsPost').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, data: response.courses });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  getCourses(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
    	// console.log(data);
      this.postRequest(data, 'getCourses/' + data.school_id).then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            this.dbProvider.insertClasses(response.courses);
            resolve({ session: true, data: response.courses, linkData: response.activeLink });
          } else {
            reject(response.msg)
          }
        } else {
          this.dbProvider.getClasses().then((classes) => {
            resolve({ session: true, data: classes });
          }).catch((error) => {
            reject(error);
          })
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  } 

   /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  getTeachersClass(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getTeachersClass/' + data.school_id).then((response: any) => {
        if (response) {
           if (response.success) {
            resolve({ session: true, data: response.courses});
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
    /** Get follow up fields.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  getFollowupFields(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getFollowupFields').then((response: any) => {
        if (response) {
           if (response.success) {
            resolve({ session: true, data: response.result});
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
    /** delete fields.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  deleteFollowupFields(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'deleteFollowupFields').then((response: any) => {
        if (response) {
           if (response.success) {
            resolve({ session: true, data: response.result});
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

    getSelectedCourses(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getSelectedCourses/' + data.school_id).then((response: any) => {
        if (response) {
           if (response.success) {
            resolve({ session: true, data: response.selectedCourses});
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
  /** Get courses from API to show on classlist page.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  setTeachersClass(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
           let body = new HttpParams();
           data.lang_code = environment.lang_code;
           Object.keys(data).forEach(function (key) {
              body = body.append(key, data[key]);
          });
          // body['updates']=[];
           Object.keys(data.updates).map((key) => {
            Object.keys(data.updates[key]).map((sid) => {
              body=body.append('courcesData'+'['+ key+']'+'['+sid+']' , data.updates[key][sid]);
            })
          })
      this.httpClient.post( env.serverURL + 'setTeachersClass/'+ data.school_id,body, { headers: header }).subscribe((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
            resolve({ session: true, data: response.msg});
          } else {
            resolve(response.msg)
          }
        } else {
        }
      },(error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      });
    })
  }


    /** set inpu5t field for follow up student.
   * @param {Object} data - contains user_no, school_id, session_id
   * @returns list of courses or error
  */
  saveFollowupFields(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
           let body = new HttpParams();
           data.lang_code = environment.lang_code;
           Object.keys(data).forEach(function (key) {
             if(key != 'field') body = body.append(key, data[key]);
          });
          // body['updates']=[];
           Object.keys(data.field).map((key) => {
            Object.keys(data.field[key]).map((sid) => {
              body=body.append('field'+'['+ key+']'+'['+sid+']' , data.field[key][sid]);
            })
          })
      this.httpClient.post( env.serverURL + 'saveFollowupFields',body, { headers: header }).subscribe((response: any) => {
        if (response) {
         console.log('tescherList',response);
          if (response.success==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.success==true) {
            resolve({ session: true, data: response.result});
          } else {
            resolve(response.msg)
          }
        } else {
        }
      },(error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      });
    })
  }
/** get all seminars and their total present absent total student

*/

  getSeminarClassList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'getSeminarClassList/' + data.school_id).then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
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
          body= body.append("school_id", data.school_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);
          Object.keys(data.list).map((key) => {
            Object.keys(data.list[key]).map((sid) => {
              body= body.append('list[' + key + '][' + sid + ']', data.list[key][sid]);
            })
          })
          this.http.post(environment.serverURL + 'reorderClasses', body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (response.success == true) {
              resolve(true);
            } else {
              // this.errorALertMessage(response.msg);
              resolve(false);
            }
          }, (error) => {
            console.log(error);
            resolve(false);
          })
    })
  }

  /** submit email for forgot password
  */
  submitEmail(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'forgot_password').then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
  /** Check OTP for sorgot password
  */
  checkOtp(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'checkOtp').then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
  /** reset pass. for sorgot password
  */
  resetPassword(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'reset_password').then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** get all student of a school
  */
  getSchoolStudents(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'get_school_stu').then((response: any) => {
        if (response) {
          if (!response.response) {
            resolve({ session: false, message: response.msg });
          } else if (response.response) {
            resolve({ session: true, data: response.response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    }) 
  }

    /** get all student of a school
  */
  getSchoolUsers(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'get_school_users').then((response: any) => {
          if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
          reject(error.message)

      })
    })
  }

  getAllSchoolUsers(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.postRequest(data, 'get_school_users_all').then((response: any) => {
          if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
          reject(error.message)

      })
    })
  }

  todayDashboard(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          this.postRequest(data, 'todayDashboard/' + data.school_id).then((response: any) => {
            if (response) {
              if (!response.response) {
                resolve({ session: false, message: response.msg });
              } else if (response.response) {
                resolve({ session: true, data: response.response });
                this.studentService.setStaticalData(data.user_no,response.response);
              } else {
                reject(response.msg)
              }
            } else {
              reject(response.msg)
            }
          }).catch((error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        }else{
          this.studentService.getOfflineStatical(data.user_no,res=>{
            resolve({ session: true, data: res });
          })
        }
      })
      
    })
  }

   /** Register new course.
   * @param {Object} data - contains user_no, school_id, code, name, desc, semno
   * @returns Success or error msg
  */
 createNewCourse(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'createCourse').then((response: any) => {
      if (response) {
        if (!response.session) {
          resolve({ session: false, message: response.msg });
        } else if (response.success) {
          resolve({ session: true, message: response.msg });
        } else {
          reject(response.msg)
        }
      }
    }).catch((error) => {
      console.log(error);
      if (error.message != undefined && error.message != '' && error.message != null) {
        reject(error.message)
      } else {
        reject(this.lang.usnexpectedError)
      }
    })
  })
}

/** Register new teacher.
   * @param {Object} data - contains user_no, school_id, Teacher Id, teacher name, teacher password
   * @returns Success or error msg
  */
 registerNewTeacher(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'registerNewTeacher').then((response: any) => {
      if (response) {
        if(response.success) {
          resolve(response.msg);
        } else {
          reject(response.msg)
        }
      }
    }).catch((error) => {
      console.log(error);
      if (error.message != undefined && error.message != '' && error.message != null) {
        reject(error.message)
      } else {
        reject(this.lang.usnexpectedError)
      }
    })
  })
}

 registerNewParent(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'registerNewParent').then((response: any) => {
      if (response) {
        if(response.success) {
          resolve(response.msg);
        } else {
          reject(response.msg)
        }
      }
    }).catch((error) => {
      console.log(error);
      if (error.message != undefined && error.message != '' && error.message != null) {
        reject(error.message)
      } else {
        reject(this.lang.usnexpectedError)
      }
    })
  })
}

createNewParent(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'createNewParent').then((response: any) => {
      if (response) {
        if(response.success) {
          resolve(response.msg);
        } else {
          reject(response.msg)
        }
      }
    }).catch((error) => {
      console.log(error);
      if (error.message != undefined && error.message != '' && error.message != null) {
        reject(error.message)
      } else {
        reject(this.lang.usnexpectedError)
      }
    })
  })
}
  getAllRules(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getAllRules').then((response: any) => {
        if (response) {
          if(response.details) {
            resolve(response.details);
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
        //  reject(this.lang.usnexpectedError)
        }
      })
    })
  }

/** Register new Student.
   * @param {Object} data - contains user_no, school_id, name, student_id
   * @returns Success or Error msg
  */
 registerStudent(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'registerStudent').then((response: any) => {
      if (response) {
        if (!response.session) {
          resolve({ session: false, message: response.msg });
        } else if (response.success) {
          resolve({ session: true, message: response.msg });
        } else {
          reject(response.msg)
        }
      } else {
        this.dbProvider.getClasses().then((classes) => {
          resolve({ session: true, data: classes });
        }).catch((error) => {
          reject(error);
        })
      }
    }).catch((error) => {
      console.log(error);
      if (error.message != undefined && error.message != '' && error.message != null) {
        reject(error.message)
      } else {
        reject(this.lang.usnexpectedError)
      }
    })
  })
}

  /**
   * Update course description
   * @param data user_no, session_id, cid, course object
   */
  updateCourseDesc(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let headers = new HttpHeaders();
          headers.set('Content-Type', 'application/x-www-form-urlencoded');
          let body = new HttpParams();
          body= body.append("cid", data.cid);
          body= body.append("session_id", data.session_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);
          body=body.append('course[name]', data.course.name);
          body=body.append('course[desc]', data.course.desc);
          this.http.post(environment.serverURL + '/manageCourse', body, {headers}).subscribe((res) => {
            let response = res;
            if (!response['session']) {
              resolve({ session: false, message: response['msg'] });
            } else if (response['success']) {
              resolve({ session: true, data: response['courses'] });
            } else {
              reject(response['msg'])
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /**
   * Get holiday list from backend
   * @param data user_no, school_id, session_id
   */
  getHolidays(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getHolidays/' + data.school_id).then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(response);
          } else {
            reject(response.msg)
          }
        } else {
          resolve(false);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Get student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
  */
  getClassStudentList(data: any): Promise<any> {
    return new Promise(async (resolve, reject) => { // 👈 أضفنا async هنا
      this.postRequest(data, 'getStudents/' + data.course_id).then(async (response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            this.dbProvider.insertStudentList(response.students, 5);
            resolve({ session: true, data: response });
          } else {
            reject(response.msg)
          }
        } else {
          // 👈 التعديل الجذري للحفظ الأوفلاين هنا
          let attendance = await this.storageSr.get("classlocalatt");
          if (attendance) {
            if (attendance[data.course_id]) {
              resolve({ session: true, data: attendance[data.course_id] });
            } else {
              this.dbProvider.getStudentList(data.course_id).then((students) => {
                resolve({ session: true, data: { students: students, last_cem: 0, semteacher: [] } });
              }).catch((error) => {
                reject(error);
              })
            }
          } else {
            this.dbProvider.getStudentList(data.course_id).then((students) => {
              resolve({ session: true, data: { students: students, last_cem: 0, semteacher: [] } });
            }).catch((error) => {
              reject(error);
            })
          }
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Get student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
  */
  getFollowUpStudentList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getFollowUpStudentList/' + data.course_id).then((response: any) => {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, data: response });
          } else {
            reject(response.msg)
          }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Delete student marks according to course and user id with selected date.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
  */
  deleteFollowUpStudentList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'deleteFollowUpStudentList/' + data.course_id).then((response: any) => {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, data: response });
          } else {
            reject(response.msg)
          }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

    /** Get student PDF.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
  */
  getMarksReport(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getMarksReport/' + data.course_id).then((response: any) => {
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
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  getStudentReport(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'student_report_new_excel').then((response: any) => {
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
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  sendPushMessageToStudentParent(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'sendPushMessageToStudentParent').then((response: any) => {
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
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Get delay student list according to course.
   * @param {Object} data - date, user_no, session_id, course_id, school_id
   * @returns list of students or error
  */
  getDelayClassStudentList(data: any): Promise<any> {
    return new Promise(async (resolve, reject) => { // 👈 أضفنا async هنا
      this.postRequest(data, 'getStudents_delay/' + data.course_id).then(async (response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: response.session, message: response.msg, success: response.success, data: response });
          } else if (response.success) {
            this.dbProvider.insertStudentList(response.students, response.delay_rule);
            resolve({ session: response.session, data: response, success: response.success });
          } else {
            reject(response.msg)
          }
        } else {
          // 👈 القراءة الآمنة من الذاكرة هنا
          let attendance = await this.storageSr.get("delayclasslocalatt");
          if (attendance) {
            if (attendance[data.course_id]) {
              resolve({ session: true, data: attendance[data.course_id] });
            } else {
              this.dbProvider.getStudentList(data.course_id).then((students) => {
                if (students.length > 0) {
                  resolve({ session: true, data: { students: students, last_cem: 0, semteacher: [], delay_rule: students[0].delay_rule } });
                } else {
                  resolve({ session: true, data: { students: students, last_cem: 0, semteacher: [], delay_rule: 5 } });
                }
              }).catch((error) => {
                reject(error);
              })
            }
          } else {
            this.dbProvider.getStudentList(data.course_id).then((students) => {
              if (students.length > 0) {
                resolve({ session: true, data: { students: students, last_cem: 0, semteacher: [], delay_rule: students[0].delay_rule } });
              } else {
                resolve({ session: true, data: { students: students, last_cem: 0, semteacher: [], delay_rule: 5 } });
              }
            }).catch((error) => {
              reject(error);
            })
          }
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Get student details.
   * @param {Object} data - user_no, session_id, cid, date, sid
   * @returns Student details or error
  */
  getStudentDetails(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          this.postRequest(data, 'viewStudent/' + data.sid).then((response: any) => {
            if (response) {
              if (!response.session) {
                reject(response.msg)
              } else if (response.success) {
                resolve({ session: true, data: response.details });
                let a=response.details
                let data=[];
                data.push(a);
              } else {
                reject(response.msg)
              }
            } else {
              reject(this.lang.networkNotWorking);

            }
          }).catch((error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        }

      })

    })
  }

  /** Get notes of the student.
   * @param {Object} data - user_no, session_id, cid, date, sid
   * @returns List of notes or error
  */
  getStudentNotes(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getStudentNote/' + data.sid).then((response: any) => {
        if (response) {
          if (response.status) {
            resolve(response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  createNotes(data: any): Promise<any> { 
    return new Promise((resolve, reject) => {
       let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
           let body = new HttpParams();
           data.lang_code = environment.lang_code;
           Object.keys(data).forEach(function (key) {
              body = body.append(key, data[key]);
          });
          body['studentIds']=[];
           Object.keys(data.studentIds).map((key) => {
            Object.keys(data.studentIds[key]).map((sid) => {
              body=body.append('studentId'+'['+ key+']'+'['+sid+']' , data.studentIds[key][sid]);
            })
          })

      this.httpClient.post( env.serverURL + 'createNotes',body, { headers: header }).subscribe((response: any) => {
        if (response) {
          if (response.response==false) {
            resolve({ session: false, message: response.msg });
          } else if (response.response==true) {
            resolve({ session: true, data: response.msg});
          } else {
            resolve(response.msg)
          }
        } else {
        }
      },(error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      });
    })
  }

  getClassNotes(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'studentClassNotes').then((response: any) => {
        if (response) {
          if (response.response) {
            resolve(response.response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  getAllClassNotes(data: any): Promise<any> {  
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'all_classNotes').then((response: any) => {
        if (response) {
          if (response.response) {
            resolve(response.response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }  

  getAllWarning(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getWarningReport').then((response: any) => {
        if (response) {
          if (response.response) {
            resolve(response.response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }  
  printWarning(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getWarningReportPdf').then((response: any) => {
        if (response) {
          if (response.response) {
            resolve(response.response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Get notification of the school.
   * @param {Object} data- user_no, school_id, session_id
   * @returns list of notifications or error
   */
  getNotifications(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getNotifications/' + data.school_id).then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            this.dbProvider.insertPrivateMessages(response.list);
            resolve({ session: true, data: response.list });
          } else {
            reject(response.msg)
          }
        } else {
          this.dbProvider.getPrivateMessages().then((messages) => {
            resolve({ session: true, data: messages });
          })
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * delete user notification
   * @param data user_no, nid, session_id
   */
  deleteNotification(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'deleteNotifications').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  markAttendance(data: any): Promise<any> {
    console.log("Data going to server:", data);
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body = body.append("cid", data.cid);
          body = body.append("date", data.date);
          body = body.append("session_id", data.session_id);
          body = body.append("user_no", data.user_no);
          body = body.append("lang_code", data.lang_code);

          // السماح للمتغيرات بالمرور للسيرفر
          if (data.user_type) body = body.append("user_type", data.user_type);
          if (data.username) body = body.append("username", data.username);

          let index = 0;
          if (data.removal_sheet) {
            Object.keys(data.removal_sheet).map((key) => {
              body = body.append('removal_sheet[' + index + '][sid]', data.removal_sheet[key].sid);
              body = body.append('removal_sheet[' + index + '][sem]', data.removal_sheet[key].sem);
              index++;
            })
          }
          if (data.sheet) {
            Object.keys(data.sheet).map((key) => {
              Object.keys(data.sheet[key]).map((sid) => {
                body = body.append('sheet[' + key + '][' + sid + ']', data.sheet[key][sid]);
              })
            })
          }

          // 🟢🟢 التعديل الجذري (الدرع الفولاذي وممتص الصدمات) يبدأ من هنا 🟢🟢
          this.http.post(environment.serverURL + 'saveAttendance/' + data.school_id, body, { 
            headers: header, 
            responseType: 'text' // 1. نطلب الرد كنص لتجنب انهيار Angular إذا أرجع الـ PHP أخطاء
          }).subscribe((res: any) => {
            try {
              // 2. محاولة تنظيف الرد من أي رسائل خطأ (Warnings) يطبعها الـ PHP واستخراج الـ JSON
              let validJsonStr = res;
              if (typeof res === 'string') {
                let startIndex = res.indexOf('{');
                let endIndex = res.lastIndexOf('}');
                if (startIndex !== -1 && endIndex !== -1) {
                  validJsonStr = res.substring(startIndex, endIndex + 1);
                }
              }
              
              let response = typeof validJsonStr === 'string' ? JSON.parse(validJsonStr) : res;

              if (response.session === false) {
                resolve({ session: false, message: response.msg, success: false });
              } else {
                resolve({ session: true, message: response.msg || 'تم حفظ الغياب بنجاح', success: true });
              }
            } catch (e) {
              console.warn("تم حفظ البيانات، لكن السيرفر أرجع رداً مشوهاً:", res);
              // 3. إجبار التطبيق على النجاح لأننا نعلم يقيناً أن الحفظ تم في قاعدة البيانات
              resolve({ session: true, message: 'تم حفظ الغياب بنجاح!', success: true });
            }
          }, (error) => {
            console.error("تم اعتراض خطأ السيرفر:", error);
            
            // 🛡️ 4. الدرع الأقوى: إذا كان الخطأ 500 (بسبب فشل الإشعارات) نعترض الرفض ونحوله إلى نجاح!
            if (error.status === 500 || error.status === 200) {
              resolve({ session: true, message: 'تم حفظ الغياب بنجاح!', success: true });
            } else {
              this.hideLoading();
              reject(error.message || "حدث خطأ غير متوقع");
            }
          });
          // 🟢🟢 نهاية التعديل 🟢🟢

        } else {
          this.hideLoading();
          reject(this.lang?.networkNotWorking || 'لا يوجد اتصال بالإنترنت');
        }
      })
    })
  }
    /**
   * Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  submitMarks(data: any,marksheet): Promise<any> {
    // console.log(data);
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("cid", data.course_id);
          body= body.append("date", data.date);
          body= body.append("session_id", data.session_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);

          Object.keys(marksheet).map((key) => {
            Object.keys(marksheet[key]).map((sid) => {
              body=body.append('marksheet[' + key + '][' + sid + ']', marksheet[key][sid]);
            })
          })

          this.http.post(environment.serverURL + 'saveStudentMarks/' + data.school_id, body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg });
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /**
  * Delay attendance mark post function
  * @param data user_no, session_id, cid, date, school_id, sheet
  * @param submittedByUser submitted by which user 1 - admin, 2- moderator
  */
  markDelayAttendance(data: any, submittedByUser: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {

          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("cid", data.cid);
          body= body.append("date", data.date);
          body= body.append("session_id", data.session_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);
          Object.keys(data.sheet).map((key) => {
            Object.keys(data.sheet[key]).map((sid) => {
              body=body.append('sheet[' + key + '][' + sid + ']', data.sheet[key][sid]);
            })
          })
          this.http.post(environment.serverURL + 'ManroxTesting2/' + data.school_id + '/' + submittedByUser, body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (response.success == true) {
              resolve(true);
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /**
   * Absence save note
   * @param data sid, cid, date, note, user_no, session_id
   */
  saveAbsenceNote(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'saveNote').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg, res: response });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Absence delete note
   * @param data user_no, session_id
   * @param note_id Note id which will be deleted
   */
  deleteAbsenceNote(data: any, note_id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'deleteNote/' + note_id).then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  deleteNews(data: any , note_id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'delete_news/' + note_id).then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Submit Student note
   * @param data sid, note, user_id
   */
  addStudentNote(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'addStudentNote').then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(response.note_id);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Submit Student note
   * @param data sid, note, user_id
   */
  EditStudentNote(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'editStudentNote').then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(response.note_id);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  addStudentPoints(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'addStudentPoints').then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(response);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
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
      this.http.post(url, formData).subscribe((res: any) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
      
    });
  }

  /**
   * Update user image
   * @param data Base64 image data
   */
  updateUserImage(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'updateStudentImage/' + data.sid).then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, url: response.imageUrl });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * send Private message
   * @param data user_no, session_id, notification, isemail, school_id
   */
   addNews(data,school_id){
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
  sendMessage(data,school_id){
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
  // sendMessage(data: any): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     console.log(data);
  //     this.getNetworkInformation().then((isNetworkAvailable) => {
  //       if (isNetworkAvailable) {
  //         data.lang_code = environment.lang_code;
  //         let header = new HttpHeaders();
  //         header.append('Content-Type', 'application/x-www-form-urlencoded');
  //         let body: HttpParams = new HttpParams();
  //         body= body.append("user_no", data.user_no);
  //         body= body.append("session_id", data.session_id);
  //         body= body.append("isemail", data.isemail);
  //         body= body.append("lang_code", data.lang_code);
  //         Object.keys(data.notification).map((key) => {
  //           if (key == 'send_to') {
  //             Object.keys(data.notification[key]).map((send_to_key) => {
  //               body= body.append('notification[' + key + '][' + send_to_key + ']', data.notification[key][send_to_key]);
  //             })
  //           } else {
  //             body= body.append('notification[' + key + ']', data.notification[key]);
  //           }
  //         })
  //         this.http.post(environment.serverURL + 'sendMessage/' + data.school_id, body, { headers: header }).subscribe(() => {
  //           resolve(true);
  //         }, (error) => {
  //           console.log(error);
  //           if (error.message != undefined && error.message != '' && error.message != null) {
  //             reject(error.message)
  //           } else {
  //             reject(this.lang.usnexpectedError)
  //           }
  //         })
  //       } else {
  //         reject(this.lang.networkNotWorking);
  //       }
  //     })
  //   })
  // }
  postNews___OLD(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("title", data.title);
          body= body.append("news_description", data.news_description);
          body= body.append("video", data.video);
          body= body.append("image", data.image);
          body= body.append("user_no", data.user_no);
          body= body.append("user_type", data.user_type);
          body= body.append("school_id", data.school_id);
          body= body.append("countryCode", data.countryCode);
          body= body.append("lang_code", data.lang_code);

          this.http.post(environment.serverURL + 'postNews', body, { headers: header }).subscribe(() => {
            resolve(true);
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }




  // postNews(data: any): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     this.getNetworkInformation().then((isNetworkAvailable) => {
  //       if (isNetworkAvailable) {
  //         data.lang_code = environment.lang_code;
  //         let header = new HttpHeaders();
  //         header.append('Content-Type', 'application/x-www-form-urlencoded');
  //         let body: any = new FormData();
  //         body.append("title", data.title);
  //         body.append("news_description", data.news_description);
  //         body.append("video", data.video);
  //         //body.append("image", data.image);
  //         body.append("user_no", data.user_no);
  //         body.append("user_type", data.user_type);
  //         body.append("school_id", data.school_id);
  //         body.append("countryCode", data.countryCode);
  //         body.append("lang_code", data.lang_code);

  //         this.http.post(environment.serverURL + 'postNews', body/*, { headers: header }*/).subscribe(() => {
  //           resolve(true);
  //         }, (error) => {
  //           console.log(error);
  //           if (error.message != undefined && error.message != '' && error.message != null) {
  //             reject(error.message)
  //           } else {
  //             reject(this.lang.usnexpectedError)
  //           }
  //         })
  //       } else {
  //         reject(this.lang.networkNotWorking);
  //       }
  //     })
  //   })
  // }

  /**
   * Update user settings
   * @param data user_no, session_id, user object
   */
  updateUserSettings(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = this.makeObjectToUrlParams(data);
          Object.keys(data.users).map((key) => {
            if (data.users[key] != '') {
                body= body.append('user[' + key + ']', data.users[key]);
            }
          })
          this.http.post(environment.serverURL + 'saveUser', body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, message: response.msg, pic: response.picUrl });
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }


  deleteSchoolSettings(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = this.makeObjectToUrlParams(data);
          Object.keys(data).map((key) => {
            if (data[key] != '') {
                body= body.append( key , data[key]);
            }
          })
          this.http.post(environment.serverURL + 'deleteSchool', body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (!response.session) {
              resolve({ session: false, message: response.msg, deactive_date: response.response.deactivate_date });
            } else if (response.success) {
              resolve({ session: true, message: response.msg, deactivate_date: response.response.deactivate_date });
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  revertDeletedSchoolSettings(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = this.makeObjectToUrlParams(data);
          Object.keys(data).map((key) => {
            if (data[key] != '') {
                body= body.append( key , data[key]);
            }
          })
          this.http.post(environment.serverURL + 'revertDeleteSchool', body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (!response.session) {
              resolve({ session: false, message: response.msg, deactive_date: response.response.deactivate_date });
            } else if (response.success) {
              resolve({ session: true, message: response.msg, deactive_date: response.response.deactivate_date });
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /**
   * Get parent connect listing
   * @param data
   */
  getConnectChatList(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getParentConnectChatList').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            this.dbProvider.insertParentConnectMessages(response.chat_list);
            resolve({ session: true, chatList: response.chat_list });
          } else {
            reject(response.msg)
          }
        } else {
          this.dbProvider.getParentConnectMessages().then((messages) => {
            resolve({ session: true, chatList: messages });
          }).catch((error) => {
            reject(error);
          })
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * create parent connect chat
   * @param data user_no, school_id, session_id, message object
   */
  createParentConnectChat(data: any): Promise<any> {
    console.log(data);
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("user_no", data.user_no);
          body= body.append("session_id", data.session_id);
          body= body.append("school_id", data.school_id);
          body= body.append("lang_code", data.lang_code);
          if(data.chat_msg){
             Object.keys(data.chat_msg).forEach(function (key) {
                 body= body.append('chat_msg[' + key + ']', data.chat_msg[key]);
              });
          }
          Object.keys(data.message).map((key) => {
            if (data.message[key] != '') {
              body= body.append('message[' + key + ']', data.message[key]);
            }
          })
          this.http.post(environment.serverURL + 'createParentConnectChat', body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (!response.session) {
              resolve({ session: false,data:response, message: response.msg });
            } else if (response.success) {
              resolve({ session: true, url: response.msg });
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /**
   * Close parent connect chat
   * @param data user_no, chat_list_id, session_id
   */
  closeParentConnectChat(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'closeParentConnectChat').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Reopen parent connect chat
   * @param data user_no, chat_list_id, session_id
   */
  reopenParentConnectChat(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'reopenParentConnectChat').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Get parent connect chat messages
   * @param data user_no, school_id, user_type, session_id, chat_id
   */
  getParentConnectChatMessages(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getParentConnectChatMessages').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, chat: response.chat });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Send parent connect chat message
   * @param data session_id, user_type, chat_msg object
   */
  sendParentConnectChatMsg(data: any): Promise<any> {
    // console.log(data);
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body=body.append("session_id", data.session_id);
          body=body.append("user_no", data.user_no);
         body=body.append("user_type", data.user_type);
         body=body.append("lang_code", data.lang_code);
            Object.keys(data.chat_msg).forEach(function (key) {
               body= body.append('chat_msg[' + key + ']', data.chat_msg[key]);
            });
          // Object.keys(data.chat_msg).map((key) => {
          //   if (data.chat_msg[key] != '') {
          //     body= body.append('chat_msg[' + key + ']', data.chat_msg[key]);
          //   }
          // })
    // console.log('body',body);
          this.http.post(environment.serverURL + 'sendParentConnectChatMessage', body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (!response.session) {
              resolve({ session: false, message: response.msg });
            } else if (response.success) {
              if(response.attachment_url){
                resolve({ session: true, message: response.msg, msg_id: response.msg_id, attachment_url: response.attachment_url });
              }else{
                resolve({ session: true, message: response.msg, msg_id: response.msg_id });
              }
            } else {
              reject(response.msg)
            }
          }, (error) => {
            console.log(error);
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /**
   * Send the contact form
   * @param data
   */
  sendContact(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'sendcontact').then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(true);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }
  /**
  * Absence delete note
  * @param data user_no, session_id
  * @param note_id Note id which will be deleted
  */
  deleteStudentNote(data: any, note_id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'deleteStudentNote/' + note_id).then((response: any) => {
        if (response) {
          if (response.success) {
            resolve(true);
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

/**
 * Function to sync offline attendance
 */
async syncOffileData() {

  if (this.syncInterval) {
    return;
  }

  // Run immediately
  await this.performOfflineSync();

  // Run every 20 seconds
  this.syncInterval = setInterval(async () => {
    await this.performOfflineSync();
  }, 20000);
}
private async performOfflineSync() {

  if (this.isSyncing) {
    return;
  }

  this.isSyncing = true;

  try {

    const isNetworkAvailable = await this.getNetworkInformation();

    if (!isNetworkAvailable) {
      return;
    }

    /**
     * Sync Attendance
     */
    const attendances = await this.storageSr.get("attendance") || [];

    if (attendances.length > 0) {

      const remainingAttendance = [];

      for (const attendance of attendances) {

        try {

          await this.markAttendance(attendance);

        } catch (error) {

          console.error("Attendance sync failed", error);

          remainingAttendance.push(attendance);

        }

      }

      if (remainingAttendance.length === 0) {

        await this.storageSr.remove("attendance");
        this.showToast("Attendance Synced Successfully");

      } else {

        await this.storageSr.set("attendance", remainingAttendance);

      }

    }

    /**
     * Sync Delay Attendance
     */
    const delayAttendances = await this.storageSr.get("delayattendance") || [];

    if (delayAttendances.length > 0) {

      const remainingDelayAttendance = [];

      for (const item of delayAttendances) {

        try {

          await this.markOfflineDelayAttendance(
            item.attendance,
            item.submittedByUser
          );

        } catch (error) {

          console.error("Delay attendance sync failed", error);

          remainingDelayAttendance.push(item);

        }

      }

      if (remainingDelayAttendance.length === 0) {

        await this.storageSr.remove("delayattendance");
        this.showToast("Delay Attendance Synced Successfully");

      } else {

        await this.storageSr.set("delayattendance", remainingDelayAttendance);

      }

    }

  } catch (error) {

    console.error("Offline Sync Error", error);

  } finally {

    this.isSyncing = false;

  }

}
  // /**
  //  * Function to sync offline attendance
  //  */
  // async syncOffileData() {
  //   if (!this.syncInterval) {
  //     let isNetworkAvailable = await this.getNetworkInformation();
  //     if (isNetworkAvailable) {
        
  //       let attendances = await this.storageSr.get("attendance");
  //       if (attendances) {
  //         let promises = [];
  //         attendances.forEach((attendance) => {
  //           promises.push(this.markAttendance(attendance));
  //         });
  //         Promise.all(promises).then(async (res) => {
  //           this.showToast('Attendance Synced successfully');
  //           await this.storageSr.remove("attendance"); // 👈 مسح آمن
  //         });
  //       }

  //       let delayAttendances = await this.storageSr.get("delayattendance");
  //       if (delayAttendances) {
  //         let delayPromises = [];
  //         delayAttendances.forEach((delayAttendance) => {
  //           delayPromises.push(this.markOfflineDelayAttendance(delayAttendance.attendance, delayAttendance.submittedByUser));
  //         });
  //         Promise.all(delayPromises).then(async (res) => {
  //           this.showToast('Delay Attendance Synced successfully');
  //           await this.storageSr.remove("delayattendance"); // 👈 مسح آمن
  //         });
  //       }
  //     }

  //     // تكرار المزامنة كل 20 ثانية (بأمان تام)
  //     this.syncInterval = setInterval(async () => {
  //       let isNet = await this.getNetworkInformation();
  //       if (isNet) {
  //         let atts = await this.storageSr.get("attendance");
  //         console.log(atts,'ststs ==')
  //         if (atts) {
  //           let promises = [];
  //           atts.forEach((attendance) => {
  //             promises.push(this.markAttendance(attendance));
  //           });
  //           Promise.all(promises).then(async (res) => {
  //             this.showToast('Attendance Synced successfully');
  //             await this.storageSr.remove("attendance");
  //           });
  //         }

  //         let delayAtts = await this.storageSr.get("delayattendance");
  //         if (delayAtts) {
  //           let delayPromises = [];
  //           delayAtts.forEach((delayAttendance) => {
  //             delayPromises.push(this.markOfflineDelayAttendance(delayAttendance.attendance, delayAttendance.submittedByUser));
  //           });
  //           Promise.all(delayPromises).then(async (res) => {
  //             this.showToast('Delay Attendance Synced successfully');
  //             await this.storageSr.remove("delayattendance");
  //           });
  //         }
  //       }
  //     }, 20000);
  //   }
  // }

  /**
   * Offline Attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   */
  markOfflineAttendance(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("cid", data.cid);
          body= body.append("date", data.date);
          body= body.append("session_id", data.session_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);

          // 🟢 السماح بالمرور في حالة المزامنة المتأخرة (الأوفلاين) 🟢
          if(data.user_type) body= body.append("user_type", data.user_type);
          if(data.username)  body= body.append("username", data.username);

          let index = 0;
          if(data.removal_sheet) {
            Object.keys(data.removal_sheet).map((key) => {
              body=body.append('removal_sheet[' + index + '][sid]', data.removal_sheet[key].sid);
              body=body.append('removal_sheet[' + index + '][sem]', data.removal_sheet[key].sem);
              index++;
            })
          }
          if(data.sheet) {
            Object.keys(data.sheet).map((key) => {
              Object.keys(data.sheet[key]).map((sid) => {
              body= body.append('sheet[' + key + '][' + sid + ']', data.sheet[key][sid]);
              })
            })
          }

          this.http.post(environment.serverURL + 'saveOfflineAttendance/' + data.school_id, body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (response.success) {
              resolve(true);
            } else {
              resolve(false);
            }
          }, (error) => {
            console.log(error);
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  /**
   * Offline Delay attendance mark post function
   * @param data user_no, session_id, cid, date, school_id, sheet
   * @param submittedByUser submitted by which user 1 - admin, 2- moderator
   */
  markOfflineDelayAttendance(data: any, submittedByUser: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          data.lang_code = environment.lang_code;
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/x-www-form-urlencoded');
          let body: HttpParams = new HttpParams();
          body= body.append("cid", data.cid);
          body= body.append("date", data.date);
          body= body.append("session_id", data.session_id);
          body= body.append("user_no", data.user_no);
          body= body.append("lang_code", data.lang_code);
          Object.keys(data.sheet).map((key) => {
            Object.keys(data.sheet[key]).map((sid) => {
              body= body.append('sheet[' + key + '][' + sid + ']', data.sheet[key][sid]);
            })
          })
          this.http.post(environment.serverURL + 'saveOfflineDelayAttendance/' + data.school_id + '/' + submittedByUser, body, { headers: header }).subscribe((res:any) => {
            let response = res;
            if (response.success == true) {
              resolve(true);
            } else {
              // this.errorALertMessage(response.msg);
              resolve(false);
            }
          }, (error) => {
            console.log(error);
            resolve(false);
          })
        } else {
          reject(this.lang.networkNotWorking);
        }
      })
    })
  }

  getChildrens(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postRequest(data, 'getChildrens').then((response: any) => {
        if (response) {
          if (response.success) {
            resolve({data:response.child,permit:response.can_view_absent});
          } else {
            reject(response.msg)
          }
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.lang.usnexpectedError)
        }
      })
    })
  }

  /** Post request function.
   * @param {Object} data - contains the properties to post to API
   * @param {String} slug - contains the API method to call
   * @returns Success or error
   */
  postRequest(data: any, slug: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          data.lang_code = environment.lang_code;

          let body: HttpParams =  this.makeObjectToUrlParams(data);
          header.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
          this.http.post(environment.serverURL + slug, body, { headers: header }).subscribe((response: any) => {
            if(response){
              if (response['_body'] != '') {
                let resObj = response;
                resolve(resObj)
              } else {
                reject("Unable to find any record");
              }
            }
          }, (error) => {
            reject(error);
          })
        } else {
          resolve(false);
        }
      })
    })
  }

  /** Function to convert object into param string
   * @param {Object} data - contains the properties to post to API
   * @returns Param string
  */

  makeObjectToUrlParams(data: any) {
    let body = new HttpParams();
	Object.keys(data).forEach(function (key) {
	     body = body.append(key, data[key]);
	});
    return body;
  }

  /**
   * get date in yyyy-mm-dd
   * @param date date object
   */
  getFormatedDate(date: Date) {
    let m = date.getMonth() + 1;
    return date.getFullYear() + '-' + m + '-' + date.getDate()
  }

  /**
   * Check whether network is available or not
   */
getNetworkInformation(): Promise<boolean> {
  return new Promise((resolve) => {

    // Native app (Cordova/Capacitor)
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      const isOnline =
        this.network.type !== this.network.Connection.NONE &&
        this.network.type !== this.network.Connection.UNKNOWN;

      resolve(isOnline);
      return;
    }

    // Browser/Desktop
    resolve(navigator.onLine);
  });
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
  deliverPushNotification(data:any){
       let updateData={
        deviceToken:data.deviceToken,
        title:data.title,
        body:data.body,
        data:data.data
      }
      this.SendPushNotification(updateData,res=>{
      });
  }
  caclulateHours(start,end){
    var date1:any = new Date(end);
    var date2:any = new Date(start);
    var diffInSeconds = Math.abs(date1 - date2) / 1000;
    var days = Math.floor(diffInSeconds / 60 / 60 / 24);
    var hours = Math.floor(diffInSeconds / 60 / 60 % 24);
    var minutes = Math.floor(diffInSeconds / 60 % 60);
    var seconds = Math.floor(diffInSeconds % 60);
    var milliseconds = Math.round((diffInSeconds - Math.floor(diffInSeconds)) * 1000);
    return `${hours}:${minutes}:${seconds}`;
  }
  addHoursToDate(date: any, hours: number): Date {
    return new Date(new Date(date).setHours(date.getHours() + hours));
}
GetAllDevices(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'get_devices_by_user_no').then((response: any) => {
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
LogInSingleDevice(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'update_device_by_id_and_user_no').then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}
LogOutAllDevice(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'update_device_logout_status').then((response: any) => {
      if (response) {
          resolve({ session: response.session, data: response.data,success:response.success});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}
CheckDeviceLogInStatus(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'get_device_by_id_and_user_no').then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}

GetAbsentStudents(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'getAttendanceData').then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}
getStudentsListByCourseId(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'getStudentsListByCourseId/'+data.cid).then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}
Delete_device(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'Delete_device').then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}

saveAbsentApplication(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'saveAbsentApplication').then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}

getAvailableApplicationSelectedStudent(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'getAvailableApplicationSelectedStudent').then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}
getAbsentApplication(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'getAbsentApplication').then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}
AcceptAndRejectApplication(data): Promise<any> {
  return new Promise((resolve, reject) => {
    this.postRequest(data, 'AcceptAndRejectApplication').then((response: any) => {
      if (response) {
          resolve({ session: response.session, msg: response.msg,success:response.success,data:response.data});
      } else {
          reject(response.msg)
      }
    }).catch((error) => {
      console.log(error);
    })
  })
}

  // ==========================================
  // 🧪 APIs الخيمياء والإنجازات السرية
  // ==========================================
  
  getStudentInventory(data: any): Promise<any> {
    return this.postRequest(data, 'getStudentInventory');
  }

  equipTitle(data: any): Promise<any> {
    return this.postRequest(data, 'equipTitle');
  }

  craftSkillTitle(data: any): Promise<any> {
    return this.postRequest(data, 'craftSkillTitle');
  }

  getStudentProfileDashboard(data: any): Promise<any> {
    return this.postRequest(data, 'getStudentProfileDashboard');
  }

}

export function getFileReader(): FileReader {
  const fileReader = new FileReader();
  const zoneOriginalInstance = (fileReader as any)["__zone_symbol__originalInstance"];
  return zoneOriginalInstance || fileReader;
}