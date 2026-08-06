import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NavController, AlertController, PopoverController, ModalController, ActionSheetController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { AbsentApplicationApiService } from '../service/absent-application-api/absent-application-api.service';
import { StorageService } from '../service/storage.service';
import { UserType } from '../constants/user-type';
import { IonicSelectableComponent } from 'ionic-selectable';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-absent-students',
    templateUrl: './absent-students.page.html',
    styleUrls: ['./absent-students.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, IonicSelectableComponent, DatePipe, TranslatePipe]
})
export class AbsentStudentsPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;
  classes = [];
  userDetails: any;
  search_payload: any = {
    start_date: new Date()
  };

  showCalenderModal: boolean = false;
  showFilterModal: boolean = false;
  // متغير جديد للتقويم فقط لمنع مشاكل القفز بين الأشهر
  calendarDate: string = '';

  // 🔴 التعديل الأول: تغيير مسميات الحصص لتظهر بالعربية في قائمة الفلترة
  // لاحظ أننا لم نغير الـ id البرمجي لضمان عمل الفلتر مع السيرفر بشكل سليم
  seminars = [
    { id: 1, name: 'الحصة 1' },
    { id: 2, name: 'الحصة 2' },
    { id: 3, name: 'الحصة 3' },
    { id: 4, name: 'الحصة 4' },
    { id: 5, name: 'الحصة 5' },
    { id: 6, name: 'الحصة 6' },
    { id: 7, name: 'الحصة 7' },
    { id: 8, name: 'الحصة 8' }
  ];

  StudentsList = [];
  ResponseData: any;
  AttendanceDataList = [];

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    public popoverController: PopoverController,
    private router: Router,
    private datepipe: DatePipe,
    public modalCtrl: ModalController,
    public actionSheet: ActionSheetController,
    private absentApplicationApi: AbsentApplicationApiService,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // 🌟 تعديل 2: توليد التاريخ المحلي الصافي بصيغة YYYY-MM-DD لمنع مشكلة قفز الأشهر
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // الصيغة النقية: مثلاً "2026-04-03" (بدون حرف Z الخاص بتوقيت جرينتش)
    this.calendarDate = `${year}-${month}-${day}`;
    this.search_payload.start_date = this.calendarDate;

    this.userDetails = await this.storageSr.get('userloggedin');
    if (this.userDetails) {
      this.getCourse();
      this.OnFilterData();
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getCourse() {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };
    this.dataProvider
      .getCourses(data)
      .then(response => {
        let courses = response.data;
        if (courses && courses.length > 0) {
          this.classes = courses;
        } else {
          this.classes = [];
        }
        this.cdr.markForCheck();
      })
      .catch(error => {});
  }

  getStudentsListByCourseId(cid) {
    let studentData = {
      date: this.dataProvider.getFormatedDate(new Date()),
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      course_id: cid,
      school_id: this.userDetails.details.school_id
    };
    this.dataProvider
      .getClassStudentList(studentData)
      .then(response => {
        this.StudentsList = response.data.students;
        this.cdr.markForCheck();
      })
      .catch(error => {});
  }

  onChangeClass(event: any) {
    // التأكد من وجود قيمة (لتفادي الأخطاء إذا قام المستخدم بإلغاء التحديد)
    const selectedClass = event.value || [];

    // استخدام دالة map لاختصار الكود في سطر واحد
    this.search_payload.class_id = selectedClass.map((element: any) => element.cid);
  }

  onChangeStudent(event) {
    var selectedStudent = event.value;
    this.search_payload.studentid = selectedStudent.sid;
  }

  onChangeSeminar(event: any) {
    const selectedSeminar = event.value || [];
    this.search_payload.semno = selectedSeminar.map((element: any) => element.id);
  }

  openFilterModal() {
    this.showFilterModal = true;
  }

  closeFilterModal() {
    this.showFilterModal = false;
  }

  OnFilterData() {
    this.getAbsentStudentsList();
    this.showFilterModal = false;
  }

  openCalenderModal() {
    this.showCalenderModal = true;
  }

  onDaySelect(event: any) {
    if (event && event.detail && event.detail.value) {
      let selectedDate = event.detail.value;

      // تحديث المتغيرات (مع قص أي توقيت قد يرفقه التقويم احتياطياً)
      this.calendarDate = selectedDate;
      this.search_payload.start_date = selectedDate.split('T')[0];

      this.hideCalenderModal();
    }
  }

  hideCalenderModal() {
    this.showCalenderModal = false;
  }

  async getAbsentStudentsList() {
    if (this.userDetails) {
      let data = this.search_payload;
      data.end_date = data.start_date;
      data.school_id = this.userDetails.details.school_id;
      try {
        const res = await this.dataProvider.run(() => this.absentApplicationApi.GetAbsentStudents(data));
        if (res.success) {
          this.ResponseData = res.data;
          this.AttendanceDataList = this.ResponseData.attendance;
        } else {
          this.AttendanceDataList = [];
        }
      } catch (error) {
        this.dataProvider.showToast('error');
      }
      this.cdr.markForCheck();
    }
  }

  // 🔴 التعديل الثاني: معالجة نصوص الحصص قبل عرضها في واجهة البطاقات
  getSemsFromList(sid) {
    let processedSems: string[] = [];

    // استخدام (?.) للحماية من الانهيار
    const objectOne = this.ResponseData?.students_seminars_absents?.[sid];

    // إذا لم تكن البيانات موجودة، أعد مصفوفة فارغة فوراً ولا تكمل الكود
    if (!objectOne || !objectOne.days) return processedSems;

    const values = Object.values(objectOne.days);

    values.forEach((val: any) => {
      let strVal = String(val);
      let splitVals = strVal.split(',');

      splitVals.forEach(part => {
        let cleanPart = part.trim();
        if (cleanPart.toLowerCase().includes('sem')) {
          processedSems.push(cleanPart.replace(/sem(inar)?\s*-\s*/gi, 'الحصة '));
        } else if (!isNaN(Number(cleanPart)) && cleanPart !== '') {
          processedSems.push('الحصة ' + cleanPart);
        } else {
          processedSems.push(cleanPart);
        }
      });
    });

    return processedSems;
  }

  getDatesFromList(sid: any): string[] {
    // 1. قراءة البيانات بأمان باستخدام (?.) لمنع الانهيار
    const objectOne = this.ResponseData?.students_seminars_absents?.[sid];

    // 2. إذا كانت الأيام موجودة، أعد المفاتيح، وإلا أعد مصفوفة فارغة
    return objectOne?.days ? Object.keys(objectOne.days) : [];
  }

  submitApplication(sid: any, data: any) {
    const objectOne = this.ResponseData?.students_seminars_absents?.[sid];

    // التأكد من وجود البيانات قبل الانتقال للصفحة التالية
    if (objectOne && objectOne.days) {
      const keys = Object.keys(objectOne.days);
      const values = Object.values(objectOne.days);

      const navigation: NavigationExtras = {
        state: { user: data, absentDates: keys, absentSeminars: values }
      };
      this.router.navigate(['submit-absent-application'], navigation);
    }
  }

  GotoAllApplications() {
    this.router.navigate(['all-application-list']);
  }
}
