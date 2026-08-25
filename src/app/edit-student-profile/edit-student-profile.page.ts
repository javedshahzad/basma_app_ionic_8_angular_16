import { Component, NgZone, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {
  PopoverController,
  AlertController,
  NavController,
  Platform,
  MenuController,
  IonicModule
} from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DatabaseService } from '../service/database/database.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { DataService } from './../service/data/data.service';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { CoursesApiService, Course } from '../service/courses-api/courses-api.service';

import { FormsModule } from '@angular/forms';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';
import { Student } from '../model/student.model';

type EditableCourse = Course & { course_id?: string | number; id?: string | number };

interface EditStudentNavData {
  course_id?: string | number;
  course_name?: string;
  dateSelected?: string;
  student?: {
    sid?: string | number;
    cid?: string | number;
    class_id?: string | number;
    class_name?: string;
  };
}

@Component({
  selector: 'app-edit-student-profile',
  templateUrl: './edit-student-profile.page.html',
  styleUrls: ['./edit-student-profile.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, TranslatePipe]
})
export class EditStudentProfilePage {
  trackByIndex(index: number): number {
    return index;
  }
  student: Student = {};
  classes: EditableCourse[] = [];
  loggedinUser: LoggedInUser;
  userDetails: LoggedInUser = { details: {} }; // 🟢 تهيئة آمنة لحماية الـ HTML
  currentUser: LoggedInUser;
  studentName: string = '';
  studentSemester: string = '';
  navData: EditStudentNavData;
  student_id: string | number = '';
  lang: Record<string, string>;
  currentUserEmail: string;
  showDeleteModal: boolean = false;

  isDataReady: boolean = false; // 🟢 متغير جديد للتحكم بظهور القائمة

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after
  // ionViewWillEnter()'s `if (userLoggedIn)` guard has already populated
  // it — the non-null assertion documents that invariant once instead of
  // at every access site.
  get userInfo(): UserDetails {
    return this.userDetails.details!;
  }

  constructor(
    public popoverController: PopoverController,
    public navCtrl: NavController,
    public authProvider: AuthService,
    public platform: Platform,
    private alertCtrl: AlertController,
    public translate: TranslateService,
    private dataProvider: DataService,
    private route: ActivatedRoute,
    public zone: NgZone,
    private router: Router,
    public menuCtrl: MenuController,
    public dbProvider: DatabaseService,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private userManagementApi: UserManagementApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private coursesApi: CoursesApiService
  ) {
    this.translate.get('alertmessages').subscribe(val => {
      this.lang = val;
      this.cdr.markForCheck();
    });

    // 🟢 3. صيد البيانات المرسلة فوراً في المشيد لحمايتها من الضياع
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state;
      this.storageSr.set('editStudentProfileContext', this.navData);
    }
  }

  // 🟢 4. دورة حياة الصفحة الآمنة والمتسلسلة (تمنع الاستباق)
  async ionViewWillEnter() {
    this.menuCtrl.swipeGesture(false);
    this.isDataReady = false; // 🟢 نخفي القائمة في البداية
    this.dataProvider.showLoading();

    if (!this.navData) {
      this.navData = await this.storageSr.get('editStudentProfileContext');
    }

    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      // نجلب الصفوف أولاً
      await this.getClasses();
      // ثم نجلب بيانات الطالب ونحدد صفه
      await this.getStudentProfile();
    }

    // 🟢 السحر هنا: بعد أن جهزت كل البيانات، نسمح للقائمة بالظهور!
    this.isDataReady = true;
    this.dataProvider.hideLoading();
    this.cdr.markForCheck();
  }

  ionViewWillLeave() {
    this.menuCtrl.swipeGesture(true);
  }

  closeModal() {
    this.popoverController.dismiss();
  }

  getClasses() {
    return new Promise(resolve => {
      let data = {
        user_no: this.userInfo.user_no!,
        school_id: this.userInfo.school_id!,
        session_id: this.userDetails.session_id!
      };

      this.coursesApi
        .getCourses(data)
        .then(response => {
          if (response && response.session) {
            this.classes = (response.data || []).map(c => {
              const course = c as EditableCourse;
              // نضمن أن جميع المعرفات مخزنة كنصوص للمطابقة السهلة
              return { ...course, cid: String(course.cid || course.course_id || course.id) };
            });
          }
          resolve(true);
        })
        .catch(() => resolve(false));
    });
  }

  getStudentProfile() {
    return new Promise(resolve => {
      let data = {
        user_no: this.userInfo.user_no!,
        session_id: this.userDetails.session_id!,
        cid: this.navData?.course_id || this.navData?.student?.cid || '',
        date: this.navData?.dateSelected || this.dataProvider.getFormatedDate(new Date()),
        sid: this.navData?.student?.sid
      };

      this.schoolDirectoryApi
        .getStudentDetails(data)
        .then(response => {
          if (response && response.session) {
            this.student = response.data || {};
            this.studentName = this.student.name || '';
            this.student_id = this.student.student_id || '';

            console.log('----------------- بدء عملية المطابقة -----------------');
            console.log('1️⃣ بيانات navData كاملة:', this.navData);
            console.log('2️⃣ اسم الصف في navData هو:', this.navData?.student?.class_name);

            let rawId = this.student.cid || this.student.course_id;

            if (!rawId || rawId === 'undefined' || rawId === '') {
              rawId = this.navData?.course_id || this.navData?.student?.cid || this.navData?.student?.class_id;
            }

            if (!rawId || rawId === 'undefined' || rawId === '') {
              let targetName = (
                this.navData?.course_name ||
                this.navData?.student?.class_name ||
                this.student?.course_name ||
                ''
              )
                .toString()
                .trim();
              console.log('3️⃣ الاسم الذي يبحث عنه الكود (targetName):', targetName ? `'${targetName}'` : 'فارغ!');
              console.log(
                '4️⃣ أسماء الصفوف المتاحة للبحث:',
                this.classes.map(c => `'${c.name}'`)
              );

              if (targetName) {
                let matched = this.classes.find(c => (c.name || '').toString().trim() === targetName);
                if (matched) {
                  rawId = matched.cid;
                  console.log('✅ نجحت المطابقة عبر الاسم! المعرف هو:', rawId);
                } else {
                  console.log('❌ لم يتطابق الاسم مع أي صف في القائمة!');
                }
              }
            }

            if (rawId) {
              this.studentSemester = String(rawId);
              setTimeout(() => {
                this.cdr.detectChanges();
              }, 200);
            } else {
              console.error('❌ فشل العثور على أي رقم أو اسم للصف في جميع المحطات!');
            }
            console.log('----------------- انتهاء عملية المطابقة -----------------');
          }
          resolve(true);
        })
        .catch(() => resolve(false));
    });
  }

  async saveChanges() {
    let updateData = {
      sid: this.student.sid,
      cid: this.studentSemester, // 🟢 إرسال قيمة القائمة المنسدلة الجديدة
      class_id: this.studentSemester, // 🟢 التأكيد على إرسالها بكلا المسميين
      student_name: this.studentName,
      student_id: this.student_id,
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };

    try {
      const res = await this.dataProvider.run(() => this.userManagementApi.updateStudentProfile(updateData));
      if (!res.response) {
        this.dataProvider.errorALertMessage(res.msg || '');
      } else {
        this.dataProvider.showToast(this.lang.edit_student_success_msg);
        const navigation: NavigationExtras = {
          state: { isUpdated: true }
        };
        this.zone.run(() => {
          this.router.navigate(['manage-student'], navigation);
        });
      }
    } catch (error: unknown) {
      this.dataProvider.errorALertMessage((error as { message?: string })?.message || this.lang.usnexpectedError);
    }
  }

  deleteStudent() {
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }

  async confirmDelete() {
    this.showDeleteModal = false;
    let deleteData = {
      sid: this.student.sid,
      cid: this.student.cid,
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };

    try {
      const res = await this.dataProvider.run(() => this.userManagementApi.deleteStudent(deleteData));
      this.dataProvider.showToast(res.msg || '');
      const navigation: NavigationExtras = {
        state: { isUpdated: true }
      };
      this.zone.run(() => {
        this.router.navigate(['manage-student'], navigation);
      });
    } catch (error: unknown) {
      this.dataProvider.errorALertMessage((error as { message?: string })?.message || this.lang.usnexpectedError);
    }
  }

  async deleteClass() {
    let deleteData = {
      sid: this.student.sid,
      cid: this.student.cid,
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };

    try {
      const res = await this.dataProvider.run(() => this.userManagementApi.deleteStudentClass(deleteData));
      this.dataProvider.showToast(res.msg || '');
      this.router.navigate(['manage-student']);
    } catch (error: unknown) {
      this.dataProvider.errorALertMessage((error as { message?: string })?.message || this.lang.usnexpectedError);
    }
  }

  // 🟢 دالة ذكية لمقارنة القيم بغض النظر عما إذا كانت نصاً أم رقماً
  compareClasses(o1: unknown, o2: unknown) {
    if (o1 == null || o2 == null) return o1 === o2;
    return String(o1) === String(o2);
  }
}
