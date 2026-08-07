import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, IonicModule } from '@ionic/angular';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, NavigationExtras } from '@angular/router';
import { DataService } from '../service/data/data.service';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { FollowupFieldsApiService } from '../service/followup-fields-api/followup-fields-api.service';
import { NgIf, NgFor, NgClass } from '@angular/common';

@Component({
    selector: 'app-add-class',
    templateUrl: './add-class.page.html',
    styleUrls: ['./add-class.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, NgClass, TranslatePipe]
})
export class AddClassPage {
  trackByIndex(index: number): number {
    return index;
  }
  userDetails: any = { details: {} };
  lang: any = {};
  classes: any = [];
  changedData: any[] = []; // تصحيح إملائي من chnagedData

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private router: Router,
    public zone: NgZone,
    public platform: Platform,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private followupFieldsApi: FollowupFieldsApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
  }


  // 🟢 جلب البيانات بأمان باستخدام async/await بدلاً من ngOnInit
  async ionViewWillEnter() {
    this.changedData = []; // تصفير الاختيارات السابقة
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;
      this.getClasses();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  async getClasses() {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    try {
      const res: any = await this.dataProvider.run(() => this.followupFieldsApi.getTeachersClass(data));
      if (res && res.data) {
        this.classes = res.data;
      }
    } catch (error) {
      this.dataProvider.showToast(this.lang.usnexpectedError || 'حدث خطأ غير متوقع');
      console.log(error);
    }
    this.cdr.markForCheck();
  }

  changeClass(course: any, eve: any) {
    let selectedCourse = {
      cid: course.courses.cid,
      status: eve.detail.checked
    };

    // تبسيط منطق البحث والحذف/الإضافة
    let ind = this.changedData.findIndex(item => item.cid === selectedCourse.cid);

    if (ind > -1) {
      this.changedData.splice(ind, 1); // إزالته إذا تم الضغط عليه مرة أخرى (إلغاء التعديل)
    } else {
      this.changedData.push(selectedCourse); // إضافته كمعدل
    }
  }

  setClasses() {
    if (this.changedData.length === 0) return;

    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id,
      updates: this.changedData
    };

    this.dataProvider
      .run(() => this.followupFieldsApi.setTeachersClass(data))
      .then(res => {
        this.dataProvider.showToast(this.lang.class_added || 'تم حفظ الفصول بنجاح');

        const navigation: NavigationExtras = {
          state: { isUpdated: true }
        };

        this.zone.run(() => {
          this.router.navigate(['tabs/follow-up-student'], navigation);
        });
      })
      .catch(error => {
        this.dataProvider.showToast(this.lang.usnexpectedError || 'حدث خطأ أثناء الحفظ');
        console.log(error);
      });
  }
}
