import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { SearchApiService } from '../service/search-api/search-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-search-student',
    templateUrl: './search-student.page.html',
    styleUrls: ['./search-student.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, NgIf, NgFor, TranslatePipe]
})
export class SearchStudentPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  userdata: any;
  lang: any;
  students = <any>[];
  allStudents = <any>[];
  searchtxt: string = '';
  searchTimeout: any; // 🟢 لحماية السيرفر من ضغط طلبات البحث المتتالية

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    public platform: Platform,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private searchApi: SearchApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {
    // 🟢 3. التقاط البيانات متزامناً وبشكل مباشر من الـ Router لمنع الخطأ
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.userdata = navigation.extras.state['userDetails'];
      console.log('Received userdata:', this.userdata);
    }

    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
  }

  // 🟢 4. تأمين القراءة والحفظ عبر الـ Storage بدلاً من فقدانها عند التحديث
  async ngOnInit() {
    if (this.userdata && this.userdata.school_id) {
      // حفظ بيانات المدرسة للمستقبل
      await this.storageSr.set('searchStudentContext', this.userdata);
    } else {
      // محاولة استرجاعها إذا تم عمل تحديث للصفحة
      let savedData = await this.storageSr.get('searchStudentContext');
      if (savedData) {
        this.userdata = savedData;
      } else {
        // العودة للخلف إذا فشل إيجاد البيانات
        this.navCtrl.back();
        this.cdr.markForCheck();
        return;
      }
    }
    this.cdr.markForCheck();
  }

  async getStudents() {
    let data = {
      school_id: this.userdata.school_id
    };

    try {
      const res = await this.dataProvider.run(() => this.schoolDirectoryApi.getSchoolStudents(data));
      if (res && res.data) {
        this.students = res.data;
        if (this.students.length > 20) {
          this.allStudents = this.students.splice(0, 20);
        } else {
          this.allStudents = this.students;
        }
      }
    } catch (error) {
      this.dataProvider.showToast(error instanceof Error ? error.message : String(error));
      console.log(error);
    }
    this.cdr.markForCheck();
  }

  // 🟢 5. دالة البحث المحدثة والآمنة (مزودة بـ Debounce لمنع انهيار السيرفر)
  filterList(event: any) {
    let input = event.target.value;
    this.searchtxt = input;

    // إذا تم تفريغ الحقل، نمسح النتائج فوراً
    if (!input || input.trim() === '') {
      this.students = [];
      this.allStudents = [];
      this.cdr.markForCheck();
      return;
    }

    // تأخير إرسال الطلب للسيرفر حتى يتوقف المستخدم عن الطباعة (Debounce)
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      let data = {
        school_id: this.userdata.school_id,
        search_str: input.trim()
      };

      this.searchApi
        .serachStudent(data)
        .then(res => {
          if (res && res.data && res.data.response) {
            this.students = res.data.response;
            if (this.students.length > 20) {
              this.allStudents = this.students.splice(0, 20);
            } else {
              this.allStudents = this.students;
            }
          } else {
            // تفريغ القائمة إذا لم توجد نتائج
            this.students = [];
            this.allStudents = [];
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.showToast(error);
          console.log(error);
          this.cdr.markForCheck();
        });
    }, 500); // ينتظر نصف ثانية بعد آخر حرف يكتبه المستخدم
  }

  openStudentDetails(student: any) {
    const navigation: NavigationExtras = {
      state: {
        student_id: student.sid,
        course_id: student.cid,
        dateSelected: this.dataProvider.getFormatedDate(new Date())
      }
    };

    this.zone.run(() => {
      this.router.navigate(['student-detail'], navigation);
    });
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      // 🟢 تأمين إضافة الطلاب دون أخطاء
      if (this.students && this.students.length > 0) {
        this.allStudents = this.allStudents.concat(this.students.splice(0, 20));
      }
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 500);
  }
}
