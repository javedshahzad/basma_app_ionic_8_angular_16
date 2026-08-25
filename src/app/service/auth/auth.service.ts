import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { firstValueFrom, Subject } from "rxjs";
import { Network } from "@capacitor/network";
import { Platform } from "@ionic/angular";
import { DatabaseService } from "../database/database.service";
import { Router } from "@angular/router";
import { Device } from "@capacitor/device";
import { StorageService } from "../storage.service";
import { OverlayService } from "../overlay/overlay.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  // ناقل أحداث المصادقة الموحّد للتطبيق (تسجيل دخول/خروج/تبديل مستخدم) —
  // Subject بدل EventEmitter لأن هذا بث عام وليس ربط @Output لمكوّن
  public event: Subject<any>;
  popOver: any;

  // 🔒 نسخة في الذاكرة فقط (لا تُخزَّن على القرص) لتمكين MyInterceptor من
  // قراءة بيانات الجلسة بشكل متزامن دون اللجوء لتخزينها كنص صريح في localStorage
  public currentUser: any = null;
  public currentUuid: string | null = null;

  constructor(
    public http: HttpClient,
    public platform: Platform,
    public dbProvider: DatabaseService,
    private router: Router,
    private storageSr: StorageService,
    private overlay: OverlayService
  ) {
    this.event = new Subject();
    this.hydrateCurrentUser();
  }

  private async hydrateCurrentUser() {
    this.currentUser = await this.storageSr.get("userloggedin");
    this.currentUuid = await this.storageSr.get("uuid");
  }

  changeUser(peram: boolean) {
    let em = { changeUser: peram };
    this.event.next(em);
  }

  publishEvent(peram: boolean | Record<string, unknown>) {
    let em = { loggedin: peram };
    this.event.next(em);
  }

  piblisEvenetActiveLink(param: unknown) {
    let em = { activeLink: param };
    this.event.next(em);
  }

  deleteNote(param: unknown) {
    let em = { deleteNote: param };
    this.event.next(em);
  }

  async doLogin(user: any): Promise<any> {
    const isNetworkAvailable = await this.getNetworkInformation();
    if (!isNetworkAvailable) {
      throw "الرجاء التأكد من اتصالك بالإنترنت";
    }

    let header = new HttpHeaders();
    user["lang_code"] = environment.lang_code;
    let body: HttpParams = this.makeObjectToUrlParams(user);
    header.append("Content-Type", "application/json");

    let resObj: any;
    try {
      resObj = await firstValueFrom(
        this.http.post(environment.serverURL + "login", body, { headers: header })
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err && err.message) {
        throw err.message;
      }
      throw "حدث خطأ غير متوقع يرجى معاودة المحاولة في وقت لاحق.";
    }

    if (resObj && resObj.status === 100) {
      await this.flushLocalStorage();
      this.router.navigate(["login"], { replaceUrl: true });
      this.presentAlert(resObj.message || "عفواً، حسابك غير مفعل.");
      throw "الحساب غير مفعل.";
    }

    if (resObj.success) {
      // 🔒 نحفظ في المخزن الآمن (StorageService) + نسخة في الذاكرة فقط
      // لـ MyInterceptor، بدلاً من نص صريح في localStorage
      await this.storageSr.set("userloggedin", resObj);
      this.currentUser = resObj;
      return resObj;
    } else {
      throw resObj.msg || "فشل تسجيل الدخول";
    }
  }

  removeUrlFromString(inputString: string) {
    return this.overlay.removeUrlFromString(inputString);
  }

  async presentAlert(message: string) {
    await this.overlay.presentAlert("تنبيه", this.removeUrlFromString(message), ["موافق"], "ios");
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
    this.popOver = await this.overlay.createLoader(false);
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
      this.overlay.dismissLoader(this.popOver);
      this.popOver = null;
    }
  }

  async registerSchool(school: any): Promise<any> {
    const isNetworkAvailable = await this.getNetworkInformation();
    if (!isNetworkAvailable) {
      throw "الرجاء التأكد من اتصالك بالإنترنت";
    }

    let headers = new HttpHeaders();
    let body: HttpParams = this.makeObjectToUrlParams(school);
    headers.append("Content-Type", "application/json");

    let resObj: any;
    try {
      resObj = await firstValueFrom(
        this.http.post(environment.serverURL + "schoolRegister", body, { headers })
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err && err.message) {
        throw err.message;
      }
      throw "حدث خطأ غير متوقع يرجى معاودة المحاولة في وقت لاحق.";
    }

    if (resObj.success == true) {
      return resObj.msg;
    } else {
      throw resObj.msg;
    }
  }

  async doLogout(data: any, option?: any): Promise<any> {
    const isNetworkAvailable = await this.getNetworkInformation();
    if (!isNetworkAvailable) {
      throw "الرجاء التأكد من اتصالك بالإنترنت";
    }

    let header = new HttpHeaders();
    let body: HttpParams = this.makeObjectToUrlParams(data);
    header.append("Content-Type", "application/json");

    let response: any;
    try {
      response = await firstValueFrom(
        this.http.post(environment.serverURL + "logout", body, { headers: header })
      );
    } catch (error) {
      await this.flushLocalStorage();
      return true;
    }

    if (!(response && response.success)) {
      await this.flushLocalStorage();
      return true;
    }

    await this.flushLocalStorage();

    let em = { loggedin: false };
    this.event.next(em);
    this.publishEvent(false);

    if (option) {
      return true;
    }

    let oldUser = await this.storageSr.get("earlyLogin");
    if (oldUser && oldUser.length > 1) {
      this.logInOtherAccount(data);
      throw false;
    }

    await this.storageSr.remove("earlyLogin");
    return true;
  }

  // 🟢 دالة التبديل التلقائي بعد تسجيل الخروج
  async logInOtherAccount(data: { user_no?: string | number }) {
    let loggedinUser = await this.storageSr.get("earlyLogin");

    if (loggedinUser) {
      // 1. إزالة الحساب الذي سجل خروجه
      loggedinUser = loggedinUser.filter((u: { user_no?: string | number }) => u.user_no != data.user_no);
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
  async logInOldUser(users: Record<string, unknown>) {
    let data = users;
    
    // تأمين الهوية للمتصفح والأجهزة
    let currentDeviceId = '';
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      const [deviceId, deviceInfo] = await Promise.all([Device.getId(), Device.getInfo()]);
      currentDeviceId = deviceId.identifier;
      data.os_type = deviceInfo.platform === 'android' ? 1 : 2;
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

  makeObjectToUrlParams(data: Record<string, unknown>) {
    let body = new HttpParams();
    Object.keys(data).forEach(function (key) {
      body = body.append(key, data[key] as string | number | boolean);
    });
    return body;
  }

  async flushLocalStorage() {
    this.currentUser = null;
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

  async getNetworkInformation(): Promise<any> {
    if (this.platform.is("cordova") || this.platform.is("capacitor")) {
      return (await Network.getStatus()).connected;
    }
    return true;
  }
}