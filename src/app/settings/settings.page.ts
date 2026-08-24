import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, Platform, AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { CameraResultType, Camera, ImageOptions, CameraSource } from '@capacitor/camera';

import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { GeoServiceProvider } from '../service/geo-service/geo-service';
import { Storage } from '@ionic/storage';

// 🟢 استبدال moment بـ dayjs
import dayjs from 'dayjs';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { DeviceApiService } from '../service/device-api/device-api.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';
import { UserType } from '../constants/user-type';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoggedInUser } from '../model/logged-in-user.model';
import { SchoolRulesDetails } from '../service/data/data.service';

interface SettingsCountry {
  code?: string;
  name?: string;
}

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, FormsModule, NgFor, TranslatePipe]
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
  deactivate_date: string;
  delete_translation_text: Record<string, string> = {};
  showDeleteAlert: boolean = false;
  DateLeftTodeleteAccount: string;

  show_save_spinner: boolean = false;
  timerInterval: ReturnType<typeof setInterval>;
  remainingTime: { days: number; hours: number; minutes: number } = { days: 0, hours: 0, minutes: 0 };

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
  }

  // 🟢 3. تحويل الدالة لـ async واستبدال localStorage
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      var last_name = this.userDetails.details.last_name ? this.userDetails.details.last_name : '';
      this.user.name = this.userDetails.details.first_name + ' ' + last_name;
      this.user.username = this.userDetails.details.username;
      this.user.email_id = this.userDetails.details.email_id;
      this.user.phone_no = this.userDetails.details.phone_no;
      this.user.school_details = this.userDetails.details.school_details as string;
      this.user.country = this.userDetails.details.country_ar_name;
      this.selectedCountyCode = this.userDetails.details.country_code;

      if (this.selectedCountyCode) {
        this.assignCountry();
      }

      if (this.userDetails.details.is_school_admin == 1) {
        this.displayPic = this.userDetails.details.school_logo;
      } else {
        this.displayPic = this.userDetails.details.pic;
      }
      this.userType = this.userDetails.details.user_type;
      this.is_school_admin = this.userDetails.details.is_school_admin;

      if (this.userType == UserType.Admin) {
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
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no,
      // New API's getAllRules requires session_id (AuthorizeAdmin) — legacy
      // didn't validate it here, school was implicitly scoped by school_id alone.
      session_id: this.userDetails.session_id
    };
    this.dataProvider
      .getAllRules(data)
      .then(res => {
        if (res) {
          this.schoolDetail = res.school_details;
          if (res.user_details.teacher_register_link == '1') {
            this.teacherLink = true;
          } else {
            this.teacherLink = false;
          }
          if (res.user_details.parent_register_link == '1') {
            this.parent_link = true;
          } else {
            this.parent_link = false;
          }
          this.user.delay_rule = String(this.schoolDetail.delay_rule ?? '');
          this.user.warning_report = String(this.schoolDetail.report_condition ?? '');
          this.user.warning_report_second = String(this.schoolDetail.second_report_condition ?? '');
          this.user.warning_report_third = String(this.schoolDetail.third_report_condition ?? '');
          if (this.schoolDetail.deactivate_date) {
            this.deactivate_date = this.schoolDetail.deactivate_date;
            this.startCountdownTimer();
            let addHourtodate = this.dataProvider.addHoursToDate(new Date(), 72);
            this.DateLeftTodeleteAccount = this.dataProvider.caclulateHours(this.deactivate_date, addHourtodate);
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
        user_no: this.userDetails.details.user_no,
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
        data.country_en_name = this.countryDetails.country_en_name || this.userDetails.details.country_en_name;
        data.country_code = this.countryDetails.country_code || this.userDetails.details.country_code;
        data.country_ar_name = this.countryDetails.country_ar_name || this.userDetails.details.country_ar_name;
      }

      this.dataProvider
        .run(() => this.dataProvider.updateUserSettings(data))
        .then(async response => {
          if (response.session) {
            this.dataProvider.showToast(response.message);

            if (this.selectedCountyCode) {
              this.userDetails.details.country_en_name = this.countryDetails.country_en_name;
              this.userDetails.details.country_code = this.countryDetails.country_code;
              this.userDetails.details.country_ar_name = this.countryDetails.country_ar_name;
            }
            this.userDetails.details.email_id = this.user.email_id;
            this.userDetails.details.phone_no = this.user.phone_no;

            if (this.userDetails.details.is_school_admin == 1) {
              this.dataProvider.language.next('ar');
              this.userDetails.details.school_logo = response.pic != '' ? response.pic : this.displayPic;
            } else {
              this.userDetails.details.pic = response.pic != '' ? response.pic : this.displayPic;
            }

            // 👈 حفظ التغييرات في الجلسة الحالية بأمان
            await this.storageSr.set('userloggedin', this.userDetails);

            // 👈 تحديث بيانات الدخول السريع (EarlyLogin) إن وجدت
            let earlyLoginData = await this.storageSr.get('earlyLogin');
            if (earlyLoginData) {
              let loggedinUser = earlyLoginData;
              for (var i = 0; i < loggedinUser.length; i++) {
                if (loggedinUser[i].name == this.userDetails.details.first_name) {
                  if (this.user.newpass != '') {
                    loggedinUser[i].password = this.user.newpass;
                  }
                  if (this.userDetails.details.is_school_admin == 1) {
                    loggedinUser[i].image = this.userDetails.details.school_logo;
                  } else {
                    loggedinUser[i].image = this.userDetails.details.pic;
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
            this.dataProvider.errorALertMessage(response.message);
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
      user_no: this.userDetails.details.user_no
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
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no
    };
    try {
      const response = await this.dataProvider.run(() =>
        this.userManagementApi.requestTodeleteSchoolAccount(data)
      );
      if (!response.response) {
        this.dataProvider.errorALertMessage(response.msg);
      } else {
        var responseData = response;
        if (responseData.success) {
          this.dataProvider.errorALertMessage(response.msg);
          const deactivateInfo = responseData.response as { deactivate_date?: string };
          this.deactivate_date = deactivateInfo.deactivate_date;
          this.dataProvider.deactivate_date = deactivateInfo.deactivate_date;
        }
      }
    } catch (error) {
      console.log(error);
    }
    this.cdr.markForCheck();
  }

  revertSchoolDeletion() {
    let data = {
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no
    };
    this.dataProvider
      .run(() => this.dataProvider.revertDeletedSchoolSettings(data))
      .then(response => {
        this.dataProvider.errorALertMessage(response.message);
        this.deactivate_date = '';
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


  // 🟢 استبدال moment بـ dayjs بشكل مباشر
  calculateRemainingTime() {
    if (!this.deactivate_date) return;

    let deactivationDate = dayjs(this.deactivate_date);
    let now = dayjs();

    // حساب الفرق بالميلي ثانية
    let elapsed = now.diff(deactivationDate);
    let total72Hours = 72 * 60 * 60 * 1000;

    let remaining = total72Hours - elapsed;

    if (remaining <= 0) {
      this.remainingTime = { days: 0, hours: 0, minutes: 0 };
    } else {
      this.remainingTime = {
        days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
        hours: Math.floor((remaining / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((remaining / 1000 / 60) % 60)
      };
    }
  }

  startCountdownTimer() {
    this.calculateRemainingTime();
    this.cdr.markForCheck();
    this.timerInterval = setInterval(() => {
      this.calculateRemainingTime();
      this.cdr.markForCheck();
    }, 60000);
  }

  ionViewWillLeave() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
