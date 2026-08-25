import { Component, NgZone, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

import { GamificationEngineService } from '../service/gamification-engine/gamification-engine.service';
import { StorageService } from '../service/storage.service';
import { UserType } from '../constants/user-type';
import { NgStyle, NgClass } from '@angular/common';
import { PermissionService } from '../service/permission/permission.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';

@Component({
  selector: 'app-children',
  templateUrl: './children.page.html',
  styleUrls: ['./children.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, NgStyle, NgClass, TranslatePipe]
})
export class ChildrenPage {
  trackByIndex(index: number): number {
    return index;
  }
  private destroyRef = inject(DestroyRef);

  /**
   * @member student: Contains information about the student selected
   * @member students Array of all the childern
   * @member showProfileModal Boolean variable used to show hide the profile modal
   * @member userDetails Contains the user details who is logged in from local storage
   * @member noDataFound used for diplaying the message when no child found
   * @member lang Contains the language translation object
   * @member studentBehaviour selected student behaviour
   */
  student: any = {};
  students: any = [];
  showProfileModal: boolean = false;
  userDetails: any = {};
  noDataFound: string;
  lang: any = {};
  studentBehaviour: any = '';
  ispermit = true;
  /**
   *
   * @param navCtrl Use for navigation between pages
   * @param authProvider Use for authentication purpose
   * @param dataProvider Use for getting data from the API
   * @param translate for translation
   * @param app Root app
   */
  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    private router: Router,
    private gamification: GamificationEngineService,
    private route: ActivatedRoute,
    private storageSr: StorageService,
    private permissionService: PermissionService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    public zone: NgZone,
    //  public app: App,
    public translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(resq => {
      this.translate.get('alertmessages').subscribe(res => {
        // console.log(this.lang);
        this.lang = res;
        this.cdr.markForCheck();
      });
    });
    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      // 🟢 حماية: لا تقم بتحديث صفحة الأبناء إلا إذا كان المستخدم الجديد هو ولي أمر فعلاً (user_type == 4)
      if (res.changeUser && this.permissionService.hasRole(UserType.Parent)) {
        this.ionViewWillEnter();
      }
    });
  }

  /**
   * Ionic navigation event will run when page is loaded
   */
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;

      if (this.userDetails.details.user_type != UserType.Parent) {
        return;
      }

      this.students = this.userDetails.details.child || [];

      if (this.students && this.students.length === 0) {
        this.noDataFound = this.lang?.no_student_assigned || 'لا يوجد أبناء مسجلين';
      }

      let payload = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id
      };

      this.schoolDirectoryApi
        .getChildrens(payload)
        .then(async (children: any) => {
          if (children && children.data) {
            const now = new Date(); // الحصول على الوقت الحالي للمقارنة

            // معالجة بيانات الطلاب لإضافة حالة التجميد برمجياً
            this.students = children.data.map((student: any) => {
              // إذا كان هناك تاريخ تجميد وهو أكبر من تاريخ اليوم، إذن الطالب مجمد
              if (student.frozen_until) {
                const freezeDate = new Date(student.frozen_until);
                student.isFrozen = freezeDate > now;
              } else {
                student.isFrozen = false;
              }
              return student;
            });

            this.userDetails.details.child = this.students;
            this.ispermit = children.permit;

            await this.storageSr.set('userloggedin', this.userDetails);
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.errorALertMessage(error);
          this.cdr.markForCheck();
        });
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  /**
   * Open image modal popup
   * @param student Object of student details to show in image popup
   */
  openUserImageModal(student: any) {
    this.student = student;
    if (student.agg_ranking > 0 && student.agg_ranking < 2.6) {
      this.studentBehaviour = this.lang.warning_behaviour;
    } else if (student.agg_ranking > 2.5 && student.agg_ranking < 3.6) {
      this.studentBehaviour = this.lang.good_behaviour;
    } else if (student.agg_ranking > 3.5 && student.agg_ranking < 4.6) {
      this.studentBehaviour = this.lang.very_good_behaviour;
    } else if (student.agg_ranking > 4.5 && student.agg_ranking < 5.1) {
      this.studentBehaviour = this.lang.excellent_behaviour;
    } else {
      this.studentBehaviour = this.lang.no_behaviour;
    }
    this.showProfileModal = true;
  }

  /**
   * Hide image modal popup
   */
  hideUserImageModal(event: any) {
    if (event.target.className == 'custom-modal-main') {
      this.showProfileModal = false;
    }
  }

  /**
   * Open student detail page
   * @param student_id Id of the student you want to see the details
   */
  /**
   * 🟢 فتح تفاصيل الطالب مع تمرير كافة البيانات المطلوبة للسيرفر
   */
  openStudentDetail(student: any) {
    const navigationExtras: NavigationExtras = {
      state: {
        // 1. تمرير sid وهو الأهم لأن دالة getStudentDetails تعتمد عليه مباشرة في الرابط
        sid: student.sid,

        // 2. تمرير student_id كاحتياط في حال كانت دوال أخرى في الصفحة تعتمد عليه
        student_id: student.sid,

        // 3. تمرير course_id فارغ لأن ولي الأمر يعرض كل المواد
        course_id: '',

        // 4. تمرير تاريخ اليوم
        dateSelected: this.dataProvider.getFormatedDate(new Date())
      }
    };

    this.router.navigate(['student-detail'], navigationExtras);
  }

  /**
   * 🟢 دالة جديدة: تجهيز بيانات الطالب وفتح نافذة ملخص الأداء
   */
  openStudentModal(selectedStudent: any) {
    // 1. تعيين الطالب المختار
    this.student = selectedStudent;

    // 2. حساب السلوك بناءً على التقييم (كما كان في الكود الأصلي)
    let ranking = Number(this.student.agg_ranking || 0);

    if (ranking > 0 && ranking < 2.6) {
      this.studentBehaviour = this.lang.warning_behaviour;
    } else if (ranking >= 2.6 && ranking < 3.6) {
      this.studentBehaviour = this.lang.good_behaviour;
    } else if (ranking >= 3.6 && ranking < 4.6) {
      this.studentBehaviour = this.lang.very_good_behaviour;
    } else if (ranking >= 4.6 && ranking <= 5.1) {
      this.studentBehaviour = this.lang.excellent_behaviour;
    } else {
      this.studentBehaviour = this.lang.no_behaviour;
    }

    // 3. إظهار النافذة
    this.showProfileModal = true;
  }

  // 🟢 استدعاء المحرك المركزي لضمان دقة السلوك (نصاً ولوناً)
  // لا حاجة لكتابة الشروط هنا، المحرك يتكفل بالأولوية بين agg_ranking و ranking
  getStudentBehaviourText(student: any): string {
    return this.gamification.getStudentBehaviourText(student, this.lang);
  }

  // 🟢 جلب كلاس اللون الأصلي (text-color) من المحرك لتلوين النص
  getStudentBehaviourColor(student: any): string {
    const engineColor = this.gamification.getBehaviourColorClass(student);
    return engineColor ? engineColor : 'text-slate-400'; // لون رمادي افتراضي
  }

  // 🟢 الدالة المفقودة: جلب اللقب النهائي للطالب (متوافقة مع المحرك المركزي)
  getStudentTitle(student: any): string {
    if (!student) return '🌱 بطل في البداية';

    // 1. استخراج الكود المفعّل من بيانات الطالب
    const activeCode =
      student.active_crafted_title ||
      student.student_data?.active_crafted_title ||
      student.active_title ||
      student.title;

    // 2. تجهيز بيانات المهارات في حال لم يكن هناك لقب مفعل
    const skillsData = {
      cognitive: Number(student.cognitive || 0),
      social: Number(student.social || 0),
      discipline: Number(student.discipline || 0),
      emotional: Number(student.emotional || 0),
      practical: Number(student.practical || 0)
    };

    const points = Number(student.student_points || 0);

    // 3. استدعاء المحرك لترجمة الكود وعرض اللقب (أيقونة + نص)
    return this.gamification.getFinalStudentTitle(activeCode, skillsData, points);
  }
}
