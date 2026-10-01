import { Component, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatabaseService } from '../service/database/database.service';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { Router } from '@angular/router';
// 🟢 1. استيراد خدمة التخزين الجديدة
import { StorageService } from '../service/storage.service';

import { PermissionService } from '../service/permission/permission.service';
import { UserType } from '../constants/user-type';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule]
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
    image: './assets/imgs/logo.png'
  };
  hide_new: any;

  constructor(
    public dbProvider: DatabaseService,
    private authProvider: AuthService,
    public dataProvider: DataService,
    private router: Router,
    private storageSr: StorageService,
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef
  ) {
    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async res => {
      if (res) {
        await this.dbProvider.tryOpenDataBase();
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

    this.dbProvider.tryOpenDataBase().then(async () => {
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
    this.isParent = this.permissionService.hasRole(UserType.Parent);
    this.isStudent = this.permissionService.hasRole(UserType.Student);
    this.isteacher = this.permissionService.hasRole(UserType.Teacher);
    this.isTM = !this.isParent && !this.isStudent;
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

      if (userDetail.details.user_type == UserType.Admin && userDetail.details.school_details != '') {
        this.user.description = userDetail.details.school_details;
      }
    }
  }
}
