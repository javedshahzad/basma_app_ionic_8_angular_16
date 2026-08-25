import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { DatabaseService } from '../service/database/database.service';
import { PopoverController, IonicModule } from '@ionic/angular';
import { LoaderComponent } from '../components/loader/loader.component';
import { LoginModel } from '../model/login.model';
import { NavController, Platform } from '@ionic/angular';
import { Device } from '@capacitor/device';

// 🟢 استيراد خدمة التخزين الموحدة
import { StorageService } from '../service/storage.service';
import { UserType } from '../constants/user-type';
import { RegistrationApiService } from '../service/registration-api/registration-api.service';
import { FormsModule } from '@angular/forms';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-parent-register',
  templateUrl: './parent-register.page.html',
  styleUrls: ['./parent-register.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, TranslatePipe]
})
export class ParentRegisterPage {
  parent: any = {};
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
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
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

  _keyPress(event: any) {
    var charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
    return true;
  }

  // 🟢 جعل الدالة async للتعامل مع الذاكرة بشكل آمن
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

  dissmissPopOver() {
    setTimeout(() => {
      if (this.popOver) {
        this.popOver.dismiss().catch(() => {});
        this.popOver = null;
      }
    }, 500);
  }

  async registerparent() {
    try {
      const response = await this.dataProvider.run(() =>
        this.registrationApi.registerNewParent({
          user_no: this.user_no,
          school_id: this.school_id,
          parentId: this.parent.parentId,
          parentName: this.parent.name,
          studentId: this.parent.studentId,
          password: this.parent.password
        })
      );
      this.dataProvider.showToast(response);

      this.user.email_id = this.parent.parentId;
      this.user.password = this.parent.password;
      this.login(); // تسجيل الدخول مباشرة بعد نجاح التسجيل
    } catch (err) {
      this.dataProvider.errorALertMessage(err instanceof Error ? err.message : String(err));
    }
  }

  // 🟢 دالة تسجيل الدخول المحدثة والآمنة
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
