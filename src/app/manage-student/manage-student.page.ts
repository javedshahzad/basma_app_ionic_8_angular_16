import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { SearchApiService } from '../service/search-api/search-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-manage-student',
    templateUrl: './manage-student.page.html',
    styleUrls: ['./manage-student.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, NgIf, NgFor, TranslatePipe]
})
export class ManageStudentPage {
  trackByIndex(index: number): number {
    return index;
  }
  userdata: any;
  lang: any;
  students = <any>[];
  allStudents = <any>[];
  searchtxt: string = '';
  show_loading = true;
  searchTimeout: any; // 🟢 متغير لإدارة تأخير البحث وحماية السيرفر

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
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private searchApi: SearchApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });

    // 🟢 التقاط حالة تحديث البيانات بأمان عبر الـ Router
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      let isUpdated = navigation.extras.state['isUpdated'];
      if (isUpdated) {
        this.refreshData(); // التحديث الصامت بدون تحميل الشاشة الوهمي
      }
    }
  }


  // 🟢 جلب بيانات المستخدم وبدء العملية بطريقة آمنة تماماً
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userdata = userLoggedIn;
      this.getStudents();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  // 🟢 التحديث الصامت للبيانات بعد العودة من صفحة أخرى
  async refreshData() {
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userdata = userLoggedIn;
      let data = { school_id: this.userdata.details.school_id };

      this.schoolDirectoryApi
        .getSchoolStudents(data)
        .then(res => {
          if (res.data) {
            this.students = res.data;
            if (this.students.length > 20) {
              this.allStudents = this.students.splice(0, 20);
            } else {
              this.allStudents = this.students;
            }
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          console.log(error);
          this.cdr.markForCheck();
        });
    }
  }

  getStudents() {
    let data = {
      school_id: this.userdata.details.school_id
    };

    this.show_loading = true;

    this.schoolDirectoryApi
      .getSchoolStudents(data)
      .then(res => {
        this.show_loading = false;
        if (res && res.data) {
          this.students = res.data;
          if (this.students.length > 20) {
            this.allStudents = this.students.splice(0, 20);
          } else {
            this.allStudents = this.students;
          }
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.show_loading = false;
        this.dataProvider.showToast(error);
        console.log(error);
        this.cdr.markForCheck();
      });
  }

  // 🟢 دالة البحث المحمية بالكامل (Debounce + Two-Way Binding)
  filterList(event: any) {
    let input = this.searchtxt; // نأخذ القيمة المتزامنة من ngModel

    if (!input || input.trim() === '') {
      this.allStudents = [];
      this.getStudents();
      this.cdr.markForCheck();
      return;
    }

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.show_loading = true;

    this.searchTimeout = setTimeout(() => {
      let data = {
        school_id: this.userdata.details.school_id,
        search_str: input.trim()
      };

      this.searchApi
        .serachStudent(data)
        .then(res => {
          this.show_loading = false;
          if (res && res.data && res.data.response) {
            this.students = res.data.response;
            if (this.students.length > 20) {
              this.allStudents = this.students.splice(0, 20);
            } else {
              this.allStudents = this.students;
            }
          } else {
            this.students = [];
            this.allStudents = [];
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.show_loading = false;
          this.dataProvider.showToast(error);
          console.log(error);
          this.cdr.markForCheck();
        });
    }, 500); // 🟢 نؤخر الطلب نصف ثانية لحماية السيرفر
  }

  openStudentDetails(student) {
    // 🟢 هذا السطر مهم جداً للتأكد من المسميات التي تظهر في الكونسول
    console.log('📤 إرسال بيانات الطالب:', student);

    const navigation: NavigationExtras = {
      state: {
        student: student,
        // نرسل أي معرف متاح
        course_id: student.cid || student.class_id || student.course_id || '',
        // نرسل اسم الصف المكتوب في القائمة (ص 10-1 مثلاً)
        course_name: student.class_name || student.course_name || '',
        dateSelected: this.dataProvider.getFormatedDate(new Date()),
        returnPath: 'manage-student'
      }
    };
    this.zone.run(() => {
      this.router.navigate(['edit-student-profile'], navigation);
    });
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      if (this.students && this.students.length > 0) {
        this.allStudents = this.allStudents.concat(this.students.splice(0, 20));
      }
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 500);
  }
}
