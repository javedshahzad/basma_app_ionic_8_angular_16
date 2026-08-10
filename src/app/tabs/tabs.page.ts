import { Component, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatabaseService } from '../service/database/database.service';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { Router } from '@angular/router';
// 🟢 1. استيراد خدمة التخزين الجديدة
import { StorageService } from '../service/storage.service';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-tabs',
    templateUrl: './tabs.page.html',
    styleUrls: ['./tabs.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf]
})
export class TabsPage {
  private destroyRef = inject(DestroyRef);
  loggedin: boolean = false;
  activePage: any;
  isParent = false;
  isStudent = false;
  isteacher = false;
  isTM = false;
  user = {
    name: 'Guest',
    description: 'Guest',
    image: './assets/imgs/logo.png',
    userType: 'guest'
  };
  hide_new: any;

  constructor(
    public dbProvider: DatabaseService,
    private authProvider: AuthService,
    public dataProvider: DataService,
    private router: Router,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef
  ) {
    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async res => {
      if (res) {
        await this.dbProvider.openDataBase();
        // 🟢 إضافة مهلة صغيرة جداً لضمان تحديث الـ Storage قبل قراءته
        setTimeout(async () => {
          let userLoggedIn = await this.storageSr.get('userloggedin');
          if (userLoggedIn) {
            this.loggedin = true;
            await this.setUserdetails();
            this.processUserType();
            this.cdr.markForCheck();
          }
        }, 100);
      }
    });

    this.dbProvider.openDataBase().then(async () => {
      let userLoggedIn = await this.storageSr.get('userloggedin');
      if (userLoggedIn) {
        this.loggedin = true;
        await this.setUserdetails();
        this.processUserType();
        this.cdr.markForCheck();
      }
    });
  }

  processUserType() {
    if (this.user.userType == 'parent') {
      this.isParent = true;
      this.isStudent = false;
      this.isTM = false;
      this.isteacher = false;
    } else if (this.user.userType == 'student') {
      this.isStudent = true;
      this.isParent = false;
      this.isTM = false;
      this.isteacher = false;
    } else {
      this.isStudent = false;
      this.isParent = false;
      this.isTM = true;
      this.isteacher = this.user.userType == 'teacher';
    }
    // 🟢 قمنا بحذف التوجيه (Navigate) من هنا لكي لا يتعارض مع التوجيه الصحيح في switch-account
  }

  // 🟢 6. تحديث الدالة لتكون async وبدون localStorage
  async setUserdetails() {
    let userDetail = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة بدون JSON.parse

    if (userDetail && userDetail.details) {
      this.user.name = userDetail.details.first_name + ' ' + userDetail.details.last_name;
      this.user.image = userDetail.details.pic ? userDetail.details.pic : './assets/imgs/default_avatar.png';
      this.user.description = userDetail.details.school_name;

      // 👈 الحفظ الآمن بدلاً من localStorage.setItem
      await this.storageSr.set('user_type', userDetail.details.user_type);

      if (userDetail.details.user_type == '1') {
        if (userDetail.details.school_details != '') {
          this.user.description = userDetail.details.school_details;
        }
        this.user.userType = 'admin';
      } else if (userDetail.details.user_type == '2') {
        this.user.userType = 'teacher';
      } else if (userDetail.details.user_type == '3') {
        this.user.userType = 'moderator';
      } else if (userDetail.details.user_type == '4') {
        this.user.userType = 'parent';
      } else if (userDetail.details.user_type == '7') {
        this.user.userType = 'viewer';
      } else if (userDetail.details.user_type == '8') {
        this.user.userType = 'student';
      }
    }
  }

}
