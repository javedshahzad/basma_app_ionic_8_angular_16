import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-search-student',
  templateUrl: './search-student.page.html',
  styleUrls: ['./search-student.page.scss'],
})
export class SearchStudentPage implements OnInit {
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
    public network: Network,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    public platform: Platform,
    private storageSr: StorageService // 🟢 2. حقن خدمة التخزين
  ) {
    
    // 🟢 3. التقاط البيانات متزامناً وبشكل مباشر من الـ Router لمنع الخطأ
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.userdata = navigation.extras.state['userDetails'];
      console.log('Received userdata:', this.userdata);
    }

    this.translate.get("alertmessages").subscribe((response) => {
      this.lang = response;
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
        return;
      }
    }
  }

  getStudents() {
    let data = {
      'school_id': this.userdata.school_id
    };
    
    this.dataProvider.showLoading();
    
    this.dataProvider.getSchoolStudents(data).then(res => {
      this.dataProvider.hideLoading();
      
      if (res && res.data) {
        this.students = res.data;
        if (this.students.length > 20) {
          this.allStudents = this.students.splice(0, 20);
        } else {
          this.allStudents = this.students;
        }
      }
    }).catch(error => {
      this.dataProvider.hideLoading();
      this.dataProvider.showToast(error);
      console.log(error);
    });
  }

  // 🟢 5. دالة البحث المحدثة والآمنة (مزودة بـ Debounce لمنع انهيار السيرفر)
  filterList(event: any) {
    let input = event.target.value;
    this.searchtxt = input;

    // إذا تم تفريغ الحقل، نمسح النتائج فوراً
    if (!input || input.trim() === '') {
      this.students = [];
      this.allStudents = [];
      return;
    }

    // تأخير إرسال الطلب للسيرفر حتى يتوقف المستخدم عن الطباعة (Debounce)
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      let data = {
        'school_id': this.userdata.school_id,
        'search_str': input.trim()
      };
      
      this.dataProvider.serachStudent(data).then(res => {
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
      }).catch(error => {
        this.dataProvider.showToast(error);
        console.log(error);
      });
    }, 500); // ينتظر نصف ثانية بعد آخر حرف يكتبه المستخدم
  }

  openStudentDetails(student) {
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
    }, 500);
  }
}