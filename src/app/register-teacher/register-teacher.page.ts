import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavigationExtras, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { DatabaseService } from '../service/database/database.service';
import { PopoverController, IonicModule } from '@ionic/angular';
import { LoaderComponent } from '../components/loader/loader.component';
import { LoginModel } from '../model/login.model';
import { NavController, Platform } from '@ionic/angular';
import { Device } from '@capacitor/device';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { UserType } from '../constants/user-type';
import { RegistrationApiService } from '../service/registration-api/registration-api.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-register-teacher',
    templateUrl: './register-teacher.page.html',
    styleUrls: ['./register-teacher.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, NgIf, TranslatePipe]
})
export class RegisterTeacherPage implements OnInit {
  teacher: any = {};
  user_no: any;
  school_id: any;
  loggedinUser = <any>[];
  user: LoginModel = <LoginModel>{};
  popOver: any;

  constructor(
    public authProvider: AuthService,
    public dataProvider: DataService,
    private route: ActivatedRoute,
    private router: Router,
    public popoverController: PopoverController,
    public platform: Platform,
    public dbProvider: DatabaseService,
    private storageSr: StorageService, // 🟢 2. حقن الخدمة
    private cdr: ChangeDetectorRef,
    private registrationApi: RegistrationApiService
  ) {
    // 🟢 التقاط البيانات متزامناً
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.user_no = navigation.extras.state['un'];
      this.school_id = navigation.extras.state['id'];
    }
  }

  ngOnInit() {}

  // 🟢 3. جعل الدالة async للتعامل مع الذاكرة بشكل آمن
  async ionViewWillEnter() {
    let earlyLoginData = await this.storageSr.get('earlyLogin');
    if (earlyLoginData) {
      this.loggedinUser = earlyLoginData;
    }

    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      this.user.device_id = (await Device.getId()).identifier;
      if (this.platform.is('android')) {
        this.user.os_type = 1;
      } else {
        this.user.os_type = 2;
      }

      let fcmToken = await this.storageSr.get('FcmToken');
      this.user.registration_id = fcmToken || 'empty_token';
    }
    this.cdr.markForCheck();
  }

  _keyPress(event: any) {
    var charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
    return true;
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
    return this.popOver.present();
  }

  // 🟢 تأمين إغلاق النافذة
  dissmissPopOver() {
    setTimeout(() => {
      if (this.popOver) {
        this.popOver.dismiss().catch(() => {});
        this.popOver = null;
      }
    }, 500);
  }

  async registerTeacher() {
    try {
      const response = await this.dataProvider.run(() =>
        this.registrationApi.registerNewTeacher({
          user_no: this.user_no,
          school_id: this.school_id,
          teacherId: this.teacher.teacherId,
          name: this.teacher.name,
          password: this.teacher.password
        })
      );
      this.dataProvider.showToast(response);

      this.user.email_id = this.teacher.teacherId;
      this.user.password = this.teacher.password;
      this.login(); // تسجيل الدخول مباشرة بعد نجاح التسجيل
    } catch (err) {
      this.dataProvider.errorALertMessage(err);
    }
  }

  // 🟢 4. دالة تسجيل الدخول المحدثة للتخلص من الـ localStorage
  async login() {
    await this.presentPopover();

    this.authProvider
      .doLogin(this.user)
      .then(async response => {
        this.dissmissPopOver();

        let isexist = false;
        let index = -1;

        if (this.loggedinUser.length > 0) {
          for (let i = 0; i < this.loggedinUser.length; i++) {
            if (this.loggedinUser[i].email_id == this.user.email_id) {
              isexist = true;
              index = i;
            }
          }
        }

        let img: any = response.details.is_school_admin == 1 ? response.details.school_logo : response.details.pic;
        let newLoginData = {
          name: response.details.first_name,
          email_id: this.user.email_id,
          password: this.user.password,
          user_no: response.details.user_no,
          image: img
        };

        if (!isexist) {
          this.loggedinUser.push(newLoginData);
        } else {
          this.loggedinUser[index] = newLoginData;
        }

        // حفظ بيانات الدخول السريع بأمان
        await this.storageSr.set('earlyLogin', this.loggedinUser);

        this.authProvider.publishEvent(true);
        this.authProvider.changeUser(true);

        if (response.details.user_type == UserType.Parent) {
          this.router.navigate(['tabs/children'], { replaceUrl: true });
        } else if (response.details.user_type == UserType.Student) {
          this.router.navigate(['tabs/student-notes'], { replaceUrl: true });
        } else {
          this.router.navigate(['tabs'], { replaceUrl: true });
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.dissmissPopOver();
        this.dataProvider.errorALertMessage(error);
        this.cdr.markForCheck();
      });
  }
}
