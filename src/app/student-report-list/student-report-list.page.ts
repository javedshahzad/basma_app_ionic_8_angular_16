import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { AttendanceApiService } from '../service/attendance-api/attendance-api.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-student-report-list',
    templateUrl: './student-report-list.page.html',
    styleUrls: ['./student-report-list.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, TranslatePipe]
})
export class StudentReportListPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }

  noDataFound: string = '';
  userType: string;
  attendanceResponse: any = {};
  userDetails: any = {};
  lang: any = {};
  courseInfo: any = {};
  navData: any;

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
    private storageSr: StorageService, // 🟢 2. حقن الخدمة
    private cdr: ChangeDetectorRef,
    private attendanceApi: AttendanceApiService
  ) {
    // 🟢 3. التقاط البيانات الممررة من הـ Router بشكل متزامن قبل ضياعها
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state['course'];
    }

    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
  }

  // 🟢 4. جعل الدالة async لاستخدام التخزين الآمن بدلاً من localStorage
  async ngOnInit() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;

      // 🟢 5. حماية بيانات الـ Router من الضياع عند عمل Refresh للصفحة
      if (this.navData) {
        await this.storageSr.set('reportListCourseData', this.navData);
        this.getStudents();
      } else {
        let savedData = await this.storageSr.get('reportListCourseData');
        if (savedData) {
          this.navData = savedData;
          this.getStudents();
        } else {
          // العودة للخلف إذا لم تتوفر بيانات الفصل تماماً
          this.navCtrl.back();
        }
      }
    } else {
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getStudents(loader: boolean = true) {
    if (loader) this.dataProvider.showLoading();
    let course = this.navData;
    this.courseInfo = course;

    // إرسال تاريخ اليوم بشكل صامت لكي يقبله السيرفر
    let studentData = {
      date: this.dataProvider.getFormatedDate(new Date()),
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      course_id: course.cid,
      school_id: this.userDetails.details.school_id
    };

    this.attendanceApi
      .getClassStudentList(studentData)
      .then(res => {
        if (loader) this.dataProvider.hideLoading();
        if (res.session) {
          res.data.students.forEach(student => {
            student.studentBehaviour = this.getStudentBehaviour(student.agg_ranking);
          });
          this.attendanceResponse = res.data;
        } else {
          if (loader) this.dataProvider.hideLoading();
          this.authProvider.flushLocalStorage();
          this.dataProvider.errorALertMessage(res.message);
          this.router.navigate(['login'], { replaceUrl: true });
        }
        this.cdr.markForCheck();
      })
      .catch(err => {
        if (loader) this.dataProvider.hideLoading();
        console.error(err);
        this.cdr.markForCheck();
      });
  }

  openStudentDetail(student_id: string) {
    let studentData = this.attendanceResponse?.students?.find((s: any) => s.sid === student_id);
    const navigation: NavigationExtras = {
      state: {
        student_id: student_id,
        course_id: this.navData.cid,
        dateSelected: this.dataProvider.getFormatedDate(new Date()),
        student_name: studentData ? studentData.name : '',
        student_pic: studentData ? studentData.pic : '',
        course_name: this.courseInfo ? this.courseInfo.name : ''
      }
    };

    this.zone.run(() => {
      this.router.navigate(['student-report-manage'], navigation);
    });
  }

  getStudentBehaviour(agg_ranking: number) {
    if (agg_ranking > 0 && agg_ranking < 2.6) return this.lang.warning_behaviour;
    else if (agg_ranking > 2.5 && agg_ranking < 3.6) return this.lang.good_behaviour;
    else if (agg_ranking > 3.5 && agg_ranking < 4.6) return this.lang.very_good_behaviour;
    else if (agg_ranking > 4.5 && agg_ranking < 5.1) return this.lang.excellent_behaviour;
    else return this.lang.no_behaviour;
  }
}
