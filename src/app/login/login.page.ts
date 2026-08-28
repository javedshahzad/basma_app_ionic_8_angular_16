import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalController, NavController, Platform, PopoverController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { DatabaseService } from '../service/database/database.service';
import { LoginModel } from '../model/login.model';
import { Device } from '@capacitor/device';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, NavigationExtras } from '@angular/router';
import { LoaderComponent } from '../components/loader/loader.component';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { CredentialStorageService } from '../service/credential-storage/credential-storage.service';
import { DeviceApiService } from '../service/device-api/device-api.service';
import { PlanApiService } from '../service/plan-api/plan-api.service';
import { PrefetchService } from '../service/prefetch/prefetch.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, TranslatePipe]
})
export class LoginPage {
  trackByIndex(index: number): number {
    return index;
  }
  loggedinUser: any[] = [];
  user: LoginModel = <LoginModel>{};
  rememberMe: boolean = false;
  popOver: any;
  viewPass: boolean = false;
  uniqueDeviceId: string = ''; // 🟢 متغير لتخزين المعرف الفريد بأمان

  constructor(
    public navCtrl: NavController,
    public authProvider: AuthService,
    public dataProvider: DataService,
    public platform: Platform,
    public translate: TranslateService,
    public popoverController: PopoverController,
    public zone: NgZone,
    private router: Router,
    public dbProvider: DatabaseService,
    public modalController: ModalController,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private credentialStorage: CredentialStorageService,
    private deviceApi: DeviceApiService,
    private planApi: PlanApiService,
    private prefetchService: PrefetchService,
    private cdr: ChangeDetectorRef
  ) {}

  // 🟢 3. دورة الحياة المتزامنة لتجهيز المعرفات والبيانات
  async ionViewWillEnter() {
    this.dissmissPopOver();

    // 1. تحديد المعرف الفريد (UUID) ومنع أخطاء المتصفح
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      const [deviceId, deviceInfo] = await Promise.all([Device.getId(), Device.getInfo()]);
      this.uniqueDeviceId = deviceId.identifier;
      this.user.os_type = deviceInfo.platform === 'android' ? 1 : 2;
    } else {
      let browserId = await this.storageSr.get('browser_uuid');
      if (!browserId) {
        browserId = 'BRW-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await this.storageSr.set('browser_uuid', browserId);
      }
      this.uniqueDeviceId = browserId;
      this.user.os_type = 2;
    }
    this.user.device_id = this.uniqueDeviceId;

    // 2. استرجاع بيانات "تذكرني" بذكاء
    const credentials = await this.credentialStorage.get('usercredentials');

    if (credentials) {
      // 🟢 نستخدم zone.run مع تأخير بسيط لضمان أن الحقول جاهزة للاستقبال
      this.zone.run(() => {
        setTimeout(() => {
          this.user.email_id = credentials.email_id;
          this.user.password = credentials.password;
          this.rememberMe = credentials.rememberMe;
          console.log('✅ تم استعادة البيانات المحفوظة:', this.user.email_id);
          this.cdr.markForCheck();
        }, 100);
      });
    }

    // استرجاع قائمة الحسابات السابقة
    let earlyLoginData = await this.credentialStorage.get('earlyLogin');
    if (earlyLoginData) {
      this.zone.run(() => {
        this.loggedinUser = earlyLoginData;
      });
    }
    this.cdr.markForCheck();
  }

  togglePass() {
    this.viewPass = !this.viewPass;
  }

  openRegister() {
    this.router.navigate(['school-registration']);
  }

  // 🟢 4. دالة تسجيل الدخول الآمنة والسريعة
  async login() {
    if (!this.user.email_id || !this.user.password) {
      this.dataProvider.showToast(
        this.translate.instant('login.fill_details') || 'الرجاء إدخال اسم المستخدم وكلمة المرور'
      );
      return;
    }

    if (this.rememberMe) {
      await this.credentialStorage.set('usercredentials', {
        email_id: this.user.email_id,
        password: this.user.password,
        rememberMe: this.rememberMe
      });
    } else {
      await this.credentialStorage.remove('usercredentials');
    }

    await this.presentPopover();

    let loginData = {
      ...this.user,
      uuid: this.uniqueDeviceId
    };

    this.authProvider
      .doLogin(loginData)
      .then(async (response: any) => {
        let img = response.details.is_school_admin == 1 ? response.details.school_logo : response.details.pic;

        let currentUserData = {
          name: response.details.first_name,
          email_id: this.user.email_id,
          password: this.user.password,
          user_no: response.details.user_no,
          image: img
        };

        let index = this.loggedinUser.findIndex(u => u.email_id === this.user.email_id);
        if (index === -1) {
          this.loggedinUser.push(currentUserData);
        } else {
          this.loggedinUser[index] = currentUserData;
        }

        await this.credentialStorage.set('earlyLogin', this.loggedinUser);

        // 🟢 1. تسجيل الجهاز في السيرفر فوراً لمنع الطرد
        await this.LogInDevice(response.details.user_no, response.session_id);

        // 🟢 2. إضافة manual: true لمنع التوجيه المزدوج
        this.authProvider.publishEvent({ loggedin: true, details: response.details, manual: true });
        this.authProvider.changeUser(true);
        this.dissmissPopOver();

        // === التعديل المطلوب هنا: إجبار تحديث لغة القائمة الجانبية ===
        this.storageSr.get('language').then(lang => {
          let currentLang = lang ? lang : 'ar';
          this.translate.use(currentLang);
          this.dataProvider.language.next(currentLang);
        });
        // =========================================================

        // 🟢 4. تهيئة ذاكرة التخزين المؤقت (الصفوف وكشوف الحضور) بشكل استباقي
        // بدلاً من انتظار زيارة المستخدم لصفحة الصفوف — لا يُنتظر هذا الوعد
        // حتى لا يؤخر التنقل، وهو بلا تأثير عملي على متصفح الويب (الخدمة
        // تتجاهل نفسها هناك تلقائياً)
        if (response.details.user_type !== '4' && response.details.user_type !== '8') {
          this.prefetchService.prefetchClassesAndRosters(response.details.user_no, response.details.school_id, response.session_id);
        }

        if (response.details.is_school_admin == 1) {
          this.getUserPlan(response.details.user_no, response.details.school_id);
          return;
        }

        // 🟢 3. استخدام navigateRoot لتدمير الواجهة القديمة وبناء واجهة جديدة نظيفة
        if (response.details.user_type == '4') {
          this.navCtrl.navigateRoot('/tabs/children');
        } else if (response.details.user_type == '8') {
          this.navCtrl.navigateRoot('/tabs/student-titles');
        } else {
          this.navCtrl.navigateRoot('/tabs');
        }
      })
      .catch(error => {
        this.dissmissPopOver();
        this.dataProvider.errorALertMessage(error);
        this.cdr.markForCheck();
      });
  }

  forgotPassword() {
    let email = this.user ? this.user.email_id : '';
    const navigation: NavigationExtras = {
      state: { email: email }
    };
    this.zone.run(() => {
      this.router.navigate(['forgot-password'], navigation);
    });
  }

  async presentPopover() {
    if (this.popOver) {
      this.dissmissPopOver();
    }
    this.popOver = await this.popoverController.create({
      component: LoaderComponent,
      backdropDismiss: false,
      translucent: false,
      cssClass: 'loaderStyle'
    });
    await this.popOver.present();
  }

  dissmissPopOver() {
    if (this.popOver) {
      this.popOver.dismiss().catch(() => {});
      this.popOver = null;
    }
  }

  // استيراد ديناميكي بدل ثابت: النافذة لا تُفتح إلا عند انتهاء باقة مدرسة
  // معيّنة، لا في كل عملية دخول — تحميلها ثابتاً في أعلى الملف كان يُقحمها
  // ضمن حزمة شاشة الدخول نفسها لكل مستخدم. راجع خطة العمل الاحترافية لحزمة
  // التحميل الأساسية، المرحلة الثانية.
  async presentModalSubscription() {
    const { SubscribePlanComponent } = await import('../components/subscribe-plan/subscribe-plan.component');
    const modal = await this.modalController.create({
      component: SubscribePlanComponent,
      cssClass: 'subscription-modal'
    });
    return await modal.present();
  }

  // دالة فحص الباقة لمدير المدرسة
  async getUserPlan(user_no: string, school_id: string) {
    let data = { user_no: user_no, school_id: school_id };

    this.planApi
      .getUserPlan(data)
      .then(async (res: any) => {
        if (res && res.response) {
          let availablePlan = res.response;
          await this.storageSr.set('availablePlan', availablePlan);

          if (availablePlan.isExpire == true || availablePlan.plan.slug == 'free') {
            this.presentModalSubscription();
          } else {
            this.router.navigate(['tabs'], { replaceUrl: true });
          }
        } else {
          this.presentModalSubscription();
        }
      })
      .catch(e => {
        this.router.navigate(['tabs'], { replaceUrl: true });
      });
  }

  // 🟢 دالة مصيرية: تسجيل الجهاز لتفعيل أمان (Single Device Login)
  async LogInDevice(user_no: string, session_id?: string) {
    let data = {
      user_no: user_no,
      device_id: this.uniqueDeviceId,
      session_id: session_id
    };

    this.deviceApi
      .LogInSingleDevice(data)
      .then(res => {
        console.log('Device officially registered:', res);
      })
      .catch(error => {
        console.error('Failed to register device:', error);
      });
  }
}
