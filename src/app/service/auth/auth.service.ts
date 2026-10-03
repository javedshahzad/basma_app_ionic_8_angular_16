import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { firstValueFrom, Subject } from "rxjs";
import { isNetworkConnected } from '../network-status';
import { Platform } from "@ionic/angular";
import { DatabaseService } from "../database/database.service";
import { Router } from "@angular/router";
import { currentOsType, getInstallId, getNativeDeviceId } from "../device-id";
import { StorageService } from "../storage.service";
import { GENERIC_ERROR_MESSAGE, OverlayService } from "../overlay/overlay.service";
import { CredentialStorageService } from "../credential-storage/credential-storage.service";
import { RestoreCredentials } from "../../native/restore-credentials.plugin";

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

  // JWT access token -- memory-only by design, never persisted (short-lived,
  // shrinks what a device-storage compromise exposes). The refresh token is
  // the durable credential; it lives in CredentialStorageService (encrypted
  // on native), never here, and never in the generic `userloggedin` blob.
  public accessToken: string | null = null;
  private refreshInFlight: Promise<string | null> | null = null;

  constructor(
    public http: HttpClient,
    public platform: Platform,
    public dbProvider: DatabaseService,
    private router: Router,
    private storageSr: StorageService,
    private overlay: OverlayService,
    private credentialStorage: CredentialStorageService
  ) {
    this.event = new Subject();
    this.hydrateCurrentUser();
  }

  private async hydrateCurrentUser() {
    this.currentUser = await this.storageSr.get("userloggedin");
    this.currentUuid = await this.storageSr.get("uuid");

    // Access tokens don't survive an app restart (memory-only) -- warm one
    // up from the persisted refresh token now, so the first real request
    // doesn't have to eat a 401-then-refresh round trip.
    if (this.currentUser) {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        // Only a warm-up: if it fails (e.g. the local credential store isn't
        // readable yet), the first request that gets a 401 refreshes anyway.
        // Runs from the constructor with nothing awaiting it, so letting it
        // reject would be an unhandled promise rejection.
        console.warn('Token warm-up failed; will refresh on first 401.', error);
      }
    }
  }

  /**
   * Exchanges the stored refresh token for a fresh access+refresh pair.
   * Concurrent callers (e.g. several requests 401-ing at once) share the
   * same in-flight promise instead of each rotating the refresh token
   * themselves -- rotation means only the first would succeed, the rest
   * would be handed an already-dead token.
   * @returns the new access token, or null if refresh failed (no refresh
   * token stored, or the server rejected it -- caller should treat this as
   * "fully logged out").
   */
  async refreshAccessToken(): Promise<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    this.refreshInFlight = this.doRefreshAccessToken();
    try {
      return await this.refreshInFlight;
    } finally {
      this.refreshInFlight = null;
    }
  }

  private async doRefreshAccessToken(): Promise<string | null> {
    const refreshToken = await this.credentialStorage.get<string>("refreshToken");
    if (!refreshToken) {
      this.accessToken = null;
      return null;
    }

    try {
      const body = this.makeObjectToUrlParams({ refresh_token: refreshToken });
      const res: any = await firstValueFrom(
        this.http.post(environment.serverURL + "refreshToken", body)
      );

      if (!res?.success || !res.access_token) {
        this.accessToken = null;
        return null;
      }

      this.accessToken = res.access_token;
      await this.credentialStorage.set("refreshToken", res.refresh_token);
      return res.access_token;
    } catch {
      // Network failure, not necessarily an invalid token -- don't wipe the
      // stored refresh token here, just fail this attempt. A genuinely
      // invalid/expired/revoked refresh token gets a real {success:false}
      // response above, not a thrown error.
      return null;
    }
  }

  changeUser(peram: boolean) {
    let em = { changeUser: peram };
    this.event.next(em);
  }

  publishEvent(peram: boolean | Record<string, unknown>) {
    let em = { loggedin: peram };
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
      return await this.persistAuthResponse(resObj);
    } else {
      throw resObj.msg || "فشل تسجيل الدخول";
    }
  }

  /**
   * Persists an access+refresh token pair and the rest of a login-shaped
   * response ({success, access_token, refresh_token, details, ...}).
   * Shared by doLogin() and applyRestoredSession() (Part B) -- restoreCredential/
   * authVerify returns the exact same shape /login does, by design, so both
   * are stored the same way.
   */
  private async persistAuthResponse(resObj: any): Promise<any> {
    // Access token: memory-only (MyInterceptor reads it off
    // this.accessToken directly, synchronously, same pattern as
    // currentUser/currentUuid). Refresh token: CredentialStorageService
    // (encrypted-capable), never the plain StorageService blob below --
    // it's a long-lived, password-equivalent credential.
    this.accessToken = resObj.access_token || null;
    if (resObj.refresh_token) {
      await this.credentialStorage.set("refreshToken", resObj.refresh_token);
    }

    // 🔒 نحفظ في المخزن الآمن (StorageService) + نسخة في الذاكرة فقط
    // لـ MyInterceptor، بدلاً من نص صريح في localStorage
    // (tokens themselves excluded -- see above, they have their own homes)
    const { access_token, refresh_token, ...toPersist } = resObj;
    await this.storageSr.set("userloggedin", toPersist);
    this.currentUser = resObj;
    return resObj;
  }

  /**
   * Applies a successful Android Restore Credentials sign-in (Part B3,
   * called from app.component.ts before the normal login screen would
   * otherwise show). Same response shape /login returns, stored the same
   * way, so nothing downstream needs restore-specific handling.
   */
  async applyRestoredSession(resObj: any): Promise<any> {
    return this.persistAuthResponse(resObj);
  }

  removeUrlFromString(inputString: unknown) {
    return this.overlay.removeUrlFromString(inputString);
  }

  async presentAlert(message: unknown) {
    await this.overlay.presentAlert("تنبيه", this.removeUrlFromString(message) || GENERIC_ERROR_MESSAGE, ["موافق"], "ios");
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

    // Every caller of doLogout() historically built { user_no, session_id }
    // by hand -- rather than touching all of them, refresh_token (what the
    // backend actually needs to revoke now) is resolved here internally and
    // merged in. session_id, if present, is now inert -- harmless to keep
    // sending, the backend just ignores it.
    // tryGet: if the local store can't be read, logging out must still go through (it just
    // can't tell the server which token to revoke) instead of aborting before anything is cleared.
    const refreshToken = await this.credentialStorage.tryGet<string>("refreshToken");
    const payload = { ...data, refresh_token: refreshToken };

    // Forget the on-device restore credential alongside the server-side
    // refresh-token revocation (Part B3, hook 3). Fire-and-forget: a
    // missing/unimplemented native plugin (B2 not built yet) or any other
    // failure here must never block a real logout.
    if (this.platform.is("android")) {
      RestoreCredentials.clearRestoreCredential().catch(() => {});
    }

    let header = new HttpHeaders();
    let body: HttpParams = this.makeObjectToUrlParams(payload);
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
      currentDeviceId = (await getNativeDeviceId()) || (await getInstallId(this.storageSr));
      data.os_type = currentOsType();
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
      const value = data[key];
      if (value === null || value === undefined) return;
      body = body.append(key, value as string | number | boolean);
    });
    return body;
  }

  async flushLocalStorage() {
    this.currentUser = null;
    this.accessToken = null;
    await this.credentialStorage.remove("refreshToken");
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
      return (await isNetworkConnected());
    }
    return true;
  }
}