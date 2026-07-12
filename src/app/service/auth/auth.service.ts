import { Injectable, EventEmitter } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Network } from "@awesome-cordova-plugins/network/ngx";
import {
  Platform,
  AlertController,
  PopoverController
} from "@ionic/angular";
import { DatabaseService } from "../database/database.service";
import { LoaderComponent } from "../../components/loader/loader.component";
import { Router } from "@angular/router";
import { Device } from "@awesome-cordova-plugins/device/ngx";
import { StorageService } from "../storage.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  public event: EventEmitter<any>;
  public eventChangeUser: EventEmitter<any>;
  popOver: any;

  constructor(
    public http: HttpClient,
    public network: Network,
    public device: Device,
    public platform: Platform,
    public dbProvider: DatabaseService,
    public popoverController: PopoverController,
    private router: Router,
    private alertController: AlertController,
    private storageSr: StorageService 
  ) {
    this.event = new EventEmitter();
    this.eventChangeUser = new EventEmitter();
  }

  changeUser(peram) {
    let em = { changeUser: peram };
    this.event.emit(em);
  }

  publishEvent(peram) {
    let em = { loggedin: peram };
    this.event.emit(em);
  }

  piblisEvenetActiveLink(param) {
    let em = { activeLink: param };
    this.event.emit(em);
  }

  deleteNote(param) {
    let em = { deleteNote: param };
    this.event.emit(em);
  }

  doLogin(user): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          user["lang_code"] = environment.lang_code;
          let body: HttpParams = this.makeObjectToUrlParams(user);
          header.append("Content-Type", "application/json");
          
          this.http.post(environment.serverURL + "login", body, { headers: header }).subscribe(
            async (response: any) => { 
              let resObj = response;
              
              if (resObj && resObj.status === 100) {
                await this.flushLocalStorage(); 
                this.router.navigate(["login"], { replaceUrl: true });
                this.presentAlert(resObj.message || "عفواً، حسابك غير مفعل.");
                reject("الحساب غير مفعل.");
                return; 
              }

              if (resObj.success) {
                // 🟢 السحر هنا: نحفظ بالخدمة الجديدة + المخزن القديم لإرضاء الـ AuthGuard
                await this.storageSr.set("userloggedin", resObj); 
                localStorage.setItem("userloggedin", JSON.stringify(resObj)); 
                resolve(resObj);
              } else {
                reject(resObj.msg || "فشل تسجيل الدخول");
              }
            },
            (error) => {
              if (error && error.message) {
                reject(error.message);
              } else {
                reject("حدث خطأ غير متوقع يرجى معاودة المحاولة في وقت لاحق.");
              }
            }
          );
        } else {
          reject("الرجاء التأكد من اتصالك بالإنترنت");
        }
      });
    });
  }

  removeUrlFromString(inputString) {
    if (!inputString) return "";
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return inputString.replace(urlRegex, '');
  }

  async presentAlert(message) {
    const alert = await this.alertController.create({
      header: "تنبيه",
      message: this.removeUrlFromString(message),
      buttons: ["موافق"],
      mode: "ios" 
    });
    await alert.present();
  }

  logout(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let userDetail = await this.storageSr.get("userloggedin"); 
      
      if (userDetail && userDetail.details) {
        let data = {
          user_no: userDetail.details.user_no,
          session_id: userDetail.session_id,
        };
        
        await this.showLoading();
        this.doLogout(data).then((resp) => {
            this.hideLoading();
            this.router.navigate(["login"], { replaceUrl: true });
            resolve(true);
          }).catch((error) => {
            this.hideLoading();
            resolve(false); 
          });
      } else {
        this.router.navigate(["login"], { replaceUrl: true });
        resolve(true);
      }
    });
  }

  async presentPopover(ev?: any) {
    if (this.popOver) {
      this.closePopup();
    }
    this.popOver = await this.popoverController.create({
      component: LoaderComponent,
      backdropDismiss: false, 
      translucent: false,
      cssClass: "loaderStyle",
    });
    await this.popOver.present();
  }

  async showLoading() {
    await this.presentPopover();
  }

  hideLoading() {
    setTimeout(() => {
      this.closePopup(); 
    }, 300);
  }

  closePopup() {
    if (this.popOver) {
      this.popOver.dismiss().catch(() => {});
      this.popOver = null; 
    }
  }

  registerSchool(school: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let headers = new HttpHeaders();
          let body: HttpParams = this.makeObjectToUrlParams(school);
          headers.append("Content-Type", "application/json");
          
          this.http.post(environment.serverURL + "schoolRegister", body, { headers }).subscribe(
            (response: any) => {
              let resObj = response;
              if (resObj.success == true) {
                resolve(resObj.msg);
              } else {
                reject(resObj.msg);
              }
            },
            (error) => {
              if (error && error.message) {
                reject(error.message);
              } else {
                reject("حدث خطأ غير متوقع يرجى معاودة المحاولة في وقت لاحق.");
              }
            }
          );
        } else {
          reject("الرجاء التأكد من اتصالك بالإنترنت");
        }
      });
    });
  }

  doLogout(data: any, option?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          let body: HttpParams = this.makeObjectToUrlParams(data);
          header.append("Content-Type", "application/json");
          
          this.http.post(environment.serverURL + "logout", body, { headers: header }).subscribe(
            async (response: any) => { 
              if (response && response.success) {
                await this.flushLocalStorage();
                
                let em = { loggedin: false };
                this.event.emit(em);
                this.publishEvent(false);

                if (!option) {
                  let oldUser = await this.storageSr.get("earlyLogin");
                  if (oldUser) {
                    if (oldUser.length > 1) {
                      reject(false);
                      this.logInOtherAccount(data);
                    } else {
                      await this.storageSr.remove("earlyLogin");
                      resolve(true);
                    }
                  } else {
                    await this.storageSr.remove("earlyLogin");
                    resolve(true);
                  }
                } else {
                  resolve(true);
                }
              } else {
                await this.flushLocalStorage();
                resolve(true); 
              }
            },
            async (error) => {
              await this.flushLocalStorage();
              resolve(true);
            }
          );
        } else {
           reject("الرجاء التأكد من اتصالك بالإنترنت");
        }
      });
    });
  }

  // 🟢 دالة التبديل التلقائي بعد تسجيل الخروج
  async logInOtherAccount(data) { 
    let loggedinUser = await this.storageSr.get("earlyLogin"); 

    if (loggedinUser) {
      // 1. إزالة الحساب الذي سجل خروجه
      loggedinUser = loggedinUser.filter(u => u.user_no != data.user_no);
      await this.storageSr.set("earlyLogin", loggedinUser); 

      // 2. إذا تبقى حسابات، سجل دخول صامت للحساب التالي
      if (loggedinUser && loggedinUser.length > 0) {
        await this.logInOldUser(loggedinUser[0]);
      } else {
        // إذا لم يتبقَ حسابات، اذهب لصفحة الدخول
        this.publishEvent(false);
        this.router.navigate(["login"], { replaceUrl: true });
      }
    } else {
      this.router.navigate(["login"], { replaceUrl: true });
    }
  }

  // 🟢 دالة الدخول الصامتة المحسنة (تمت إزالة السطر المسبب لـ 404)
  async logInOldUser(users) { 
    let data = users;
    
    // تأمين الهوية للمتصفح والأجهزة
    let currentDeviceId = '';
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      currentDeviceId = this.device.uuid;
      data.os_type = (this.device.platform == "android" || this.device.platform == "Android") ? 1 : 2;
    } else {
      currentDeviceId = await this.storageSr.get("browser_uuid");
      data.os_type = 2;
    }

    data.device_id = currentDeviceId;
    data.uuid = currentDeviceId;
    data.registration_id = await this.storageSr.get("FcmToken"); 

    return this.doLogin(data).then(async (response) => {
        // إبلاغ التطبيق بالنجاح (التطبيق سيتولى تسجيل الجهاز برابطه الصحيح)
        this.publishEvent({ loggedin: true, details: response.details });
        this.changeUser(true);
        return response;
      }).catch((error) => {
        this.router.navigate(["login"], { replaceUrl: true });
      });
  }

  makeObjectToUrlParams(data) {
    let body = new HttpParams();
    Object.keys(data).forEach(function (key) {
      body = body.append(key, data[key]);
    });
    return body;
  }

  async flushLocalStorage() { 
    await this.storageSr.remove("userloggedin");
    await this.storageSr.remove("availablePlan"); 
    await this.storageSr.remove("attendance");
    await this.storageSr.remove("classlocalatt"); 
    await this.storageSr.remove("delayclasslocalatt"); 
    await this.storageSr.remove("delayattendance"); 
    await this.storageSr.remove("currentReportStudent");
    await this.storageSr.remove("currentShareBulletin");
    await this.storageSr.remove("submitAppData");
    
    try {
      await this.dbProvider.deleteDataBase();
    } catch(e) {
      console.log("Error clearing DB", e);
    }
  }

  getNetworkInformation(): Promise<any> {
    return new Promise((resolve) => {
      if (this.platform.is("cordova") || this.platform.is("capacitor")) {
        if (
          this.network.type == this.network.Connection.UNKNOWN ||
          this.network.type == this.network.Connection.NONE
        ) {
          resolve(false);
        } else {
          resolve(true);
        }
      } else {
        resolve(true); 
      }
    });
  }
}