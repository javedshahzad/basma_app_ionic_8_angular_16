import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { Platform, LoadingController, ModalController, NavController, PopoverController } from '@ionic/angular';
//import { HttpParams, Http, Headers } from '@angular/common/http';
import { Network } from '@capacitor/network';
import { DatabaseService } from '../database/database.service';
//import { TranslateService } from '@ngx-translate/core';
// import { PhotoLibrary } from '@awesome-cordova-plugins/photo-library/ngx';
import { TranslateService } from '@ngx-translate/core';
//import { EditCalssPage } from '../../common-modal/edit-calss/edit-calss.page';
// import { ViewClassNotesPage } from '../../common-modal/view-class-notes/view-class-notes.page';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { BehaviorSubject } from 'rxjs';

import { StorageService } from '../storage.service';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { OverlayService } from '../overlay/overlay.service';
import { ApiClient } from '../api-client/api-client.service';
import { ApiResponse } from '../../model/api-response.model';
import { UserDetails } from '../../model/logged-in-user.model';

// Selection payload broadcast by select-message-user.page.ts (recipients
// picker) — user_no can be a string or number depending on the source list,
// the display names are always strings.
export interface SelectedUsersPayload {
  selectedUsers: (string | number)[];
  selectedUsersShow: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // نواقل بث عامة على مستوى التطبيق — Subject بدل EventEmitter لأنها ليست
  // ربط @Output لمكوّن، بل قنوات بث يشترك بها عدة مستهلكين مستقلين
  // events carries either an upload-progress percentage (getStatusMessage)
  // or a user record (triggerUserSwitch, currently unused by any caller).
  public events: Subject<number | UserDetails | 'add'>;
  public language: Subject<string>;
  public selectedUsers: Subject<SelectedUsersPayload>;

  // قناة اتصال مخصصة لنقل الخبر المعدل أو الجديد
  public newsUpdated = new Subject<Record<string, unknown>>();

  // Declared but never assigned/read anywhere in the app today — kept as an
  // honest unknown rather than inventing a shape for a dead field.
  loader: unknown;
  lang: Record<string, string> = {};
  mediaDirectory: string = '';
  popOver: HTMLIonPopoverElement | null = null;
  img = '';
  unread = false;
  private_message = false;
  deactivate_date: string = '';
  public uploadProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  /**
   * Represents a Data provider from API.
   * @constructor
   * @param {Http} http - for making http request.
   * @param {LoadingController} loadingCtrl - Loading popup.
   */
  constructor(
    public http: HttpClient,
    public platform: Platform,
    public loadingCtrl: LoadingController,
    public translate: TranslateService,
    public modalController: ModalController,
    public popoverController: PopoverController,
    public dbProvider: DatabaseService,
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
    Network.addListener('networkStatusChange', status => {
      if (status.connected) {
        this.showToast('Internet connected');
      } else {
        this.showToast('No Internet connection...');
      }
    });
  }

  // دالة مساعدة لاستقبال طلب التبديل من واجهة Lineone الجديدة
  // No current callers anywhere in the app; param typed to match the
  // 'userloggedin' storage contract (see UserDetails) this method writes to.
  async triggerUserSwitch(user: 'add' | UserDetails) {
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
  // No current callers anywhere in the app; callback typed loosely since
  // RateAppComponent's dismiss payload isn't constrained by any real caller.
  async presentRatingPopover(lang, note, callback: (result: unknown) => void) {
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
  /**
   * This is a user defined loader
   * @param ev - event
   */
  async presentPopover(ev: unknown) {
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
  /** Post request function.
   * @param {Object} data - contains the properties to post to API
   * @param {String} slug - contains the API method to call
   * @returns Success or error
   */
  postRequest<T = ApiResponse>(data: Record<string, unknown>, slug: string): Promise<T | false> {
    return this.apiClient.postRequest<T>(data, slug);
  }

  /** Function to convert object into param string
   * @param {Object} data - contains the properties to post to API
   * @returns Param string
   */

  makeObjectToUrlParams(data: Record<string, unknown>) {
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
  downloadImage(url: string): Promise<boolean> {
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
  caclulateHours(start, end) {
    var date1: Date = new Date(end);
    var date2: Date = new Date(start);
    var diffInSeconds = Math.abs(date1.getTime() - date2.getTime()) / 1000;
    var days = Math.floor(diffInSeconds / 60 / 60 / 24);
    var hours = Math.floor((diffInSeconds / 60 / 60) % 24);
    var minutes = Math.floor((diffInSeconds / 60) % 60);
    var seconds = Math.floor(diffInSeconds % 60);
    var milliseconds = Math.round((diffInSeconds - Math.floor(diffInSeconds)) * 1000);
    return `${hours}:${minutes}:${seconds}`;
  }
  addHoursToDate(date: Date, hours: number): Date {
    return new Date(new Date(date).setHours(date.getHours() + hours));
  }
}

export function getFileReader(): FileReader {
  const fileReader = new FileReader();
  const zoneOriginalInstance = (fileReader as unknown as { __zone_symbol__originalInstance?: FileReader })['__zone_symbol__originalInstance'];
  return zoneOriginalInstance || fileReader;
}
