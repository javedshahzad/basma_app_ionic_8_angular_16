import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform, LoadingController, ModalController, NavController, PopoverController } from '@ionic/angular';
import { Network } from '@capacitor/network';
import { DatabaseService } from '../database/database.service';
import { TranslateService } from '@ngx-translate/core';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';

import { StorageService } from '../storage.service';
import { OverlayService } from '../overlay/overlay.service';
import { ApiClient } from '../api-client/api-client.service';
import { ApiResponse } from '../../model/api-response.model';
import { AppStateService } from '../app-state/app-state.service';
import { UtilService } from '../util/util.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  lang: Record<string, string> = {};
  img = '';

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
    private apiClient: ApiClient,
    private appState: AppStateService,
    private util: UtilService
    // public photoLibrary: PhotoLibrary
  ) {
    this.platform.ready().then(() => {
      setTimeout(() => {
        this.translate.get('alertmessages').subscribe(res => {
          this.lang = res;
          // console.log(this.translate.instant('alertmessages'))
        });
      }, 2000);
    });
    Network.addListener('networkStatusChange', status => {
      if (status.connected) {
        this.showToast('Internet connected');
      } else {
        this.showToast('No Internet connection...');
      }
    });
  }

  // --- Passthroughs to AppStateService (Subjects + shared mutable state) ---
  // split out along with getStatusMessage since it only exists to push onto
  // uploadProgress/events. Getters only for the Subjects — nothing in the
  // app ever reassigns them, only .next()/.subscribe(). unread/
  // private_message/deactivate_date are genuinely reassigned by consumers,
  // so those need real get/set pairs.
  get events() { return this.appState.events; }
  get language() { return this.appState.language; }
  get selectedUsers() { return this.appState.selectedUsers; }
  get newsUpdated() { return this.appState.newsUpdated; }
  get uploadProgress() { return this.appState.uploadProgress; }

  get unread() { return this.appState.unread; }
  set unread(value: boolean) { this.appState.unread = value; }

  get private_message() { return this.appState.private_message; }
  set private_message(value: boolean) { this.appState.private_message = value; }

  get deactivate_date() { return this.appState.deactivate_date; }
  set deactivate_date(value: string) { this.appState.deactivate_date = value; }

  getStatusMessage(event: any) {
    return this.appState.getStatusMessage(event);
  }

  async openAvatarModel(pic: string) {
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

  showRatePrompt(lang: unknown) {
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

  async switchAccount(ev: unknown, lang: any) {
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

  // --- Passthroughs to OverlayService (loader/toast/alert orchestration) ---
  /** Show Loading popup. */
  async showLoading() {
    return this.overlay.showLoading();
  }

  /** Hide loading popup. */
  async hideLoading() {
    return this.overlay.hideLoading();
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
    return this.overlay.run(work);
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
    await this.overlay.errorAlert(error);
  }

  removeUrlFromString(inputString: string) {
    return this.overlay.removeUrlFromString(inputString);
  }

  /** ALert message popup.
   * @param {String} msg - Error message to display
   */
  async msgALertMessage(msg: string) {
    await this.overlay.infoAlert(msg);
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
   * Check whether network is available or not
   */
  getNetworkInformation(): Promise<boolean> {
    return this.apiClient.getNetworkInformation();
  }

  // --- Passthroughs to UtilService (pure helper functions) ---
  base64toBlob(base64Data: string, contentType: string): Blob {
    return this.util.base64toBlob(base64Data, contentType);
  }

  dataURItoBlob(dataURI: string): Blob {
    return this.util.dataURItoBlob(dataURI);
  }

  generateRandomFileName(extension: string = ''): string {
    return this.util.generateRandomFileName(extension);
  }

  /**
   * get date in yyyy-mm-dd
   * @param date date object
   */
  getFormatedDate(date: Date) {
    return this.util.getFormatedDate(date);
  }

  /**
   * Download image
   * @param url image url
   */
  downloadImage(url: string): Promise<boolean> {
    return this.util.downloadImage(url);
  }

  caclulateHours(start: string | Date, end: string | Date) {
    return this.util.caclulateHours(start, end);
  }

  addHoursToDate(date: Date, hours: number): Date {
    return this.util.addHoursToDate(date, hours);
  }
}

export function getFileReader(): FileReader {
  const fileReader = new FileReader();
  const zoneOriginalInstance = (fileReader as unknown as { __zone_symbol__originalInstance?: FileReader })['__zone_symbol__originalInstance'];
  return zoneOriginalInstance || fileReader;
}
