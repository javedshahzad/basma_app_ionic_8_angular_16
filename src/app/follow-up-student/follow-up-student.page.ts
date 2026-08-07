import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, IonicModule } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { FollowupFieldsApiService } from '../service/followup-fields-api/followup-fields-api.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, NavigationExtras } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-follow-up-student',
    templateUrl: './follow-up-student.page.html',
    styleUrls: ['./follow-up-student.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, TranslatePipe]
})
export class FollowUpStudentPage {
  trackByIndex(index: number): number {
    return index;
  }
  classes: Array<any> = [];
  noDataFound: string = '';
  isLoading: boolean = true;
  userType: any;
  lang: any = {};
  userDetails: any = {};

  classBackgroundColor = [
    '#ff7043',
    '#2962ff',
    '#43a047',
    '#6d4c41',
    '#ffab00',
    '#00b0ff',
    '#651fff',
    '#2962ff',
    '#d81b60',
    '#6a1b9a'
  ];

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    private router: Router,
    public zone: NgZone,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private cdr: ChangeDetectorRef,
    private followupFieldsApi: FollowupFieldsApiService
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }


  // 🟢 استدعاء آمن ومتسلسل يضمن جلب بيانات المستخدم أولاً
  async ionViewWillEnter() {
    this.isLoading = true;
    this.classes = [];

    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.getCourse(true); // جلب الفصول
    } else {
      this.isLoading = false;
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getCourse(loader: boolean = true) {
    if (loader) this.isLoading = true;

    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    this.followupFieldsApi
      .getSelectedCourses(data)
      .then(response => {
        if (loader) this.isLoading = false;

        if (response.session) {
          let courses = response.data;
          if (courses && courses.length > 0) {
            let i = 0;
            this.classes = courses || [];
            this.classes.forEach((course: any) => {
              course.backgroundColor = this.classBackgroundColor[i];
              i++;
              if (i == 9) i = 0;
            });
          } else {
            this.classes = [];
            this.noDataFound = this.lang.no_record_found || 'لا توجد فصول متاحة حالياً';
          }
        } else {
          this.router.navigate(['login'], { replaceUrl: true });
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        if (loader) this.isLoading = false;
        console.log('Error fetching courses:', error);
        this.classes = [];
        this.noDataFound = this.lang.no_record_found || 'حدث خطأ في الاتصال';
        this.cdr.markForCheck();
      });
  }

  doRefresh(event: any) {
    this.getCourse(false);
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  openClassStudents(course: any) {
    const navigation: NavigationExtras = {
      state: { course: course }
    };
    this.zone.run(() => {
      this.router.navigate(['followup-student-list'], navigation);
    });
  }

  // 🟢 استرجاع دالة الإضافة التي سقطت
  createClass() {
    this.router.navigate(['add-class']);
  }
}
