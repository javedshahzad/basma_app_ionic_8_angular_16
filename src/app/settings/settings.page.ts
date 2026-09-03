import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, Platform, AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { CameraResultType, Camera, ImageOptions, CameraSource } from '@capacitor/camera';

import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { GeoServiceProvider } from '../service/geo-service/geo-service';
import { Storage } from '@ionic/storage';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { DeviceApiService } from '../service/device-api/device-api.service';
import {
  UserManagementApiService,
  SchoolRulesDetails
} from '../service/user-management-api/user-management-api.service';
import { UserType } from '../constants/user-type';

import { FormsModule } from '@angular/forms';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';
import { HasRoleDirective } from '../directives/has-role.directive';
import { PermissionService } from '../service/permission/permission.service';
import { SchoolDeletionBannerComponent } from '../components/school-deletion-banner/school-deletion-banner.component';

interface SettingsCountry {
  code?: string;
  name?: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, TranslatePipe, HasRoleDirective, SchoolDeletionBannerComponent]
})
export class SettingsPage {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;

  user = {
    name: '',
    pic: '',
    username: '',
    email_id: '',
    phone_no: '',
    oldpass: '',
    newpass: '',
    parent_register_link: true,
    teacher_register_link: true,
    delay_rule: '',
    warning_report: '',
    warning_report_second: '',
    warning_report_third: '',
    school_details: '',
    country: ''
  };
  displayPic: string = '';
  lang: Record<string, string> = {};
  userDetails: LoggedInUser = {};
  passwordType: string = 'password';
  passwordIcon: string = 'eye-off';
  passwordTypecnf: string = 'password';
  passwordIconcnf: string = 'eye-off';
  userType: string;
  schoolDetail: SchoolRulesDetails['school_details'] = {};
  is_school_admin: number | boolean;
  parent_link: boolean;
  teacherLink: boolean;
  countries: SettingsCountry[] = [];
  selectedCountyCode: string;
  countryDetails: { country_en_name: string; country_code: string; country_ar_name: string } = {
    country_en_name: '',
    country_code: '',
    country_ar_name: ''
  };
  appBrand: 'sapphire' | 'gold' | 'burgundy' | 'emerald' = 'sapphire';
  appThemeMode: 'light' | 'dark' = 'light';

  deactivate_date: string;
  /** Server-computed deactivate_date + SCHOOL_DELETION_GRACE_DAYS — the
   * countdown banner counts down to this, never a client-side constant. */
  delete_at: string | null = null;
  delete_translation_text: Record<string, string> = {};
  showDeleteAlert: boolean = false;

  show_save_spinner: boolean = false;

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after
  // ionViewWillEnter()'s `if (userLoggedIn)` guard has already populated
  // it — the non-null assertion documents that invariant once instead of
  // at every access site.
  get userInfo(): UserDetails {
    return this.userDetails.details!;
  }

  constructor(
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    private router: Router,
    private storage: Storage,
    private geoService: GeoServiceProvider,
    public alertCtrl: AlertController,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private deviceApi: DeviceApiService,
    private userManagementApi: UserManagementApiService,
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.translate.get('setting').subscribe(res => {
      this.delete_translation_text = res;
      this.cdr.markForCheck();
    });
    this.getCountry();

    this.storageSr.get('appBrand').then(brand => {
      this.appBrand =
        brand === 'gold' || brand === 'burgundy' || brand === 'emerald' ? brand : 'sapphire';
      this.cdr.markForCheck();
    });
    this.storageSr.get('appThemeMode').then(mode => {
      this.appThemeMode = mode === 'dark' ? 'dark' : 'light';
      this.cdr.markForCheck();
    });
  }

  async setAppBrand(brand: 'sapphire' | 'gold' | 'burgundy' | 'emerald') {
    this.appBrand = brand;
    await this.storageSr.set('appBrand', brand);
    if (brand === 'gold' || brand === 'burgundy' || brand === 'emerald') {
      document.documentElement.setAttribute('data-brand', brand);
    } else {
      document.documentElement.removeAttribute('data-brand');
    }
  }

  async setAppThemeMode(mode: 'light' | 'dark') {
    this.appThemeMode = mode;
    await this.storageSr.set('appThemeMode', mode);
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // 🟢 3. تحويل الدالة لـ async واستبدال localStorage
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      var last_name = this.userInfo.last_name ? this.userInfo.last_name : '';
      this.user.name = (this.userInfo.first_name || '') + ' ' + last_name;
      this.user.username = this.userInfo.username || '';
      this.user.email_id = this.userInfo.email_id || '';
      this.user.phone_no = this.userInfo.phone_no || '';
      this.user.school_details = (this.userInfo.school_details as string) || '';
      this.user.country = this.userInfo.country_ar_name || '';
      this.selectedCountyCode = this.userInfo.country_code || '';

      if (this.selectedCountyCode) {
        this.assignCountry();
      }

      if (this.userInfo.is_school_admin == 1) {
        this.displayPic = this.userInfo.school_logo || '';
      } else {
        this.displayPic = this.userInfo.pic || '';
      }
      this.userType = this.userInfo.user_type || '';
      this.is_school_admin = this.userInfo.is_school_admin || false;

      if (this.permissionService.hasRole(UserType.Admin)) {
        this.getAllRules();
      }
    } else {
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getCountry() {
    this.storage.get('language').then(res => {
      if (res == 'en') {
        this.countries = this.geoService.getEnCountries();
      } else {
        this.countries = this.geoService.getArCountries();
      }
      this.cdr.markForCheck();
    });
  }

  assignCountry() {
    this.countryDetails = this.geoService.getCountryDetails(this.selectedCountyCode);
  }

  showpass() {
    this.passwordType = this.passwordType === 'text' ? 'password' : 'text';
    this.passwordIcon = this.passwordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }

  showpasscnf() {
    this.passwordTypecnf = this.passwordTypecnf === 'text' ? 'password' : 'text';
    this.passwordIconcnf = this.passwordIconcnf === 'eye-off' ? 'eye' : 'eye-off';
  }

  getAllRules() {
    let data = {
      school_id: this.userInfo.school_id,
      user_no: this.userInfo.user_no,
      // New API's getAllRules requires session_id (AuthorizeAdmin) — legacy
      // didn't validate it here, school was implicitly scoped by school_id alone.
      session_id: this.userDetails.session_id
    };
    this.userManagementApi
      .getAllRules(data)
      .then(res => {
        if (res) {
          this.schoolDetail = res.school_details || {};
          const schoolDetail = this.schoolDetail;
          const userDetails = res.user_details || {};
          if (userDetails.teacher_register_link == '1') {
            this.teacherLink = true;
          } else {
            this.teacherLink = false;
          }
          if (userDetails.parent_register_link == '1') {
            this.parent_link = true;
          } else {
            this.parent_link = false;
          }
          this.user.delay_rule = String(schoolDetail.delay_rule ?? '');
          this.user.warning_report = String(schoolDetail.report_condition ?? '');
          this.user.warning_report_second = String(schoolDetail.second_report_condition ?? '');
          this.user.warning_report_third = String(schoolDetail.third_report_condition ?? '');
          if (schoolDetail.deactivate_date) {
            this.deactivate_date = schoolDetail.deactivate_date;
            this.delete_at = schoolDetail.delete_at || null;
            this.dataProvider.deactivate_date = this.deactivate_date;
          }
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        console.log(error);
      });
  }

  // 🟢 4. تأمين الحفظ والتحديث بشكل غير متزامن
  async update() {
    if (this.user.oldpass != '' && this.user.newpass == '') {
      this.dataProvider.showToast(this.lang.new_pass_required);
    } else if (this.user.oldpass == '' && this.user.newpass != '') {
      this.dataProvider.showToast(this.lang.old_pass_required);
    } else {
      let uuid = await this.storageSr.get('uuid'); // 👈 قراءة UUID بأمان

      let data: Record<string, unknown> & { users: Record<string, string> } = {
        user_no: this.userInfo.user_no,
        session_id: this.userDetails.session_id,
        users: {
          email_id: this.user.email_id,
          phone_no: this.user.phone_no,
          oldpass: this.user.oldpass,
          newpass: this.user.newpass
        },
        uuid: uuid,
        parent_register_link: this.user.parent_register_link,
        teacher_register_link: this.user.teacher_register_link,
        delay_rule: this.user.delay_rule,
        warning_report: this.user.warning_report,
        warning_report_second: this.user.warning_report_second,
        warning_report_third: this.user.warning_report_third,
        pic: this.user.pic
      };

      if (this.selectedCountyCode) {
        data.country_en_name = this.countryDetails.country_en_name || this.userInfo.country_en_name;
        data.country_code = this.countryDetails.country_code || this.userInfo.country_code;
        data.country_ar_name = this.countryDetails.country_ar_name || this.userInfo.country_ar_name;
      }

      this.dataProvider
        .run(() => this.userManagementApi.updateUserSettings(data))
        .then(async response => {
          if (response.session) {
            this.dataProvider.showToast(response.message || '');

            if (this.selectedCountyCode) {
              this.userInfo.country_en_name = this.countryDetails.country_en_name;
              this.userInfo.country_code = this.countryDetails.country_code;
              this.userInfo.country_ar_name = this.countryDetails.country_ar_name;
            }
            this.userInfo.email_id = this.user.email_id;
            this.userInfo.phone_no = this.user.phone_no;

            if (this.userInfo.is_school_admin == 1) {
              this.dataProvider.language.next('ar');
              this.userInfo.school_logo = response.pic != '' ? response.pic : this.displayPic;
            } else {
              this.userInfo.pic = response.pic != '' ? response.pic : this.displayPic;
            }

            // 👈 حفظ التغييرات في الجلسة الحالية بأمان
            await this.storageSr.set('userloggedin', this.userDetails);

            // 👈 تحديث بيانات الدخول السريع (EarlyLogin) إن وجدت
            let earlyLoginData = await this.storageSr.get('earlyLogin');
            if (earlyLoginData) {
              let loggedinUser = earlyLoginData;
              for (var i = 0; i < loggedinUser.length; i++) {
                if (loggedinUser[i].name == this.userInfo.first_name) {
                  if (this.user.newpass != '') {
                    loggedinUser[i].password = this.user.newpass;
                  }
                  if (this.userInfo.is_school_admin == 1) {
                    loggedinUser[i].image = this.userInfo.school_logo;
                  } else {
                    loggedinUser[i].image = this.userInfo.pic;
                  }
                }
              }
              await this.storageSr.set('earlyLogin', loggedinUser);
            }

            this.authProvider.publishEvent(true);

            if (this.user.oldpass != '' && this.user.newpass != '') {
              this.logoutDeviceFromAll();
            }
          } else {
            this.authProvider.flushLocalStorage();
            this.dataProvider.errorALertMessage(response.message || '');
            this.router.navigate(['login'], { replaceUrl: true });
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.errorALertMessage(error);
          this.cdr.markForCheck();
        });
    }
  }

  logoutDeviceFromAll() {
    let data = {
      user_no: this.userInfo.user_no
    };
    this.dataProvider
      .run(() => this.deviceApi.LogOutAllDevice(data))
      .then(
        res => {
          if (res.success) {
            this.logout();
          }
        },
        error => {
          this.dataProvider.showToast('error');
        }
      );
  }

  // 🟢 5. التخلص من قراءة الـ localStorage أثناء تسجيل الخروج
  async logout() {
    let userDetail = await this.storageSr.get('userloggedin');
    if (userDetail) {
      let data = {
        user_no: userDetail.details.user_no,
        session_id: userDetail.session_id
      };
      this.authProvider
        .doLogout(data)
        .then(resp => {
          this.router.navigate(['login'], { replaceUrl: true });
        })
        .catch(error => {
          this.dataProvider.hideLoading();
        });
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  onClickDeleteSchool() {
    this.showDeleteAlert = true;
  }

  async presentPrintOption() {}

  onCancelDeleteSchool() {
    this.showDeleteAlert = false;
  }

  async deleteSchool() {
    this.showDeleteAlert = false;
    let data = {
      school_id: this.userInfo.school_id,
      user_no: this.userInfo.user_no,
      session_id: this.userDetails.session_id
    };
    try {
      const response = await this.dataProvider.run(() => this.userManagementApi.requestTodeleteSchoolAccount(data));
      if (!response.response) {
        this.dataProvider.errorALertMessage(response.msg || '');
      } else {
        var responseData = response;
        if (responseData.success) {
          this.dataProvider.errorALertMessage(response.msg || '');
          const deactivateInfo = responseData.response as { deactivate_date?: string; delete_at?: string };
          this.deactivate_date = deactivateInfo.deactivate_date || '';
          this.delete_at = deactivateInfo.delete_at || null;
          this.dataProvider.deactivate_date = deactivateInfo.deactivate_date || '';
        }
      }
    } catch (error) {
      console.log(error);
    }
    this.cdr.markForCheck();
  }

  revertSchoolDeletion() {
    let data = {
      school_id: this.userInfo.school_id,
      user_no: this.userInfo.user_no,
      session_id: this.userDetails.session_id
    };
    this.dataProvider
      .run(() => this.userManagementApi.revertDeletedSchoolSettings(data))
      .then(response => {
        this.dataProvider.errorALertMessage(response.message || '');
        this.deactivate_date = '';
        this.delete_at = null;
        this.dataProvider.deactivate_date = '';
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error.msg);
      });
  }

  async takePicture() {
    const alert = await this.alertCtrl.create({
      header: this.lang.image_option,
      buttons: [
        {
          text: this.lang.camera,
          handler: () => {
            this.openCamera();
          }
        },
        {
          text: this.lang.gallery,
          handler: () => {
            this.openGallery();
          }
        }
      ]
    });
    await alert.present();
  }

  openCamera() {
    const options: ImageOptions = {
      quality: 100,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    };

    Camera.getPhoto(options).then(imageData => {
      if (imageData) {
        this.displayPic = 'data:image/png;base64,' + imageData.base64String;
        this.user.pic = 'data:image/png;base64,' + imageData.base64String;
      }
      this.cdr.markForCheck();
    });
  }

  openGallery() {
    const options: ImageOptions = {
      quality: 79,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos
    };

    Camera.getPhoto(options).then(imageData => {
      if (imageData) {
        this.displayPic = 'data:image/png;base64,' + imageData.base64String;
        this.user.pic = 'data:image/png;base64,' + imageData.base64String;
      }
      this.cdr.markForCheck();
    });
  }

}
