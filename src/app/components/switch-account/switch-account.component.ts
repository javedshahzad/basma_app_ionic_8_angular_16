import { Component, OnInit, Input, NgZone, ChangeDetectorRef } from '@angular/core';
import { ModalController, PopoverController, IonicModule, NavController, AlertController, Platform } from '@ionic/angular';
import { AuthService } from '../../service/auth/auth.service';
import { DatabaseService } from '../../service/database/database.service';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoaderComponent } from '../../components/loader/loader.component';
import { DataService } from '../../service/data/data.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../service/storage.service';
import { DeviceApiService } from '../../service/device-api/device-api.service';

@Component({
  selector: 'app-switch-account',
  templateUrl: './switch-account.component.html',
  styleUrls: ['./switch-account.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
})
export class SwitchAccountComponent implements OnInit {
  trackByIndex(index: number): number { return index; }
  @Input() lang: any;
  loggedinUser: any[] = []; 
  userDetails: any;
  currentUser: any;
  popOver: any;
  currentUserEmail: any;
  fcm_Token: any = "";
  device_id: any = '';
  os_type: any = '2';
  user_no: any;

  constructor(
    public popoverController: PopoverController,
    public navCtrl: NavController, 
    public device: Device, 
    public authProvider: AuthService,
    public platform: Platform, 
    private alertController: AlertController,
    public translate: TranslateService, 
    private route: ActivatedRoute,
    public zone: NgZone,
    private router: Router,
    public dbProvider: DatabaseService,
    public dataProvider: DataService,
    public modalController: ModalController,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private deviceApi: DeviceApiService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async loadData() {
    this.fcm_Token = await this.storageSr.get("FcmToken");
    if (!this.fcm_Token) {
      this.fcm_Token = localStorage.getItem("FcmToken") || "";
    }
    
    if (this.platform.is("cordova") || this.platform.is("capacitor")) {
      this.device_id = this.device.uuid;
      this.os_type = (this.device.platform == 'android' || this.device.platform == 'Android') ? 1 : 2;
    } else {
      let browserId = await this.storageSr.get("browser_uuid");
      if (!browserId) {
          browserId = 'BRW-' + Math.random().toString(36).substr(2, 9).toUpperCase();
          await this.storageSr.set("browser_uuid", browserId);
      }
      this.device_id = browserId;
      this.os_type = 2; 
    }

    let userLoggedInData = await this.storageSr.get("userloggedin");
    if (!userLoggedInData) {
      let oldUser = localStorage.getItem("userloggedin");
      if (oldUser) userLoggedInData = JSON.parse(oldUser);
    } else if (typeof userLoggedInData === 'string') {
      try { userLoggedInData = JSON.parse(userLoggedInData); } catch(e) {}
    }

    let earlyLoginData = await this.storageSr.get('earlyLogin');
    if (!earlyLoginData) {
      let oldEarly = localStorage.getItem('earlyLogin');
      if (oldEarly) earlyLoginData = JSON.parse(oldEarly);
    } else if (typeof earlyLoginData === 'string') {
      try { earlyLoginData = JSON.parse(earlyLoginData); } catch(e) {}
    }

    this.zone.run(() => {
      if (userLoggedInData && userLoggedInData.details) {
        this.userDetails = userLoggedInData;
        this.currentUser = this.userDetails.details.username;
        this.currentUserEmail = this.userDetails.details.email_id;
        this.user_no = this.userDetails.details.user_no;
      }
      
      if (earlyLoginData && Array.isArray(earlyLoginData) && earlyLoginData.length > 0) {
        this.loggedinUser = earlyLoginData;
      } else {
        this.loggedinUser = []; 
      }
      this.cdr.detectChanges(); 
    });
  }

  removeUser(i: number) {
    this.warnRemove(async (res: any) => {
      this.zone.run(() => {
        this.loggedinUser.splice(i, 1);
        this.cdr.detectChanges(); 
      });
      await this.storageSr.set("earlyLogin", this.loggedinUser);
      localStorage.setItem("earlyLogin", JSON.stringify(this.loggedinUser)); 
    }, (e: any) => {});
  }

  async warnRemove(callBack: any, error: any) {
     const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: this.lang?.confirm || 'تأكيد',
      message: this.lang?.alert_mssg || 'هل أنت متأكد من الإزالة؟',
      buttons: [
        { text: this.lang?.cancel || 'إلغاء', role: 'cancel', cssClass: 'secondary', handler: () => { error(false); } },
        { text: this.lang?.okay || 'موافق', handler: () => { callBack(true); } }
      ]
    });
    await alert.present();
  }

  closeModal() {
    this.popoverController.dismiss();
  }

  // 🟢 التبديل الاحترافي: لا توجيه لشاشة الدخول، نعرض التحميل ونوجه مباشرة للصفحة الهدف!
  // 🟢 التبديل الانسيابي الخالي من التعارض
  async loginOldUser(users: any) {
      // 1. إغلاق النافذة السفلية فوراً لكي لا تبقى معلقة في الشاشة
      this.closeModal();
      
      // 2. إظهار شاشة التحميل المركزية (عبر AuthService) لمنع التعارض
      await this.authProvider.showLoading();
      
      // 3. مسح بيانات الجلسة الحالية من الذاكرة
      await this.flushLocalStorage();
      
      // 4. الدخول بالحساب الجديد
      this.login(users);
  }

  registerSchol() {
    this.router.navigate(['school-registration']);
    this.closeModal();
  }

  addNewAccount() {
    this.router.navigate(['/login']);
    this.closeModal();
  }

  async flushLocalStorage() {
    await this.storageSr.remove("userloggedin");
    await this.storageSr.remove("attendance");
    await this.storageSr.remove("availablePlan");
    try { await this.dbProvider.deleteDataBase(); } catch(e) {}
  }

  async login(users: any) {
    users.device_id = this.device_id;
    users.os_type = this.os_type;
    users.registration_id = this.fcm_Token;
    
    let systemUuid = await this.storageSr.get('uuid') || this.device_id;

    let loginPayload = {
      ...users,
      from_switch: 1,
      uuid: systemUuid
    };

    this.authProvider.doLogin(loginPayload).then(async (response) => {
      
      await this.deviceApi.LogInSingleDevice({
         user_no: response.details.user_no,
         device_id: systemUuid
      }).catch(e => {});

      // إخفاء التحميل
      this.authProvider.hideLoading();

      // إبلاغ التطبيق وتحديث القوائم الجانبية
      this.authProvider.publishEvent({ loggedin: true, details: response.details, manual: true });
      this.authProvider.changeUser(true);

      // 🟢 التوجيه الاحترافي المباشر بالأنيميشن
      if (response.details.user_type == '4') {
        this.navCtrl.navigateRoot('/tabs/children', { animated: true, animationDirection: 'forward' });
      } else if (response.details.user_type == '8') {
        this.navCtrl.navigateRoot('/tabs/student-titles', { animated: true, animationDirection: 'forward' });
      } else {
        this.navCtrl.navigateRoot('/tabs', { animated: true, animationDirection: 'forward' });
      }

    }).catch((error) => {
      console.log(error);
      this.authProvider.hideLoading();
      this.dataProvider.showToast(typeof error === 'string' ? error : "فشل تسجيل الدخول");
      this.forceLogout(users);
    });
  }

  forceLogout(user: any) {
    let data = {
      "user_no": user?.user_no,
      "session_id": this.device_id
    };
    this.authProvider.doLogout(data).then((resp) => {
      this.authProvider.hideLoading();
      this.router.navigate(['login'], { replaceUrl: true });
    }).catch((error) => {
      this.authProvider.hideLoading();
      this.router.navigate(['login'], { replaceUrl: true });
    });
  }
}