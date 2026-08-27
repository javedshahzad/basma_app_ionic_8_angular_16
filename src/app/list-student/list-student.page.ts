import { Component, NgZone, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavController,
  AlertController,
  Platform,
  ModalController,
  ActionSheetController,
  MenuController,
  PopoverController,
  IonicModule
} from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Network } from '@capacitor/network';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';

import { FileUploadService } from '../service/file-upload/file-upload.service';
import { ImageProcessingService } from '../service/image-processing/image-processing.service';
import { StudentUiService } from '../service/student-ui/student-ui.service';
import { AttendanceManagerService } from '../service/attendance-manager/attendance-manager.service';
import { GamificationEngineService } from '../service/gamification-engine/gamification-engine.service';

// 🟢 استيراد خدمة التخزين الموحدة
import { StorageService } from '../service/storage.service';
import { AttendanceApiService, AttendanceSubmitPayload } from '../service/attendance-api/attendance-api.service';
import { HolidaysApiService } from '../service/holidays-api/holidays-api.service';
import { StudentEngagementService } from '../service/student-engagement/student-engagement.service';
import { GamificationApiService } from '../service/gamification-api/gamification-api.service';
import { FollowupFieldsApiService } from '../service/followup-fields-api/followup-fields-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { RegistrationApiService } from '../service/registration-api/registration-api.service';
import {
  AbsentApplicationApiService,
  AbsentApplication
} from '../service/absent-application-api/absent-application-api.service';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupervisorViewComponent } from '../components/supervisor-view/supervisor-view.component';
import { TeacherViewComponent } from '../components/teacher-view/teacher-view.component';
import { ErrorStateComponent } from '../components/error-state/error-state.component';
import { Student } from '../model/student.model';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';
import { AttendanceResponse } from '../model/attendance-response.model';
import { UserPlan } from '../service/plan-api/plan-api.service';
import { Course } from '../service/courses-api/courses-api.service';

export enum UserRole {
  Admin = '1',
  Teacher = '2',
  Moderator = '3',
  Parent = '4',
  Viewer = '7',
  Student = '8'
}

export enum AttendanceStatus {
  Absent = '0',
  Present = '1',
  Delayed = '3',
  Undefined = 'undefined'
}

export enum TeacherTypeEnum {
  Regular = 'regular',
  Split = 'split'
}

interface TeacherEditPowersResponse {
  teacher_type?: TeacherTypeEnum;
  editPermission?: boolean;
  isSubmitted?: boolean;
  allotedtime?: number;
  time_diffrence?: number;
}

@Component({
  selector: 'app-list-student',
  templateUrl: './list-student.page.html',
  styleUrls: ['./list-student.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, NgClass, FormsModule, SupervisorViewComponent, TeacherViewComponent, ErrorStateComponent, DatePipe, TranslatePipe]
})
export class ListStudentPage {
  trackByIndex(index: number): number {
    return index;
  }
  private destroyRef = inject(DestroyRef);

  showCalenderModal: boolean = false;
  dateSelected: Date;
  noDataFound: string = '';
  totalSem: number = 7;
  student: Student = {};
  canEdit: boolean = false;
  userRole: UserRole;
  attendanceResponse: AttendanceResponse = {};
  userDetails: LoggedInUser = {};
  timeLeft: number;
  attMarkBegin: boolean = false;
  selectedSem: number = -1;
  lang: Record<string, string> = {};
  students: Student[] = [];
  attendanceSheet: Record<string, Record<string, string>> = {};
  removeSheet: Record<string, { sid: string | number; sem: number }> = {};
  attMarked: boolean = false;
  editMode: boolean = false;
  currentEvents: unknown[] = [];
  holidayString: string = '';
  lastSemAtt: number;
  isHoliday: boolean = false;
  courseInfo: Course = {};
  navData: Record<string, unknown>;
  showAll = true;
  totalSemArray: unknown[] = [];
  classAll = ['', '', '', '', '', '', '', ''];
  options = {
    canBackwardsSelected: true,
    from: 1,
    to: 0,
    disableWeeks: <unknown[]>[],
    daysConfig: <unknown[]>[]
  };
  canAddStudent: boolean = false;
  canAddStudentNote: boolean = true;
  planLang: Record<string, string>;
  show_loading: boolean = false;
  attendanceLoadFailed: boolean = false;
  student_detailse: Record<string, string>;
  student_points: number[] = [];
  interval: ReturnType<typeof setInterval> | null = null;
  AvailablePlan: UserPlan;

  totalRemaining: number = 0;
  totalPresent: number = 0;
  totalAbsent: number = 0;
  isTeacher: boolean = false;
  currentActivePeriod: number = 1;
  allPeriodsMarked: boolean = false;
  lockedPeriods: number[] = [];
  teacherType: TeacherTypeEnum = TeacherTypeEnum.Regular;

  addStudentLang: Record<string, string> = {};
  newStudentName: string = '';
  newStudentId: string = '';

  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  // 🟢 النوافذ المنبثقة (Popups)
  showWarningPopup: boolean = false;
  warningMessage: string = '';
  warningType: 'frozen' | 'warning' = 'warning';

  // 🟢 خرائط طلبات تحويل الغياب المعتمدة، مفتاحها `sid-period` — تُستخدم
  // لتمييز خلايا الحضور الناتجة عن قبول طلب تحويل غياب عن الحضور العادي
  acceptedApplicationsBySeminar: Map<string, AbsentApplication[]> = new Map();

  // 🟢 اختصارات الصلاحيات (Getters)
  get isAdmin(): boolean {
    return this.userRole === UserRole.Admin;
  }
  get isTeacherUser(): boolean {
    return this.userRole === UserRole.Teacher;
  }
  get isModerator(): boolean {
    return this.userRole === UserRole.Moderator;
  }
  get isViewer(): boolean {
    return this.userRole === UserRole.Viewer;
  }
  get userType(): string {
    return this.userRole as string;
  }
  get isRestrictedModerator(): boolean {
    return this.isModerator && !this.canEdit;
  }
  get isModeratorWithEdit(): boolean {
    return this.isModerator && this.canEdit;
  }
  get canAddStudentRole(): boolean {
    return this.isAdmin || this.canAddStudent;
  }

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after
  // onInitPage()'s `if (userLoggedIn)` guard has already populated it —
  // the non-null assertion documents that invariant once instead of at
  // 27 separate access sites.
  get userInfo(): UserDetails {
    return this.userDetails.details!;
  }

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    private printer: Printer,
    public modalController: ModalController,
    public actionSheetController: ActionSheetController,
    public platform: Platform,
    private cdr: ChangeDetectorRef,
    public menuCtrl: MenuController,
    private imageService: ImageProcessingService,
    private studentUi: StudentUiService,
    private attendanceManager: AttendanceManagerService,
    public gamification: GamificationEngineService,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private attendanceApi: AttendanceApiService,
    private holidaysApi: HolidaysApiService,
    private studentEngagement: StudentEngagementService,
    private gamificationApi: GamificationApiService,
    private followupFieldsApi: FollowupFieldsApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private registrationApi: RegistrationApiService,
    private absentApplicationApi: AbsentApplicationApiService
  ) {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.navData = navigation.extras.state['course'];
      }
      this.cdr.markForCheck();
    });

    this.dateSelected = new Date();

    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.translate.get('plan').subscribe(val => {
      this.planLang = val;
      this.cdr.markForCheck();
    });
    this.translate.get('student-details').subscribe(val => {
      this.student_detailse = val;
      this.cdr.markForCheck();
    });
  }

  async ionViewWillEnter() {
    await this.onInitPage();
    this.getStudentPoints();
    this.AvailablePlan = await this.storageSr.get('availablePlan');
    this.menuCtrl.swipeGesture(false);
  }

  ionViewWillLeave() {
    this.clearTimerSafely(); // 🟢 تنظيف آمن للذاكرة
    this.menuCtrl.swipeGesture(true);
  }

  clearTimerSafely() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // 🟢 دالة التحميل الآمن للبيانات
  async onInitPage() {
    this.show_loading = true;

    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userRole = this.userInfo.user_type as UserRole;
      this.teacherType = (this.userInfo.teacher_type as TeacherTypeEnum) || TeacherTypeEnum.Regular;
      this.isTeacher = this.isTeacherUser;
      this.cdr.markForCheck();

      let data = {
        user_no: this.userInfo.user_no,
        school_id: this.userInfo.school_id,
        session_id: this.userDetails.session_id
      };

      this.holidaysApi
        .getHolidays(data)
        .then(response => {
          if (response && response.holidays && response.holidays.length > 0) {
            this.holidayString = response.holiday_string || '';

            let day = this.dateSelected.getDate().toString().padStart(2, '0');
            let month = (this.dateSelected.getMonth() + 1).toString().padStart(2, '0');
            let string_date = `${this.dateSelected.getFullYear()}-${month}-${day}`;

            this.isHoliday = this.holidayString.includes(string_date);
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          console.log('Error loading holidays', error);
        });

      this.getStudents();
      this.fetchAcceptedApplications();
    } else {
      this.show_loading = false;
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
      this.cdr.markForCheck();
    }
  }

  get formattedTimeLeft(): string {
    if (!this.timeLeft || this.timeLeft <= 0) return '00:00';
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }

  selectPeriod(p: number) {
    // التحقق مما إذا كانت الحصة مقفلة
    const isLocked = this.lockedPeriods.includes(p);

    // التحقق من حالة المعلم المشترك (Split Teacher)
    let canSplitTeacherEnter = false;
    if (this.teacherType === TeacherTypeEnum.Split && this.attendanceResponse?.students) {
      canSplitTeacherEnter = this.attendanceResponse.students.some(student => {
        let val = student.sheet?.['cem-' + p];
        return val === undefined || val === null || String(val).trim() === '';
      });
    }

    // إذا كانت الحصة مقفلة، نظهر تنبيه "للمعاينة فقط" ولكن لا نمنع الدخول
    if (isLocked && !canSplitTeacherEnter) {
      let semKey = 'sem-' + p;
      let teacherName = this.getSemTeacherEntry(semKey)?.teacher;

      if (teacherName) {
        this.dataProvider.showToast(
          `${this.lang.recorded_by_preview_prefix || 'تم رصدها بواسطة: '}${teacherName}${this.lang.recorded_by_preview_suffix || ' (للمعاينة فقط)'}`
        );
      } else {
        this.dataProvider.showToast(this.lang.session_saved_preview_only || 'هذه الحصة محفوظة (للمعاينة فقط)');
      }
    }

    // الانتقال للحصة المطلوبة في كل الأحوال
    this.currentActivePeriod = p;
    this.calculateAttendanceStats(p - 1);
    this.updateCurrentLockStatuses();

    // إجبار الواجهة على التحديث
    this.cdr.detectChanges();
  }

  isAnyModifiedPeriodIncomplete(): boolean {
    return this.attendanceManager.isAnyModifiedPeriodIncomplete(
      this.attendanceResponse.students || [],
      this.attendanceSheet,
      this.totalSemArray.length
    );
  }

  getStudents(loader: boolean = true) {
    this.show_loading = true;
    this.attendanceLoadFailed = false;
    let course = this.navData;
    this.courseInfo = course;

    let studentData = {
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      user_no: this.userInfo.user_no,
      session_id: this.userDetails.session_id,
      course_id: course?.cid || '',
      school_id: this.userInfo.school_id
    };

    this.attendanceApi
      .getClassStudentList(studentData)
      .then(async res => {
        this.show_loading = false;
        if (res.session && res.data) {
          const data = res.data;
          this.canAddStudent = this.userType == UserRole.Moderator && !!data.canAddStudent;
          this.attMarkBegin = false;
          this.canEdit = false;
          this.selectedSem = -1;
          this.attendanceResponse = data;
          this.attendanceSheet = {};
          this.removeSheet = {};
          this.attMarked = false;
          this.editMode = false;
          this.lastSemAtt = parseInt(String(data.last_cem));

          // 🟢 تخزين آمن لـ totalsems
          if (data.totalsems) {
            await this.storageSr.set('class_total_sem', data.totalsems);
            this.totalSem = parseInt(data.totalsems);
          }

          setTimeout(() => {
            this.students = JSON.parse(JSON.stringify(data.students || []));
            this.totalSemArray = new Array(this.totalSem);

            this.calculateAttendanceStats();

            if (this.attendanceResponse?.students) {
              this.attendanceResponse.students.forEach((student: Student) => {
                student.computedTitle = this.getStudentTitle(student);
                student.isFrozen = this.isStudentFrozen(student);
              });
            }

            this.checkEditModeOfUser().then(() => {
              // 🟢 السحر هنا: تجاوز إعداد الحصص للمشاهد لأن ليس له حصص ولا يمكنه التعديل
              if (!this.isViewer) {
                // 1. الدالة الذكية التي قمنا ببرمجتها مسبقاً لاستثناء التأخير
                this.determineNextPeriod();

                // 2. 🚫 تم إيقاف هذا السطر لأنه يقوم بمسح المصفوفة وقفل الحصة بطريقة تلغي استثناء "التأخير"
                // this.lockedPeriods = this.attendanceManager.getLockedPeriods(this.attendanceResponse.students, this.totalSemArray.length || this.totalSem);
              } else {
                this.lockedPeriods = []; // إفراغ الحصص للمشاهد
              }

              const splitStudents = this.attendanceResponse?.students;
              if (this.teacherType === TeacherTypeEnum.Split && splitStudents) {
                this.lockedPeriods = this.lockedPeriods.filter(period => {
                  return splitStudents.every(student => {
                    let val = student.sheet?.['cem-' + period];
                    return val !== undefined && val !== null && String(val).trim() !== '';
                  });
                });
              }
              this.cdr.detectChanges();
            });
          }, 10);

          if (this.students.length == 0) {
            this.noDataFound = this.lang.no_students_in_class || 'لا يوجد طلاب.';
          }
          this.cdr.markForCheck();
        } else {
          this.authProvider.flushLocalStorage();
          this.dataProvider.errorALertMessage(res.message || '');
          this.router.navigate(['login'], { replaceUrl: true });
          this.cdr.markForCheck();
        }
      })
      .catch(() => {
        this.show_loading = false;
        this.attendanceLoadFailed = true;
        this.cdr.markForCheck();
      });
  }

  // 🟢 جلب طلبات تحويل الغياب المعتمدة لهذا الصف والتاريخ، وبناء خريطة
  // بحث سريعة مفتاحها `sid-period` لتمييزها في شبكة الحضور
  fetchAcceptedApplications() {
    const data = {
      user_no: this.userInfo.user_no,
      session_id: this.userDetails.session_id,
      school_id: this.userInfo.school_id,
      datetime: this.dataProvider.getFormatedDate(this.dateSelected)
    };

    this.absentApplicationApi
      .getAbsentApplication(data)
      .then(res => {
        const map = new Map<string, AbsentApplication[]>();
        const cid = this.navData?.cid;

        (res?.data || [])
          .filter(app => app.application_status === '1' && String(app.cid) === String(cid))
          .forEach(app => {
            this.parseSeminarPeriods(app.absent_seminars).forEach(period => {
              const key = `${app.sid}-${period}`;
              const list = map.get(key) || [];
              list.push(app);
              map.set(key, list);
            });
          });

        this.acceptedApplicationsBySeminar = map;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.acceptedApplicationsBySeminar = new Map();
        this.cdr.markForCheck();
      });
  }

  // 🟢 تحليل دفاعي لأرقام الحصص المرسلة كنص مفصول بفواصل (قد تأتي بصيغة
  // "1,2,3" أو "sem-1, sem-2") — نفس أسلوب processSeminars في
  // view-application-details.page.ts
  private parseSeminarPeriods(raw: unknown): number[] {
    if (raw === undefined || raw === null || raw === '') return [];
    return String(raw)
      .split(',')
      .map(part => part.replace(/[^\d]/g, '').trim())
      .filter(part => part !== '')
      .map(Number)
      .filter(n => !isNaN(n));
  }

  // 🟢 يفتح نافذة معلومات تحويل الغياب (مقدّم الطلب، السبب، وموافق الطلب
  // إن توفر) عند النقر على شارة الخلية المحوّلة عبر طلب معتمد
  async presentApplicationInfoPopover(payload: { event: Event; sid: string | number; period: number }) {
    const key = `${payload.sid}-${payload.period}`;
    const applications = this.acceptedApplicationsBySeminar.get(key) || [];
    const application = applications[0];

    await this.studentUi.presentAbsenceConversionInfo(payload.event, {
      submittedByName: application?.submitted_by_Obj?.first_name || '',
      reason: application?.absent_notes || '',
      approvedByName: application?.accepted_by_Obj?.first_name || ''
    });
  }

  // semteacher's declared type is a union with unknown[] (the backend
  // sends an empty array instead of an object when there's no data for
  // this class yet) — narrow it here once instead of casting at every
  // string-keyed access site.
  private getSemTeacherEntry(semKey: string): { teacher?: string; user_no?: string | number } | undefined {
    const semteacher = this.attendanceResponse?.semteacher;
    if (!semteacher || Array.isArray(semteacher)) return undefined;
    return semteacher[semKey];
  }

  hasSubmittedTodayInThisClass(): boolean {
    if (!this.attendanceResponse?.students) return false;
    let myUserNo = String(this.userInfo.user_no);
    let totalSem = this.attendanceResponse.totalsems ? parseInt(this.attendanceResponse.totalsems) : 7;

    if (this.attendanceResponse.semteacher) {
      for (let i = 1; i <= totalSem; i++) {
        let semKey = 'sem-' + i;
        let entry = this.getSemTeacherEntry(semKey);
        if (entry) {
          let recUserNo = entry.user_no;
          if (recUserNo != null && String(recUserNo) === myUserNo) return true;
        }
      }
    }

    for (let student of this.attendanceResponse.students) {
      for (let i = 1; i <= totalSem; i++) {
        let enteredBy = student.sheet?.['entered_by-' + i];
        if (enteredBy != null && String(enteredBy) === myUserNo) return true;
      }
    }
    return false;
  }

  getStudentPeriodLockStatus(student: Student, period: number): string {
    const sheet = student.sheet || {};
    let enteredBy = sheet['entered_by-' + period];
    let val = sheet['cem-' + period];
    let currentStatus = String(val).trim();
    let semKey = 'cem-' + period;

    // 👈 التحقق مما إذا كان التاريخ سابقاً
    let isPastDate = this.isTeacher && !this.checkCurrentDate(this.dateSelected);

    // 1. استثناء التأخير
    let isDelayed = currentStatus === '3' || String(sheet.absentDueToDelay) === '1';
    if (isDelayed) return 'delayed';

    // 2. الفحص السحري للتعديلات المحلية (يعمل فقط لليوم الحالي)
    let isLocalUnsavedChange = false;
    if (
      this.attendanceSheet &&
      this.attendanceSheet[semKey] &&
      this.attendanceSheet[semKey]['sid-' + student.sid] !== undefined
    ) {
      isLocalUnsavedChange = true;
    }
    if (isLocalUnsavedChange && !isPastDate) return 'open';

    // 3. التحقق من الحالات الفارغة
    let isUnmarked = val == null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';
    if (isUnmarked && !isPastDate) return 'open'; // نتركه مفتوحاً لليوم الحالي فقط

    // 🔒 4. تفعيل وضع المعاينة الإجباري للأيام السابقة
    if (isPastDate) {
      // نعرضه كقالب مقفل (سواء رصدته أنت أم الإدارة أم كان فارغاً)
      return String(enteredBy) === String(this.userInfo.user_no) ? 'locked_mine' : 'locked_other';
    }

    // 5. التحقق الفعلي من بصمة السيرفر لليوم الحالي
    let hasValidEnteredBy =
      enteredBy != null &&
      String(enteredBy) !== '0' &&
      String(enteredBy) !== 'undefined' &&
      String(enteredBy) !== 'null' &&
      String(enteredBy) !== '';

    if (hasValidEnteredBy) {
      if (String(enteredBy) === String(this.userInfo.user_no)) {
        return this.canEdit ? 'open' : 'locked_mine';
      } else {
        return 'locked_other';
      }
    }

    return 'open';
  }

  updateCurrentLockStatuses() {
    if (!this.attendanceResponse?.students || !this.currentActivePeriod) return;
    this.attendanceResponse.students.forEach((student: Student) => {
      student.currentLockStatus = this.getStudentPeriodLockStatus(student, this.currentActivePeriod);
    });
  }

  getStudentPoints() {
    this.gamificationApi.getPointsValue().then(res => {
      this.student_points = res.points || [];
      this.cdr.markForCheck();
    });
  }

  viewNote() {
    const navigation: NavigationExtras = {
      state: {
        course: this.navData,
        course_id: this.navData.cid,
        dateSelected: this.dataProvider.getFormatedDate(this.dateSelected),
        students: this.students
      }
    };
    this.zone.run(() => {
      this.router.navigate(['view-notes'], navigation);
    });
  }

  checkEditModeOfUser(): Promise<void> {
    return new Promise(resolve => {
      if (this.isAdmin) {
        this.canEdit = true;
        resolve();
      } else if (this.isTeacherUser) {
        this.checkTeacherEditPowers().then(() => resolve());
      } else if (this.isModerator) {
        this.checkModeratorEditPowers().then(() => resolve());
      } else {
        resolve();
      }
    });
  }

  checkTeacherEditPowers(): Promise<void> {
    return new Promise(resolve => {
      this.dataProvider
        .postRequest<TeacherEditPowersResponse>({}, 'ManroxTeacherAllowedForEditChk/' + this.userInfo.user_no)
        .then(res => {
          // postRequest resolves `false` on an empty/no-record response;
          // treated as "no data" here exactly like `undefined` would be.
          const response = res as TeacherEditPowersResponse | undefined;
          this.teacherType = (response?.teacher_type as TeacherTypeEnum) || TeacherTypeEnum.Regular;

          this.clearTimerSafely(); // 🟢 استخدام الدالة الآمنة
          this.timeLeft = 0;
          this.canEdit = false;

          if (response && response.editPermission) {
            this.canEdit = true;

            if (response.isSubmitted && response.allotedtime != null) {
              this.timeLeft = response.allotedtime - (response.time_diffrence || 0);

              if (this.timeLeft > 0) {
                this.canEdit = true;
                this.interval = setInterval(() => {
                  this.timeLeft--;
                  if (this.timeLeft <= 0) {
                    this.canEdit = false;
                    this.clearTimerSafely();
                    this.determineNextPeriod();
                  }
                  this.cdr.markForCheck();
                }, 1000);
              } else {
                this.canEdit = false;
              }
            }
          }
          this.cdr.markForCheck();
          resolve();
        })
        .catch(error => {
          resolve();
        });
    });
  }

  checkModeratorEditPowers(): Promise<void> {
    return new Promise(resolve => {
      this.dataProvider
        .postRequest({}, 'ManroxModeratorAllowedForEditChk/' + this.userInfo.user_no)
        .then(response => {
          if (response) {
            let currentDate = new Date();
            if (currentDate.getTime() - this.dateSelected.getTime() < 172800000) {
              this.canEdit = true;
            }
          }
          this.cdr.markForCheck();
          resolve();
        })
        .catch(error => {
          resolve();
        });
    });
  }

  openStudentDetail(student_id: string) {
    if (!this.attMarkBegin) {
      const navigation: NavigationExtras = {
        state: {
          student_id: student_id,
          course_id: this.navData.cid,
          dateSelected: this.dataProvider.getFormatedDate(this.dateSelected)
        }
      };
      this.zone.run(() => {
        this.router.navigate(['student-detail'], navigation);
      });
    } else {
      this.dataProvider.showToast(this.lang.complete_att_submission || 'يرجى حفظ الغياب أولاً');
    }
  }

  async openUserImageModal(student: Student) {
    if (!this.attMarkBegin) {
      this.student = student;
      await this.studentUi.openStudentProfileModal(
        student,
        this.userType,
        this.editMode,
        (event: Event) => {
          this.takePicture(event);
        },
        (url: string) => {
          this.openFullscreenImage(url);
        },
        this.userDetails.session_id
      );
      this.updateStudentLiveStats(student);
    } else {
      this.dataProvider.showToast(this.lang.complete_att_submission);
    }
  }

  updateStudentLiveStats(student: Student) {
    let requestData = {
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      user_no: this.userInfo.user_no,
      session_id: this.userDetails.session_id,
      course_id: this.navData?.cid || '',
      school_id: this.userInfo.school_id
    };

    this.followupFieldsApi
      .getFollowUpStudentList(requestData)
      .then(followUpRes => {
        if (followUpRes?.data?.students) {
          let matched = followUpRes.data.students.find(s => s.sid === student.sid);
          if (matched) {
            this.zone.run(() => {
              student.student_points = matched.student_points || 0;
              student.unacceptable_absent_days = matched.unacceptable_absent_days || 0;
              student.suspend_days = matched.suspend_days || 0;
              student.medical_days = matched.medical_days || 0;
              this.cdr.markForCheck();
            });
          }
        }
      })
      .catch(() => {});
  }

  openFullscreenImage(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
    this.cdr.markForCheck();
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => {
      this.viewImageUrl = '';
      this.cdr.markForCheck();
    }, 300);
  }

  openCalenderModal() {
    this.showCalenderModal = true;
  }

  hideCalenderModal() {
    this.showCalenderModal = false;
  }

  onDaySelect(event: CustomEvent) {
    if (!event.detail.value) return;

    let selectedDate = new Date(event.detail.value);
    let day = selectedDate.getDate().toString().padStart(2, '0');
    let month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    let year = selectedDate.getFullYear();
    let string_date = `${year}-${month}-${day}`;

    let currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999);

    if (selectedDate.getTime() > currentDate.getTime()) {
      this.dataProvider.showToast(this.lang.future_date || 'لا يمكن اختيار تاريخ في المستقبل');
      return;
    }

    if (this.holidayString.includes(string_date)) {
      this.dataProvider.showToast(this.lang.holiday || 'هذا اليوم عطلة رسمية');
      return;
    }

    this.dateSelected = selectedDate;
    this.isHoliday = false;
    this.hideCalenderModal();
    this.getStudents();
    this.fetchAcceptedApplications();
  }

  enableEditingMode() {
    this.editMode = true;
    this.dataProvider.showToast(this.lang.edit_mode_enabled);
  }

  async presentAdminActions(event: Event) {
    const showAdd = this.userType == UserRole.Admin || this.canAddStudent;
    const action = await this.studentUi.presentAdminActions(event, showAdd);

    this.zone.run(() => {
      if (action === 'add') this.registerNewStudent();
      if (action === 'notes') this.viewNote();
    });
  }

  calculateAttendanceStats(semIndex?: number) {
    if (!this.attendanceResponse?.students) return;

    let targetPeriod = semIndex !== undefined ? semIndex + 1 : this.currentActivePeriod;

    const stats = this.attendanceManager.calculatePeriodStats(
      this.attendanceResponse.students,
      targetPeriod,
      this.attendanceSheet
    );

    this.totalPresent = stats.present;
    this.totalAbsent = stats.absent;
    this.totalRemaining = stats.remaining;

    this.attMarked = this.totalRemaining === 0;
  }

  getPeriodStatus(periodNumber: number): string {
    if (!this.attendanceResponse?.students) return 'empty';
    let semKey = 'cem-' + periodNumber;
    let markedCount = 0;
    let totalCount = this.attendanceResponse.students.length;

    for (let i = 0; i < totalCount; i++) {
      let status = String(this.attendanceResponse.students[i].sheet?.[semKey]).trim();
      if (status === '0' || status === '1' || status === '3') {
        markedCount++;
      }
    }

    if (markedCount === 0) return 'empty';
    if (markedCount === totalCount) return 'full';
    return 'partial';
  }

  determineNextPeriod() {
    if (!this.attendanceResponse?.students) return;

    let totalSem = this.attendanceResponse.totalsems ? parseInt(this.attendanceResponse.totalsems) : 7;
    this.lockedPeriods = [];
    this.allPeriodsMarked = true;

    let canEditToday = this.isTeacher && this.canEdit && this.checkCurrentDate(this.dateSelected);
    // 👈 معرفة ما إذا كنا في وضع التاريخ القديم
    let isPastDate = this.isTeacher && !this.checkCurrentDate(this.dateSelected);
    let myUserNo = String(this.userInfo.user_no);

    for (let i = 1; i <= totalSem; i++) {
      let status = this.getPeriodStatus(i);
      let semKey = 'sem-' + i;

      let recordedByOther = false;
      let isMine = false;
      let hasUnassessedStudents = false;

      // 🔒 قفل إجباري لجميع الحصص في وضع المعاينة لتاريخ سابق
      if (isPastDate) {
        this.lockedPeriods.push(i);
        continue; // تخطي الشروط المعقدة والانتقال للحصة التالية
      }

      if (this.attendanceResponse.students) {
        let otherNonDelayRecordsCount = 0;

        for (let student of this.attendanceResponse.students) {
          const sheet = student.sheet || {};
          let val = sheet['cem-' + i];
          let enteredBy = sheet['entered_by-' + i];
          let currentStatus = String(val).trim();

          let isDelayed = currentStatus === '3' || String(sheet.absentDueToDelay) === '1';
          let isUnmarked =
            val === undefined ||
            val === null ||
            currentStatus === '' ||
            currentStatus === 'undefined' ||
            currentStatus === 'null';

          if (isUnmarked) {
            hasUnassessedStudents = true;
          }

          if (
            enteredBy &&
            String(enteredBy) !== '0' &&
            String(enteredBy) !== 'undefined' &&
            String(enteredBy) !== 'null' &&
            String(enteredBy) !== myUserNo
          ) {
            if (!isDelayed && !isUnmarked) {
              otherNonDelayRecordsCount++;
            }
          } else if (enteredBy && String(enteredBy) === myUserNo) {
            isMine = true;
          }
        }

        if (otherNonDelayRecordsCount > 0) {
          recordedByOther = true;
        }
      }

      let semteacherEntry = this.getSemTeacherEntry(semKey);
      if (semteacherEntry) {
        let recUserNo = semteacherEntry.user_no;
        if (recUserNo && String(recUserNo) === myUserNo) {
          isMine = true;
        }
      }

      if (this.teacherType === TeacherTypeEnum.Split && hasUnassessedStudents) {
        if (this.allPeriodsMarked) {
          this.currentActivePeriod = i;
          this.allPeriodsMarked = false;
        }
      } else {
        if (recordedByOther) {
          this.lockedPeriods.push(i);
        } else if (status === 'full') {
          if (!canEditToday) this.lockedPeriods.push(i);
        } else if (status === 'partial') {
          if (this.teacherType === TeacherTypeEnum.Regular && !canEditToday) {
            this.lockedPeriods.push(i);
          } else if (this.allPeriodsMarked) {
            this.currentActivePeriod = i;
            this.allPeriodsMarked = false;
          }
        } else if (this.allPeriodsMarked) {
          this.currentActivePeriod = i;
          this.allPeriodsMarked = false;
        }
      }
    }

    // 🛡️ الجرافة: لا تعمل في التواريخ السابقة لمنع فتح الحصص القديمة
    if (!isPastDate) {
      for (let i = 1; i <= totalSem; i++) {
        let hasDelay = false;
        let hasUnmarked = false;
        let hasActualOtherRecords = false;

        for (let student of this.attendanceResponse.students) {
          const sheet = student.sheet || {};
          let val = sheet['cem-' + i];
          let currentStatus = String(val).trim();
          let enteredBy = sheet['entered_by-' + i];

          let isDelayed = currentStatus === '3' || String(sheet.absentDueToDelay) === '1';
          let isUnmarked =
            val == null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';

          if (isDelayed) hasDelay = true;
          if (isUnmarked) hasUnmarked = true;

          if (!isDelayed && !isUnmarked && enteredBy && String(enteredBy) !== myUserNo && String(enteredBy) !== '0') {
            hasActualOtherRecords = true;
          }
        }

        if (hasDelay && hasUnmarked && !hasActualOtherRecords) {
          this.lockedPeriods = this.lockedPeriods.filter(p => p !== i);
          if (this.allPeriodsMarked || this.currentActivePeriod > i) {
            this.currentActivePeriod = i;
            this.allPeriodsMarked = false;
          }
        }
      }
    }

    // اختيار الحصة الأولى افتراضياً في وضع المعاينة
    if (isPastDate) {
      this.currentActivePeriod = 1;
      this.allPeriodsMarked = false;
    } else if (this.allPeriodsMarked && canEditToday) {
      let lastEditedPeriod = 1;
      for (let i = totalSem; i >= 1; i--) {
        if (!this.lockedPeriods.includes(i)) {
          let isMineCheck = false;
          let semKey = 'sem-' + i;

          let semteacherEntry = this.getSemTeacherEntry(semKey);
          if (semteacherEntry) {
            let rec = semteacherEntry.user_no;
            if (rec && String(rec) === myUserNo) isMineCheck = true;
          }

          if (!isMineCheck) {
            for (let student of this.attendanceResponse.students) {
              if (String(student.sheet?.['entered_by-' + i]) === myUserNo) {
                isMineCheck = true;
                break;
              }
            }
          }

          if (isMineCheck) {
            lastEditedPeriod = i;
            break;
          }
        }
      }
      this.currentActivePeriod = lastEditedPeriod;
      this.allPeriodsMarked = false;
    }

    if (!this.allPeriodsMarked) {
      this.calculateAttendanceStats(this.currentActivePeriod - 1);
    }

    this.updateCurrentLockStatuses();
    this.cdr.detectChanges();
  }

  setTeacherAttendance(student: Student, status: string) {
    if (this.lockedPeriods.includes(this.currentActivePeriod)) return;
    if (!student.sheet) student.sheet = {};
    const sheet = student.sheet;

    let enteredBy = sheet['entered_by-' + this.currentActivePeriod];
    let val = sheet['cem-' + this.currentActivePeriod];
    let currentStatus = String(val).trim();
    let isUnmarked = val == null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';

    // يعتبر السجل محفوظاً في الداتابيز فقط إذا كان له مدخل (حضور أو غياب) وليس فارغاً
    let isSavedInDb = enteredBy && enteredBy !== 'null' && enteredBy !== '0' && !isUnmarked;

    if (isSavedInDb && String(enteredBy) !== String(this.userInfo.user_no) && !this.canEdit) {
      this.dataProvider.showToast(this.lang.student_already_registered || 'عفواً، تم تسجيل هذا الطالب مسبقاً.');
      return;
    }

    let sem = this.currentActivePeriod - 1;
    let semKey = 'cem-' + (sem + 1);

    if (this.attendanceSheet[semKey] == undefined) {
      this.attendanceSheet[semKey] = {};
      this.attMarkBegin = true;
    }

    if (status === '-1') {
      sheet[semKey] = 'undefined';
      delete this.attendanceSheet[semKey]['sid-' + student.sid];
    } else {
      sheet[semKey] = status;
      this.attendanceSheet[semKey]['sid-' + student.sid] = status;
    }

    this.calculateAttendanceStats(sem);
  }

  setAllStudentsStatusForTeacher(status: string) {
    if (this.lockedPeriods.includes(this.currentActivePeriod)) return;

    let sem = this.currentActivePeriod - 1;
    let semKey = 'cem-' + (sem + 1);

    if (this.attendanceSheet[semKey] == undefined) {
      this.attendanceSheet[semKey] = {};
      this.attMarkBegin = true;
    }

    (this.attendanceResponse.students || []).forEach((student: Student) => {
      if (!student.sheet) student.sheet = {};
      const sheet = student.sheet;

      let enteredBy = sheet['entered_by-' + this.currentActivePeriod];
      let val = sheet[semKey];
      let currentStatus = String(val).trim();

      let isDelayed = currentStatus === '3' || String(sheet.absentDueToDelay) === '1';
      let isUnmarked = val == null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';

      let isSavedInDb = enteredBy && enteredBy !== 'null' && enteredBy !== '0' && !isUnmarked;
      let isMine = String(enteredBy) === String(this.userInfo.user_no);

      if (!isDelayed && (!isSavedInDb || isMine || this.canEdit)) {
        if (status === '-1') {
          sheet[semKey] = 'undefined';
          delete this.attendanceSheet[semKey]['sid-' + student.sid];
        } else {
          sheet[semKey] = status;
          this.attendanceSheet[semKey]['sid-' + student.sid] = status;
        }
      }
    });

    this.calculateAttendanceStats(sem);
  }

  hasMadeChanges(): boolean {
    return this.attendanceManager.hasMadeChanges(this.attendanceSheet, this.removeSheet);
  }

  changeAttendanceStatus(student: Student, sem: number, ind: number) {
    if (this.isViewer) return;
    if (this.isHoliday) {
      this.dataProvider.showToast(this.lang.holiday);
      return;
    }

    if (!student.sheet) student.sheet = {};
    const sheet = student.sheet;

    // 🟢 السحر هنا: منع تعديل التأخير نهائياً لأي مستخدم!
    let currentStatus = sheet['cem-' + (sem + 1)];
    if (String(currentStatus) === '3' || String(sheet.absentDueToDelay) === '1') {
      this.dataProvider.showToast(this.lang.delay_edit_wrong_place || 'لا يمكن تعديل التأخير من هنا. يرجى تعديله من سجل التأخير.');
      return;
    }

    if (this.isRestrictedModerator && !this.checkCurrentDate(this.dateSelected)) {
      this.dataProvider.showToast(this.lang.attendance_today_only || 'يسمح برصد الغياب لليوم الحالي فقط');
      return;
    }

    if (this.isRestrictedModerator) {
      if (this.selectedSem !== -1 && this.selectedSem !== sem) {
        this.dataProvider.showToast(this.lang.save_current_period_before_moving || 'الرجاء حفظ غياب الحصة المحددة قبل الانتقال');
        return;
      }
      this.selectedSem = sem;
    }

    if (this.isModeratorWithEdit && !this.isTodayOrYesterday(this.dateSelected)) {
      this.dataProvider.showToast(this.lang.edit_today_or_yesterday_only || 'يسمح بالتعديل لليوم الحالي أو الأمس فقط');
      return;
    }

    if (!this.isTeacherUser && !this.editMode && !this.isRestrictedModerator) {
      this.dataProvider.showToast(this.lang.enable_edit || 'يرجى تفعيل وضع التعديل أولاً');
      return;
    }

    if (this.isRestrictedModerator && sheet['entered_by-' + (sem + 1)]) {
      this.dataProvider.showToast(this.lang.no_permission_edit_recorded_attendance || 'لا تملك صلاحية لتعديل غياب تم رصده مسبقاً');
      return;
    }

    if (this.attendanceSheet['cem-' + (sem + 1)] == undefined) {
      this.attendanceSheet['cem-' + (sem + 1)] = {};
      this.attMarkBegin = true;
    }

    // هنا الكود المعتاد للتبديل بين (حاضر، غائب، غير محدد)
    let newStatus =
      currentStatus == '1' ? '0' : currentStatus == '0' ? (this.isModeratorWithEdit ? '1' : 'undefined') : '1';

    sheet['cem-' + (sem + 1)] = newStatus;

    if (newStatus === 'undefined') {
      delete this.attendanceSheet['cem-' + (sem + 1)]['sid-' + student.sid];
      this.removeSheet[sem + 1 + '-' + student.sid] = { sid: student.sid!, sem: sem + 1 };
    } else {
      this.attendanceSheet['cem-' + (sem + 1)]['sid-' + student.sid] = newStatus;
      if (this.removeSheet[sem + 1 + '-' + student.sid]) delete this.removeSheet[sem + 1 + '-' + student.sid];
    }

    this.calculateAttendanceStats(sem);
  }

  changeStatusAllStudents(student: Student, sem: number, status: string) {
    if (this.isHoliday) return;
    if (!student.sheet) student.sheet = {};
    const sheet = student.sheet;

    // 🟢 السحر هنا: استثناء الطالب المتأخر من التغيير الجماعي
    let currentStatus = sheet['cem-' + (sem + 1)];
    if (String(currentStatus) === '3' || String(sheet.absentDueToDelay) === '1') {
      return; // تجاهل هذا الطالب وابقه متأخراً
    }

    if (this.isRestrictedModerator && !this.checkCurrentDate(this.dateSelected)) return;
    if (this.isModeratorWithEdit && !this.isTodayOrYesterday(this.dateSelected)) return;
    if (!this.isTeacherUser && !this.editMode && !this.isRestrictedModerator) return;
    if (this.isRestrictedModerator && sheet['entered_by-' + (sem + 1)]) return;

    if (this.attendanceSheet['cem-' + (sem + 1)] == undefined) {
      this.attendanceSheet['cem-' + (sem + 1)] = {};
      this.attMarkBegin = true;
    }

    sheet['cem-' + (sem + 1)] = status;

    if (status === 'undefined') {
      delete this.attendanceSheet['cem-' + (sem + 1)]['sid-' + student.sid];
      this.removeSheet[sem + 1 + '-' + student.sid] = { sid: student.sid!, sem: sem + 1 };
    } else {
      this.attendanceSheet['cem-' + (sem + 1)]['sid-' + student.sid] = status;
      if (this.removeSheet[sem + 1 + '-' + student.sid]) delete this.removeSheet[sem + 1 + '-' + student.sid];
    }
    this.calculateAttendanceStats(sem);
  }

  changeAttendanceStatusAll(sem: number) {
    if (this.isViewer) return;
    if (this.isHoliday) {
      this.dataProvider.showToast(this.lang.holiday);
      return;
    }

    let semKey = 'sem-' + (sem + 1);
    let semteacherEntry = this.getSemTeacherEntry(semKey);

    if (semteacherEntry && !this.editMode) {
      this.dataProvider.showToast((this.lang.recorded_by_prefix || 'تم الرصد بواسطة: ') + semteacherEntry.teacher);
      return;
    }

    if (this.isRestrictedModerator && !this.checkCurrentDate(this.dateSelected)) {
      this.dataProvider.showToast(this.lang.attendance_today_only || 'يسمح برصد الغياب لليوم الحالي فقط');
      return;
    }

    if (this.isRestrictedModerator) {
      if (this.selectedSem !== -1 && this.selectedSem !== sem) {
        this.dataProvider.showToast(this.lang.save_current_period_before_switching || 'الرجاء حفظ غياب الحصة المحددة حالياً قبل الانتقال لحصة أخرى');
        return;
      }
      this.selectedSem = sem;
    }

    if (this.isModeratorWithEdit && !this.isTodayOrYesterday(this.dateSelected)) {
      this.dataProvider.showToast(this.lang.edit_today_or_yesterday_only || 'يسمح بالتعديل لليوم الحالي أو الأمس فقط');
      return;
    }

    if (!this.isTeacherUser && !this.editMode && !this.isRestrictedModerator && !this.isAdmin) {
      this.dataProvider.showToast(this.lang.enable_edit || 'يرجى تفعيل وضع التعديل أولاً');
      return;
    }

    let status = 'undefined';
    let currentClassAllStatus = this.classAll[sem];

    if (this.isAdmin || this.isRestrictedModerator) {
      if (currentClassAllStatus == '') {
        this.classAll[sem] = 'present';
        status = '1';
      } else if (currentClassAllStatus == 'present') {
        this.classAll[sem] = 'absent';
        status = '0';
      } else if (currentClassAllStatus == 'absent') {
        this.classAll[sem] = '';
        status = 'undefined';
      }
    } else {
      if (currentClassAllStatus == '') {
        this.classAll[sem] = 'present';
        status = '1';
      } else if (currentClassAllStatus == 'present') {
        this.classAll[sem] = 'absent';
        status = '0';
      } else if (currentClassAllStatus == 'absent') {
        this.classAll[sem] = 'present';
        status = '1';
      }
    }

    (this.attendanceResponse.students || []).forEach((student: Student) => {
      this.changeStatusAllStudents(student, sem, status);
    });
  }

  checkCurrentDate(date: Date) {
    let currentDate = new Date();
    return (
      date.getDate() == currentDate.getDate() &&
      date.getMonth() == currentDate.getMonth() &&
      date.getFullYear() == currentDate.getFullYear()
    );
  }

  async takePicture(event: Event) {
    const result = await this.studentEngagement.captureAvatarImage(event, this.lang);
    if (result.base64) {
      const base64 = result.base64;
      this.zone.run(() => this.ChangeStudentProfileAvatar(base64));
    } else if (result.action === 'avatar') {
      this.zone.run(() => this.OpenAvatarModel());
    }
  }

  async OpenAvatarModel() {
    // 1. استدعاء المودال عبر الوسيط الخاص بك بكل نظافة
    const data = await this.studentUi.openAvatarModal(this.student);

    // 2. 🟢 الحل النهائي: الوسيط يرجع البيانات مباشرة، لذلك نستخدم data.image_url فقط
    if (data && data.image_url) {
      let selectedAvatarUrl = data.image_url;

      // 3. التحديث الفوري للواجهة لكي يراها المستخدم في لمح البصر
      this.zone.run(() => {
        this.student.pic = selectedAvatarUrl;

        if (this.attendanceResponse && this.attendanceResponse.students) {
          const index = this.attendanceResponse.students.findIndex((s: Student) => s.sid === this.student.sid);
          if (index > -1) {
            this.attendanceResponse.students[index].pic = selectedAvatarUrl;
            // إجبار المصفوفة على التحديث
            this.attendanceResponse.students[index] = { ...this.attendanceResponse.students[index] };
          }
        }

        if (this.cdr) this.cdr.detectChanges();
      });

      // 4. معالجة الصورة ورفعها في الخلفية للسيرفر
      this.dataProvider.showLoading();
      this.imageService
        .convertUrlToBase64(selectedAvatarUrl)
        .then(base64 => {
          this.ChangeStudentProfileAvatar(base64);
        })
        .catch(err => {
          this.dataProvider.hideLoading();
          this.dataProvider.errorALertMessage(this.lang.avatar_processing_error_retry || 'تعذر معالجة الصورة الرمزية، حاول مجدداً.');
        });
    }
  }

  async ChangeStudentProfileAvatar(base64Data: string) {
    if (!base64Data) {
      this.dataProvider.hideLoading();
      return;
    }

    try {
      const result = await this.dataProvider.run(() =>
        this.studentEngagement.uploadAvatar(base64Data, {
          user_no: this.userInfo.user_no!,
          session_id: this.userDetails.session_id!,
          sid: this.student.sid!
        })
      );

      if (result.success) {
        const newPicUrl = result.url;

        this.zone.run(() => {
          // 1. تحديث الكائن المحلي
          this.student.pic = newPicUrl;

          // 2. تحديث المصفوفة الحية (التي تتصل بالشاشة والمودال)
          if (this.attendanceResponse && this.attendanceResponse.students) {
            const liveIdx = this.attendanceResponse.students.findIndex((s: Student) => s.sid === this.student.sid);
            if (liveIdx > -1) {
              this.attendanceResponse.students[liveIdx].pic = newPicUrl;
              this.attendanceResponse.students[liveIdx] = { ...this.attendanceResponse.students[liveIdx] };
            }
          }

          // 3. تحديث المصفوفة الاحتياطية لتجنب أي أخطاء مستقبلية
          if (this.students && this.students.length > 0) {
            const backupIdx = this.students.findIndex((s: Student) => s.sid === this.student.sid);
            if (backupIdx > -1) {
              this.students[backupIdx].pic = newPicUrl;
            }
          }

          if (this.cdr) this.cdr.detectChanges();
        });

        this.dataProvider.showToast(this.lang.image_updated_success || 'تم تحديث الصورة بنجاح');
      } else {
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(result.message || '');
      }
    } catch (error: unknown) {
      this.dataProvider.errorALertMessage((error as { message?: string })?.message || 'حدث خطأ في الاتصال بالخادم.');
    }
  }

  submitAttendance() {
    let hasChanges = this.hasMadeChanges();

    if (this.isAdmin || this.isModerator) {
      if (!hasChanges) {
        this.dataProvider.showToast(this.lang.no_new_changes_to_save || 'لا توجد تعديلات جديدة لحفظها.');
        return;
      }
      if (this.isModerator && this.isAnyModifiedPeriodIncomplete()) {
        this.dataProvider.showToast(this.lang.complete_period_before_save || 'عذراً، يجب إكمال الحصة بالكامل قبل الحفظ.');
        return;
      }
      this.executeSaveAttendance();
      return;
    }

    if (this.teacherType === TeacherTypeEnum.Regular) {
      if (this.checkAttendence()) {
        if (this.attMarked && hasChanges) this.executeSaveAttendance();
        else this.dataProvider.showToast(this.lang.mark_all_attendance);
      } else {
        this.dataProvider.showToast(this.lang.att_not_all_complete_err);
      }
    } else {
      if (this.attMarked || hasChanges) this.executeSaveAttendance();
      else this.dataProvider.showToast(this.lang.att_not_complete_err);
    }
  }

  async executeSaveAttendance() {
    this.dataProvider.showLoading();
    let data: AttendanceSubmitPayload = {
      sheet: this.attendanceSheet,
      user_no: this.userInfo.user_no!,
      session_id: this.userDetails.session_id!,
      cid: this.navData?.cid as string | number,
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      removal_sheet: this.removeSheet,
      school_id: this.userInfo.school_id!,
      user_type: String(this.userInfo.user_type || '1'),
      username: this.userInfo.first_name || this.userInfo.username || 'الإدارة'
    };

    if (await this.isOnline()) {
      this.sendAttendanceToServer(data);
    } else {
      this.dataProvider.hideLoading();
      let attendance = (await this.storageSr.get('attendance')) || [];
      attendance.push(data);
      await this.storageSr.set('attendance', attendance);
      this.dataProvider.showToast(this.lang.offline_att_stored);
      this.attendanceSheet = {};
      this.removeSheet = {};
      this.editMode = false;
      this.attMarkBegin = false;
      this.cdr.markForCheck();
    }
  }

  sendAttendanceToServer(data: AttendanceSubmitPayload) {
    this.attendanceApi
      .markAttendance(data)
      .then(response => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(response.message || 'تم حفظ الغياب بنجاح');
        this.attendanceSheet = {};
        this.removeSheet = {};
        this.editMode = false;
        this.attMarkBegin = false;
        this.getStudents(false);
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.dataProvider.hideLoading();
        this.dataProvider.errorALertMessage(error || 'حدث خطأ أثناء الحفظ.');
      });
  }

  checkAttendence(): boolean {
    return this.attendanceManager.isPeriodAttendanceComplete(
      this.attendanceResponse.students || [],
      this.currentActivePeriod,
      this.attendanceSheet
    );
  }
  async isOnline(): Promise<boolean> {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      return (await Network.getStatus()).connected;
    }

    return navigator.onLine;
  }
  async registerNewStudent() {
    this.translate.get('reg_student').subscribe(async response => {
      this.addStudentLang = response;
      this.cdr.markForCheck();
      const result = await this.studentUi.openAddStudent(this.addStudentLang);
      if (result) {
        this.newStudentName = result.name;
        this.newStudentId = result.id;
        this.checkPlanAndRegister();
      }
    });
  }

  checkPlanAndRegister() {
    let data = { school_id: this.userInfo.school_id, session_id: this.userDetails.session_id };

    this.dataProvider
      .run(() => this.schoolDirectoryApi.getCountStudents(data))
      .then(res => {
        var totalStudents = res.data;
        if (this.AvailablePlan.isExpire == true) {
          this.dataProvider.showToast('This feature is part of subscription plan.Please subscribe plan!');
          return;
        }
        let studentData = { student_name: this.newStudentName, student_id: this.newStudentId };
        this.addNewStudent(studentData, this.addStudentLang);
      })
      .catch(err => {
        this.dataProvider.errorALertMessage(err);
      });
  }

  addNewStudent(data: any, response: any) {
    data.student_id = parseInt(data.student_id);
    if (Number.isInteger(data.student_id)) {
      this.dataProvider
        .run(() =>
          this.registrationApi.registerStudent({
            name: data.student_name,
            student_id: data.student_id,
            user_no: this.userInfo.user_no,
            school_id: this.userInfo.school_id,
            course_id: this.courseInfo.cid,
            session_id: this.userDetails.session_id
          })
        )
        .then(res => {
          if (res.session) {
            this.getStudents(false);
            this.dataProvider.showToast(this.lang.create_student_success_msg);
          } else {
            this.dataProvider.showToast(res.message || '');
          }
        })
        .catch(err => {
          this.dataProvider.errorALertMessage(err);
        });
    } else {
      this.dataProvider.showToast(response.invalid_stu_id);
    }
  }

  async presentNoteActionSheet(event: Event, student: Student) {
    const action = await this.studentUi.presentStudentOptions(event, student, this.student_detailse);
    this.zone.run(() => {
      if (action === 'review') this.openNoteModal(student, 'review');
      if (action === 'note') this.openNoteModal(student, 'note');
      if (action === 'points') this.openSkillTreeModal(student);
    });
  }

  async openSkillTreeModal(student: Student) {
    const result = await this.studentUi.openSkillTree(student);
    if (result && result.skillType && result.points) {
      this.awardSkillPoints(student, result.skillType, result.points);
    }
  }

  async awardSkillPoints(student: Student, skillType: string, point: number) {
    let body = {
      sid: String(student.sid),
      userId: String(this.userInfo.user_no),
      points: '+' + point,
      skill_type: skillType,
      session_id: this.userDetails.session_id
    };

    try {
      const res = await this.dataProvider.run(() => this.studentEngagement.awardSkillPoints(body));
      this.zone.run(() => {
        if (res && res.success) {
          this.dataProvider.showToast(
            `${this.lang.points_added_prefix ?? 'تمت إضافة '}${point}${this.lang.points_added_suffix || ' نقطة بنجاح!'}`
          );
          student.student_points = Number(student.student_points || 0) + point;
        } else {
          this.showModernWarning(res?.msg || 'تعذر إضافة النقاط');
        }
        this.cdr.markForCheck();
      });
    } catch (err: unknown) {
      this.zone.run(() => {
        this.showModernWarning(`خطأ: ${typeof err === 'string' ? err : (err as { message?: string })?.message}`);
        this.cdr.markForCheck();
      });
    }
  }

  async openNoteModal(student: Student, mode: 'note' | 'review') {
    const result = await this.studentUi.openNoteOrReviewModal(student, mode);
    if (result.mode === 'note' && result.data?.noteMessage) {
      this.submitTextNote(student, result.data.noteMessage);
    } else if (result.mode === 'review' && result.data?.data) {
      this.submitReviewNote(student, result.data.data, result.data.noteMessage);
    }
  }

  // 🟢 7. إصلاح دالتي إرسال الملاحظات (إضافة date و course_id الناقصة)
  submitTextNote(student: Student, message: string) {
    let data = {
      sid: student.sid,
      note: message,
      user_id: this.userInfo.user_no,
      rating: 0,
      new_rating: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      course_id: this.navData?.cid || '',
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .run(() => this.studentEngagement.addNote(data))
      .then(() => {
        this.dataProvider.showToast(this.lang.add_note_success_message);
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error);
      });
  }

  submitReviewNote(student: Student, stars: number, message: string) {
    let data = {
      sid: student.sid,
      note: message,
      user_id: this.userInfo.user_no,
      rating: stars,
      new_rating: JSON.stringify(stars),
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      course_id: this.navData?.cid || '',
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .run(() => this.studentEngagement.addNote(data))
      .then(() => {
        this.dataProvider.showToast(this.lang.add_review_success_message);
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error);
      });
  }

  isTodayOrYesterday(date: Date): boolean {
    let today = new Date();
    let yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    let d = new Date(date);
    return (
      (d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()) ||
      (d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear())
    );
  }

  shouldShowFooter(): boolean {
    if (this.isHoliday || this.userRole === UserRole.Viewer || !this.attendanceResponse?.students?.length) return false;
    if (this.isAdmin) return true;

    if (this.isTeacherUser) {
      // 🌟 التعديل هنا: إخفاء الفوتر وزر الحفظ إذا كانت الحصة التي يتصفحها المعلم مقفلة
      let isCurrentPeriodLocked = this.lockedPeriods.includes(this.currentActivePeriod);
      return !this.allPeriodsMarked && this.checkCurrentDate(this.dateSelected) && !isCurrentPeriodLocked;
    }

    if (this.isModeratorWithEdit) return this.isTodayOrYesterday(this.dateSelected);
    if (this.isRestrictedModerator) return this.checkCurrentDate(this.dateSelected);
    return false;
  }

  toggleEditModeWithValidation() {
    if (this.isModeratorWithEdit && !this.isTodayOrYesterday(this.dateSelected)) {
      this.dataProvider.showToast(this.lang.edit_today_or_yesterday_only_apology || 'عذراً، يسمح لك بالتعديل لليوم الحالي أو الأمس فقط');
      return;
    }
    this.toggleEditMode();
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.attendanceSheet = {};
      this.removeSheet = {};
      this.dataProvider.showToast(this.lang.changes_cancelled_success || 'تم إلغاء التعديلات بنجاح');
      this.getStudents(false);
    } else {
      this.dataProvider.showToast(this.lang.edit_mode_enabled || 'تم تفعيل وضع التعديل');
    }
  }

  showModernWarning(msg: string) {
    this.warningType = msg.includes('مجم') || msg.includes('تجميد') ? 'frozen' : 'warning';
    this.warningMessage = msg;
    this.showWarningPopup = true;
  }

  closeWarningPopup() {
    this.showWarningPopup = false;
  }

  isStudentFrozen(student: Student): boolean {
    if (!student || !student.frozen_until) return false;
    const today = new Date().toISOString().split('T')[0];
    return student.frozen_until >= today;
  }

  getStudentTitle(student: Student): string {
    if (!student) return '';
    const skillsData = {
      cognitive: Number(student?.cognitive || 0),
      social: Number(student?.social || 0),
      discipline: Number(student?.discipline || 0),
      emotional: Number(student?.emotional || 0),
      practical: Number(student?.practical || 0)
    };
    return this.gamification.getFinalStudentTitle(
      student?.active_crafted_title || '',
      skillsData,
      Number(student?.student_points || 0)
    );
  }
}
