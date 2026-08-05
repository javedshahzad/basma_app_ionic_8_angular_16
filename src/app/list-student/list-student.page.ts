import { Component, OnInit, NgZone, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, Platform, ModalController, ActionSheetController, MenuController, PopoverController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';

import { FileUploadService } from '../service/file-upload/file-upload.service';
import { ImageProcessingService } from '../service/image-processing/image-processing.service';
import { StudentUiService } from '../service/student-ui/student-ui.service';
import { AttendanceManagerService } from '../service/attendance-manager/attendance-manager.service';
import { GamificationEngineService } from '../service/gamification-engine/gamification-engine.service';

// 🟢 استيراد خدمة التخزين الموحدة
import { StorageService } from '../service/storage.service';
import { AttendanceApiService } from '../service/attendance-api/attendance-api.service';
import { HolidaysApiService } from '../service/holidays-api/holidays-api.service';
import { StudentEngagementService } from '../service/student-engagement/student-engagement.service';

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

@Component({
  selector: 'app-list-student', 
  templateUrl: './list-student.page.html',
  styleUrls: ['./list-student.page.scss'],
})
export class ListStudentPage implements OnInit {
  trackByIndex(index: number): number { return index; }
  private destroyRef = inject(DestroyRef);

  showCalenderModal: boolean = false;
  dateSelected: Date;
  noDataFound: string = "";
  totalSem: number = 7;
  student: any = {};
  canEdit: boolean = false;
  userRole: UserRole;
  attendanceResponse: any = {};
  userDetails: any = {};
  timeLeft: number;
  attMarkBegin: boolean = false;
  selectedSem: number = -1;
  lang: any = {};
  students: any = [];
  attendanceSheet: any = {};
  removeSheet: any = {};
  attMarked: boolean = false;
  editMode: boolean = false;
  currentEvents: any = [];
  holidayString: string = "";
  lastSemAtt: any;
  isHoliday: boolean = false;
  courseInfo: any = {};
  navData: any;
  showAll = true;
  totalSemArray: any[] = [];
  classAll = ['','','','','','','',''];
  options = {
      canBackwardsSelected: true,
      from: 1,
      to: 0,
      disableWeeks: [],
      daysConfig : <any>[] 
  };
  canAddStudent: boolean = false;
  canAddStudentNote: boolean = true;
  planLang: any;
  show_loading: boolean = false;
  student_detailse: any;
  student_points: any[] = [];
  interval: any;
  AvailablePlan: any;

  totalRemaining: number = 0;
  totalPresent: number = 0;
  totalAbsent: number = 0;
  isTeacher: boolean = false; 
  currentActivePeriod: number = 1; 
  allPeriodsMarked: boolean = false; 
  lockedPeriods: number[] = []; 
  teacherType: TeacherTypeEnum = TeacherTypeEnum.Regular; 

  addStudentLang: any = {}; 
  newStudentName: string = '';
  newStudentId: string = '';

  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  // 🟢 النوافذ المنبثقة (Popups)
  showWarningPopup: boolean = false;
  warningMessage: string = '';
  warningType: 'frozen' | 'warning' = 'warning';

  // 🟢 اختصارات الصلاحيات (Getters)
  get isAdmin(): boolean { return this.userRole === UserRole.Admin; }
  get isTeacherUser(): boolean { return this.userRole === UserRole.Teacher; }
  get isModerator(): boolean { return this.userRole === UserRole.Moderator; }
  get isViewer(): boolean { return this.userRole === UserRole.Viewer; }
  get userType(): string { return this.userRole as string; }
  get isRestrictedModerator(): boolean { return this.isModerator && !this.canEdit; }
  get isModeratorWithEdit(): boolean { return this.isModerator && this.canEdit; }
  get canAddStudentRole(): boolean { return this.isAdmin || this.canAddStudent; }

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
    private studentEngagement: StudentEngagementService
  ) {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.navData = navigation.extras.state['course'];
      }
    });

    this.dateSelected = new Date();

    this.translate.get("alertmessages").subscribe(res => this.lang = res);
    this.translate.get("plan").subscribe(val => this.planLang = val);
    this.translate.get("student-details").subscribe(val => this.student_detailse = val);
  }

  ngOnInit() {}

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
    
    let userLoggedIn = await this.storageSr.get("userloggedin"); 
    
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userRole = this.userDetails.details.user_type as UserRole;
      this.teacherType = this.userDetails.details.teacher_type as TeacherTypeEnum || TeacherTypeEnum.Regular;
      this.isTeacher = this.isTeacherUser;

      let data = {
        "user_no": this.userDetails.details.user_no,
        "school_id": this.userDetails.details.school_id,
        "session_id": this.userDetails.session_id
      };
      
      this.holidaysApi.getHolidays(data).then(response => {
        if (response && response.holidays && response.holidays.length > 0) {
          this.holidayString = response.holiday_string;
          
          let day = this.dateSelected.getDate().toString().padStart(2, '0');
          let month = (this.dateSelected.getMonth() + 1).toString().padStart(2, '0');
          let string_date = `${this.dateSelected.getFullYear()}-${month}-${day}`;
          
          this.isHoliday = this.holidayString.includes(string_date);
        }
      }).catch(error => {
        console.log("Error loading holidays", error);
      });

      this.getStudents();
    } else {
      this.show_loading = false;
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
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
        let val = student.sheet['cem-' + p];
        return val === undefined || val === null || String(val).trim() === '';
      });
    }

    // إذا كانت الحصة مقفلة، نظهر تنبيه "للمعاينة فقط" ولكن لا نمنع الدخول
    if (isLocked && !canSplitTeacherEnter) {
      let semKey = 'sem-' + p;
      let teacherName = this.attendanceResponse?.semteacher?.[semKey]?.teacher;
      
      if (teacherName) {
        this.dataProvider.showToast(`تم رصدها بواسطة: ${teacherName} (للمعاينة فقط)`);
      } else {
        this.dataProvider.showToast("هذه الحصة محفوظة (للمعاينة فقط)");
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
      this.attendanceResponse.students,
      this.attendanceSheet,
      this.totalSemArray.length
    );
  }

  getStudents(loader: boolean = true) {
    this.show_loading = true;
    let course = this.navData;
    this.courseInfo = course;
    
    let studentData = {
      "date": this.dataProvider.getFormatedDate(this.dateSelected),
      "user_no": this.userDetails.details.user_no,
      "session_id": this.userDetails.session_id,
      "course_id": course?.cid || '',
      "school_id": this.userDetails.details.school_id,
    };

    this.dataProvider.getClassStudentList(studentData).then(async res => { 
      this.show_loading = false;
      if (res.session) {
        
        this.canAddStudent = (this.userType == UserRole.Moderator && res.data.canAddStudent);
        this.attMarkBegin = false;
        this.canEdit = false;
        this.selectedSem = -1;
        this.attendanceResponse = res.data;
        this.attendanceSheet = {};
        this.removeSheet = {};
        this.attMarked = false;
        this.editMode = false;
        this.lastSemAtt = parseInt(res.data.last_cem);
        
        // 🟢 تخزين آمن لـ totalsems
        if (res.data.totalsems) {
          await this.storageSr.set('class_total_sem', res.data.totalsems);
          this.totalSem = parseInt(res.data.totalsems);
        }

        setTimeout(() => {
            this.students = JSON.parse(JSON.stringify(res.data.students || []));
            this.totalSemArray = new Array(this.totalSem);

            this.calculateAttendanceStats(); 

            if (this.attendanceResponse?.students) {
              this.attendanceResponse.students.forEach((student: any) => {
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

              if (this.teacherType === TeacherTypeEnum.Split && this.attendanceResponse?.students) {
                this.lockedPeriods = this.lockedPeriods.filter(period => {
                  return this.attendanceResponse.students.every(student => {
                    let val = student.sheet['cem-' + period];
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

      } else {
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(res.message);
        this.router.navigate(['login'], { replaceUrl: true });
      }
    }).catch(() => {
      this.show_loading = false;
    });
  }

  hasSubmittedTodayInThisClass(): boolean {
    if (!this.attendanceResponse?.students) return false;
    let myUserNo = String(this.userDetails.details.user_no);
    let totalSem = this.attendanceResponse.totalsems ? parseInt(this.attendanceResponse.totalsems) : 7;

    if (this.attendanceResponse.semteacher) {
        for (let i = 1; i <= totalSem; i++) {
            let semKey = 'sem-' + i;
            if (this.attendanceResponse.semteacher[semKey]) {
                let recUserNo = this.attendanceResponse.semteacher[semKey].user_no;
                if (recUserNo != null && String(recUserNo) === myUserNo) return true;
            }
        }
    }

    for (let student of this.attendanceResponse.students) {
        for (let i = 1; i <= totalSem; i++) {
            let enteredBy = student.sheet['entered_by-' + i];
            if (enteredBy != null && String(enteredBy) === myUserNo) return true;
        }
    }
    return false;
  }

  getStudentPeriodLockStatus(student: any, period: number): string {
    let enteredBy = student.sheet['entered_by-' + period];
    let val = student.sheet['cem-' + period];
    let currentStatus = String(val).trim();
    let semKey = 'cem-' + period;

    // 👈 التحقق مما إذا كان التاريخ سابقاً
    let isPastDate = this.isTeacher && !this.checkCurrentDate(this.dateSelected); 

    // 1. استثناء التأخير
    let isDelayed = currentStatus === '3' || student.sheet.absentDueToDelay === '1';
    if (isDelayed) return 'delayed'; 
    
    // 2. الفحص السحري للتعديلات المحلية (يعمل فقط لليوم الحالي)
    let isLocalUnsavedChange = false;
    if (this.attendanceSheet && this.attendanceSheet[semKey] && this.attendanceSheet[semKey]['sid-' + student.sid] !== undefined) {
        isLocalUnsavedChange = true;
    }
    if (isLocalUnsavedChange && !isPastDate) return 'open';

    // 3. التحقق من الحالات الفارغة
    let isUnmarked = val == null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';
    if (isUnmarked && !isPastDate) return 'open'; // نتركه مفتوحاً لليوم الحالي فقط

    // 🔒 4. تفعيل وضع المعاينة الإجباري للأيام السابقة
    if (isPastDate) {
        // نعرضه كقالب مقفل (سواء رصدته أنت أم الإدارة أم كان فارغاً)
        return (String(enteredBy) === String(this.userDetails.details.user_no)) ? 'locked_mine' : 'locked_other';
    }

    // 5. التحقق الفعلي من بصمة السيرفر لليوم الحالي
    let hasValidEnteredBy = enteredBy != null && String(enteredBy) !== '0' && String(enteredBy) !== 'undefined' && String(enteredBy) !== 'null' && String(enteredBy) !== '';

    if (hasValidEnteredBy) {
        if (String(enteredBy) === String(this.userDetails.details.user_no)) {
            return this.canEdit ? 'open' : 'locked_mine'; 
        } else {
            return 'locked_other'; 
        }
    }

    return 'open';
  }

  updateCurrentLockStatuses() {
    if (!this.attendanceResponse?.students || !this.currentActivePeriod) return;
    this.attendanceResponse.students.forEach((student: any) => {
      student.currentLockStatus = this.getStudentPeriodLockStatus(student, this.currentActivePeriod);
    });
  }

  getStudentPoints() {
   this.dataProvider.getPointsValue().then(res => {
    this.student_points = res.points;
   });   
  }

  viewNote() {
    const navigation: NavigationExtras = {
      state : {
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
    return new Promise((resolve) => {
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
    return new Promise((resolve) => {
      this.dataProvider.postRequest({}, "ManroxTeacherAllowedForEditChk/" + this.userDetails.details.user_no).then((response) => {
        this.teacherType = response?.teacher_type; 

        this.clearTimerSafely(); // 🟢 استخدام الدالة الآمنة
        this.timeLeft = 0;
        this.canEdit = false;

        if (response && response.editPermission) {
          this.canEdit = true;

          if (response.isSubmitted && response.allotedtime != null) {
            this.timeLeft = response.allotedtime - response.time_diffrence;

            if (this.timeLeft > 0) {
              this.canEdit = true; 
              this.interval = setInterval(() => {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                  this.canEdit = false; 
                  this.clearTimerSafely();
                  this.determineNextPeriod(); 
                }
              }, 1000);
            } else {
              this.canEdit = false; 
            }
          }
        }
        resolve();
      }).catch((error) => {
        resolve();
      });
    });
  }

  checkModeratorEditPowers(): Promise<void> {
    return new Promise((resolve) => {
      this.dataProvider.postRequest({}, "ManroxModeratorAllowedForEditChk/" + this.userDetails.details.user_no).then((response) => {
        if (response) {
          let currentDate = new Date();
          if (currentDate.getTime() - this.dateSelected.getTime() < 172800000) {
            this.canEdit = true;
          }
        }
        resolve();
      }).catch((error) => {
        resolve();
      });
    });
  }

  openStudentDetail(student_id: string) {
      if (!this.attMarkBegin) {
        const navigation: NavigationExtras = {
          state : {
            student_id: student_id,
            course_id: this.navData.cid,
            dateSelected: this.dataProvider.getFormatedDate(this.dateSelected)
          }
        };
        this.zone.run(() => {
          this.router.navigate(['student-detail'], navigation);
        });
      } else {
        this.dataProvider.showToast(this.lang.complete_att_submission || "يرجى حفظ الغياب أولاً");
      }
  }

  async openUserImageModal(student: any) {
    if (!this.attMarkBegin) {
      this.student = student;
      await this.studentUi.openStudentProfileModal(
        student, 
        this.userType, 
        this.editMode, 
        (event: any) => { this.takePicture(event); }, 
        (url: string) => { this.openFullscreenImage(url); }
      );
      this.updateStudentLiveStats(student);
    } else {
      this.dataProvider.showToast(this.lang.complete_att_submission);
    }
  }
  
  updateStudentLiveStats(student: any) {
    let requestData = {
      "date": this.dataProvider.getFormatedDate(this.dateSelected),
      "user_no": this.userDetails.details.user_no,
      "session_id": this.userDetails.session_id,
      "course_id": this.navData?.cid || '',
      "school_id": this.userDetails.details.school_id
    };

    this.dataProvider.getFollowUpStudentList(requestData).then((followUpRes: any) => {
      if (followUpRes?.data?.students) {
        let matched = followUpRes.data.students.find((s: any) => s.sid === student.sid);
        if (matched) {
          this.zone.run(() => {
            student.student_points = matched.student_points || 0;
            student.unacceptable_absent_days = matched.unacceptable_absent_days || 0;
            student.suspend_days = matched.suspend_days || 0;
            student.medical_days = matched.medical_days || 0;
          });
        }
      }
    }).catch(() => {});
  }

  openFullscreenImage(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => { this.viewImageUrl = ''; }, 300); 
  }

  openCalenderModal() {
    this.showCalenderModal = true;
  }

  hideCalenderModal() {
    this.showCalenderModal = false;
  }

  onDaySelect(event: any) {
    if (!event.detail.value) return;

    let selectedDate = new Date(event.detail.value);
    let day = selectedDate.getDate().toString().padStart(2, '0');
    let month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    let year = selectedDate.getFullYear();
    let string_date = `${year}-${month}-${day}`;

    let currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); 

    if (selectedDate.getTime() > currentDate.getTime()) {
      this.dataProvider.showToast(this.lang.future_date || "لا يمكن اختيار تاريخ في المستقبل");
      return; 
    }

    if (this.holidayString.includes(string_date)) {
      this.dataProvider.showToast(this.lang.holiday || "هذا اليوم عطلة رسمية");
      return;
    }

    this.dateSelected = selectedDate;
    this.isHoliday = false;
    this.hideCalenderModal();
    this.getStudents(); 
  }

  getSemArray() {
    return new Array(this.totalSem);
  }

  enableEditingMode() {
    this.editMode = true;
    this.dataProvider.showToast(this.lang.edit_mode_enabled);
  }

  async presentAdminActions(event: any) {
    const showAdd = (this.userType == UserRole.Admin || this.canAddStudent);
    const action = await this.studentUi.presentAdminActions(event, showAdd);
    
    this.zone.run(() => {
      if (action === 'add') this.registerNewStudent();
      if (action === 'notes') this.viewNote();
    });
  }

  calculateAttendanceStats(semIndex?: number) {
    if (!this.attendanceResponse?.students) return;
    
    let targetPeriod = (semIndex !== undefined) ? (semIndex + 1) : this.currentActivePeriod;

    const stats = this.attendanceManager.calculatePeriodStats(
      this.attendanceResponse.students, 
      targetPeriod, 
      this.attendanceSheet
    );

    this.totalPresent = stats.present;
    this.totalAbsent = stats.absent;
    this.totalRemaining = stats.remaining;

    this.attMarked = (this.totalRemaining === 0);
  }

  getPeriodStatus(periodNumber: number): string {
    if (!this.attendanceResponse?.students) return 'empty';
    let semKey = 'cem-' + periodNumber;
    let markedCount = 0;
    let totalCount = this.attendanceResponse.students.length;
    
    for (let i = 0; i < totalCount; i++) {
      let status = String(this.attendanceResponse.students[i].sheet[semKey]).trim();
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
    let myUserNo = String(this.userDetails.details.user_no);

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
              let val = student.sheet['cem-' + i];
              let enteredBy = student.sheet['entered_by-' + i];
              let currentStatus = String(val).trim();
              
              let isDelayed = currentStatus === '3' || student.sheet.absentDueToDelay === '1';
              let isUnmarked = val === undefined || val === null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';

              if (isUnmarked) {
                  hasUnassessedStudents = true;
              }

              if (enteredBy && String(enteredBy) !== '0' && String(enteredBy) !== 'undefined' && String(enteredBy) !== 'null' && String(enteredBy) !== myUserNo) {
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

      if (this.attendanceResponse.semteacher && this.attendanceResponse.semteacher[semKey]) {
          let recUserNo = this.attendanceResponse.semteacher[semKey].user_no;
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
                let val = student.sheet['cem-' + i];
                let currentStatus = String(val).trim();
                let enteredBy = student.sheet['entered_by-' + i];

                let isDelayed = currentStatus === '3' || student.sheet.absentDueToDelay === '1';
                let isUnmarked = val == null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';

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
                
                if (this.attendanceResponse.semteacher && this.attendanceResponse.semteacher[semKey]) {
                    let rec = this.attendanceResponse.semteacher[semKey].user_no;
                    if (rec && String(rec) === myUserNo) isMineCheck = true;
                }
                
                if (!isMineCheck) {
                    for (let student of this.attendanceResponse.students) {
                        if (String(student.sheet['entered_by-' + i]) === myUserNo) {
                            isMineCheck = true; break;
                        }
                    }
                }
                
                if (isMineCheck) { lastEditedPeriod = i; break; }
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

  setTeacherAttendance(student: any, status: string) {
    if (this.lockedPeriods.includes(this.currentActivePeriod)) return; 

    let enteredBy = student.sheet['entered_by-' + this.currentActivePeriod];
    let val = student.sheet['cem-' + this.currentActivePeriod];
    let currentStatus = String(val).trim();
    let isUnmarked = val == null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';

    // يعتبر السجل محفوظاً في الداتابيز فقط إذا كان له مدخل (حضور أو غياب) وليس فارغاً
    let isSavedInDb = enteredBy && enteredBy !== 'null' && enteredBy !== '0' && !isUnmarked;

    if (isSavedInDb && String(enteredBy) !== String(this.userDetails.details.user_no) && !this.canEdit) {
      this.dataProvider.showToast('عفواً، تم تسجيل هذا الطالب مسبقاً.');
      return;
    }

    let sem = this.currentActivePeriod - 1;
    let semKey = 'cem-' + (sem + 1);

    if (this.attendanceSheet[semKey] == undefined) {
      this.attendanceSheet[semKey] = {};
      this.attMarkBegin = true;
    }

    if (status === '-1') {
      student.sheet[semKey] = 'undefined';
      delete this.attendanceSheet[semKey]['sid-' + student.sid];
    } else {
      student.sheet[semKey] = status;
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

    this.attendanceResponse.students.forEach((student: any) => {
       let enteredBy = student.sheet['entered_by-' + this.currentActivePeriod];
       let val = student.sheet[semKey];
       let currentStatus = String(val).trim();
       
       let isDelayed = currentStatus === '3' || student.sheet.absentDueToDelay === '1';
       let isUnmarked = val == null || currentStatus === '' || currentStatus === 'undefined' || currentStatus === 'null';

       let isSavedInDb = enteredBy && enteredBy !== 'null' && enteredBy !== '0' && !isUnmarked;
       let isMine = String(enteredBy) === String(this.userDetails.details.user_no);

       if(!isDelayed && (!isSavedInDb || isMine || this.canEdit)) {
           if(status === '-1') {
              student.sheet[semKey] = 'undefined';
              delete this.attendanceSheet[semKey]['sid-' + student.sid];
           } else {
              student.sheet[semKey] = status;
              this.attendanceSheet[semKey]['sid-' + student.sid] = status;
           }
       }
    });

    this.calculateAttendanceStats(sem);
  }

  hasMadeChanges(): boolean {
    return this.attendanceManager.hasMadeChanges(this.attendanceSheet, this.removeSheet);
  }

  changeAttendanceStatus(student: any, sem: number, ind: number) {
    if (this.isViewer) return;
    if (this.isHoliday) { this.dataProvider.showToast(this.lang.holiday); return; }

    // 🟢 السحر هنا: منع تعديل التأخير نهائياً لأي مستخدم!
    let currentStatus = student.sheet['cem-' + (sem + 1)];
    if (String(currentStatus) === '3' || student.sheet.absentDueToDelay === '1') {
      this.dataProvider.showToast("لا يمكن تعديل التأخير من هنا. يرجى تعديله من سجل التأخير.");
      return;
    }

    if (this.isRestrictedModerator && !this.checkCurrentDate(this.dateSelected)) {
      this.dataProvider.showToast("يسمح برصد الغياب لليوم الحالي فقط"); return;
    }

    if (this.isRestrictedModerator) {
      if (this.selectedSem !== -1 && this.selectedSem !== sem) {
        this.dataProvider.showToast("الرجاء حفظ غياب الحصة المحددة قبل الانتقال"); return;
      }
      this.selectedSem = sem;
    }

    if (this.isModeratorWithEdit && !this.isTodayOrYesterday(this.dateSelected)) {
      this.dataProvider.showToast("يسمح بالتعديل لليوم الحالي أو الأمس فقط"); return;
    }

    if (!this.isTeacherUser && !this.editMode && !this.isRestrictedModerator) {
      this.dataProvider.showToast(this.lang.enable_edit || "يرجى تفعيل وضع التعديل أولاً"); return;
    }

    if (this.isRestrictedModerator && student.sheet['entered_by-' + (sem + 1)]) {
      this.dataProvider.showToast("لا تملك صلاحية لتعديل غياب تم رصده مسبقاً"); return;
    }

    if (this.attendanceSheet['cem-' + (sem + 1)] == undefined) {
      this.attendanceSheet['cem-' + (sem + 1)] = {};
      this.attMarkBegin = true;
    }

    // هنا الكود المعتاد للتبديل بين (حاضر، غائب، غير محدد)
    let newStatus = currentStatus == '1' ? '0' : (currentStatus == '0' ? (this.isModeratorWithEdit ? '1' : 'undefined') : '1');

    student.sheet['cem-' + (sem + 1)] = newStatus;

    if (newStatus === 'undefined') {
      delete this.attendanceSheet['cem-' + (sem + 1)]['sid-' + student.sid];
      this.removeSheet[(sem + 1) + '-' + student.sid] = { sid: student.sid, sem: sem + 1 };
    } else {
      this.attendanceSheet['cem-' + (sem + 1)]['sid-' + student.sid] = newStatus;
      if (this.removeSheet[(sem + 1) + '-' + student.sid]) delete this.removeSheet[(sem + 1) + '-' + student.sid];
    }

    this.calculateAttendanceStats(sem);
  }

  changeStatusAllStudents(student: any, sem: number, status: string) {
    if(this.isHoliday) return;

    // 🟢 السحر هنا: استثناء الطالب المتأخر من التغيير الجماعي
    let currentStatus = student.sheet['cem-' + (sem + 1)];
    if (String(currentStatus) === '3' || student.sheet.absentDueToDelay === '1') {
      return; // تجاهل هذا الطالب وابقه متأخراً
    }

    if (this.isRestrictedModerator && !this.checkCurrentDate(this.dateSelected)) return;
    if (this.isModeratorWithEdit && !this.isTodayOrYesterday(this.dateSelected)) return;
    if (!this.isTeacherUser && !this.editMode && !this.isRestrictedModerator) return;
    if (this.isRestrictedModerator && student.sheet['entered_by-' + (sem + 1)]) return;

    if (this.attendanceSheet['cem-' + (sem + 1)] == undefined) {
      this.attendanceSheet['cem-' + (sem + 1)] = {};
      this.attMarkBegin = true;
    }

    student.sheet['cem-' + (sem + 1)] = status;

    if (status === 'undefined') {
      delete this.attendanceSheet['cem-' + (sem + 1)]['sid-' + student.sid];
      this.removeSheet[(sem + 1) + '-' + student.sid] = { sid: student.sid, sem: sem + 1 };
    } else {
      this.attendanceSheet['cem-' + (sem + 1)]['sid-' + student.sid] = status;
      if (this.removeSheet[(sem + 1) + '-' + student.sid]) delete this.removeSheet[(sem + 1) + '-' + student.sid];
    }
    this.calculateAttendanceStats(sem);
  }

  changeAttendanceStatusAll(sem: number) {
    if (this.isViewer) return;
    if(this.isHoliday) { this.dataProvider.showToast(this.lang.holiday); return; }

    let semKey = 'sem-' + (sem + 1);
    let isMarked = this.attendanceResponse?.semteacher && this.attendanceResponse.semteacher[semKey];

    if (isMarked && !this.editMode) {
        this.dataProvider.showToast("تم الرصد بواسطة: " + this.attendanceResponse.semteacher[semKey].teacher);
        return; 
    }

    if (this.isRestrictedModerator && !this.checkCurrentDate(this.dateSelected)) {
      this.dataProvider.showToast("يسمح برصد الغياب لليوم الحالي فقط"); return;
    }

    if (this.isRestrictedModerator) {
      if (this.selectedSem !== -1 && this.selectedSem !== sem) {
        this.dataProvider.showToast("الرجاء حفظ غياب الحصة المحددة حالياً قبل الانتقال لحصة أخرى"); return;
      }
      this.selectedSem = sem;
    }

    if (this.isModeratorWithEdit && !this.isTodayOrYesterday(this.dateSelected)) {
      this.dataProvider.showToast("يسمح بالتعديل لليوم الحالي أو الأمس فقط"); return;
    }

    if (!this.isTeacherUser && !this.editMode && !this.isRestrictedModerator && !this.isAdmin) {
      this.dataProvider.showToast(this.lang.enable_edit || "يرجى تفعيل وضع التعديل أولاً"); return;
    }

    let status = 'undefined';
    let currentClassAllStatus = this.classAll[sem];

    if (this.isAdmin || this.isRestrictedModerator) {
        if(currentClassAllStatus == '') { this.classAll[sem] = 'present'; status = '1'; }
        else if(currentClassAllStatus == 'present') { this.classAll[sem] = 'absent'; status = '0'; }
        else if(currentClassAllStatus == 'absent') { this.classAll[sem] = ''; status = 'undefined'; }
    } else {
        if(currentClassAllStatus == '') { this.classAll[sem] = 'present'; status = '1'; }
        else if(currentClassAllStatus == 'present') { this.classAll[sem] = 'absent'; status = '0'; }
        else if(currentClassAllStatus == 'absent') { this.classAll[sem] = 'present'; status = '1'; }
    }

    this.attendanceResponse.students.forEach((student: any) => {
        this.changeStatusAllStudents(student, sem, status); 
    });
  }

  checkCurrentDate(date: Date) {
    let currentDate = new Date();
    return (date.getDate() == currentDate.getDate() && date.getMonth() == currentDate.getMonth() && date.getFullYear() == currentDate.getFullYear());
  }

  async takePicture(event?: any) {
    const result = await this.studentEngagement.captureAvatarImage(event, this.lang);
    if (result.base64) {
      this.zone.run(() => this.ChangeStudentProfileAvatar(result.base64));
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
          const index = this.attendanceResponse.students.findIndex((s: any) => s.sid === this.student.sid);
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
      this.imageService.convertUrlToBase64(selectedAvatarUrl).then(base64 => {
        this.ChangeStudentProfileAvatar(base64);
      }).catch(err => {
        this.dataProvider.hideLoading();
        this.dataProvider.errorALertMessage("تعذر معالجة الصورة الرمزية، حاول مجدداً.");
      });
    }
  }

  async ChangeStudentProfileAvatar(base64Data: string) {
    if (!base64Data) {
      this.dataProvider.hideLoading();
      return;
    }

    try {
      const result = await this.dataProvider.run(() => this.studentEngagement.uploadAvatar(base64Data, {
        user_no: this.userDetails.details.user_no,
        session_id: this.userDetails.session_id,
        sid: this.student.sid
      }));

      if (result.success) {
        const newPicUrl = result.url;

        this.zone.run(() => {
          // 1. تحديث الكائن المحلي
          this.student.pic = newPicUrl;

          // 2. تحديث المصفوفة الحية (التي تتصل بالشاشة والمودال)
          if (this.attendanceResponse && this.attendanceResponse.students) {
             const liveIdx = this.attendanceResponse.students.findIndex((s: any) => s.sid === this.student.sid);
             if (liveIdx > -1) {
                this.attendanceResponse.students[liveIdx].pic = newPicUrl;
                this.attendanceResponse.students[liveIdx] = { ...this.attendanceResponse.students[liveIdx] };
             }
          }

          // 3. تحديث المصفوفة الاحتياطية لتجنب أي أخطاء مستقبلية
          if (this.students && this.students.length > 0) {
             const backupIdx = this.students.findIndex((s: any) => s.sid === this.student.sid);
             if (backupIdx > -1) {
                this.students[backupIdx].pic = newPicUrl;
             }
          }

          if (this.cdr) this.cdr.detectChanges();
        });

        this.dataProvider.showToast("تم تحديث الصورة بنجاح");
      } else {
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(result.message);
      }
    } catch (error: any) {
      this.dataProvider.errorALertMessage(error?.message || "حدث خطأ في الاتصال بالخادم.");
    }
  }

  submitAttendance() {
    let hasChanges = this.hasMadeChanges();

    if (this.isAdmin || this.isModerator) {
      if (!hasChanges) {
        this.dataProvider.showToast("لا توجد تعديلات جديدة لحفظها."); return;
      }
      if (this.isModerator && this.isAnyModifiedPeriodIncomplete()) {
        this.dataProvider.showToast("عذراً، يجب إكمال الحصة بالكامل قبل الحفظ."); return;
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
    let data: any = {
      sheet: this.attendanceSheet,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      cid: this.navData?.cid,
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      removal_sheet: this.removeSheet,
      school_id: this.userDetails.details.school_id,
      user_type: String(this.userDetails.details.user_type || '1'),
      username: this.userDetails.details.first_name || this.userDetails.details.username || 'الإدارة'
    };


      if (this.isOnline()) {
        this.sendAttendanceToServer(data); 
      } else {
        this.dataProvider.hideLoading();
        let attendance = await this.storageSr.get("attendance") || [];
        attendance.push(data);
        await this.storageSr.set("attendance", attendance);
        this.dataProvider.showToast(this.lang.offline_att_stored);
        this.attendanceSheet = {};
        this.removeSheet = {};
        this.editMode = false;
        this.attMarkBegin = false;
      }
  
  }

  sendAttendanceToServer(data: any) {
    this.attendanceApi.markAttendance(data).then((response) => {
      this.dataProvider.hideLoading();
      this.dataProvider.showToast(response.message || "تم حفظ الغياب بنجاح");
      this.attendanceSheet = {};
      this.removeSheet = {};
      this.editMode = false;
      this.attMarkBegin = false;
      this.getStudents(false); 
    }).catch((error) => {
      this.dataProvider.hideLoading();
      this.dataProvider.errorALertMessage(error || "حدث خطأ أثناء الحفظ.");
    });
  }

  checkAttendence(): boolean {
    return this.attendanceManager.isPeriodAttendanceComplete(
      this.attendanceResponse.students, 
      this.currentActivePeriod, 
      this.attendanceSheet
    );
  }
isOnline(): boolean {
  if (this.platform.is('cordova') || this.platform.is('capacitor')) {
    return this.network.type !== this.network.Connection.NONE &&
           this.network.type !== this.network.Connection.UNKNOWN;
  }

  return navigator.onLine;
}
  async registerNewStudent() {
    this.translate.get("reg_student").subscribe(async (response) => {
      this.addStudentLang = response; 
      const result = await this.studentUi.openAddStudent(this.addStudentLang);
      if (result) {
        this.newStudentName = result.name;
        this.newStudentId = result.id;
        this.checkPlanAndRegister(); 
      }
    });
  }

  checkPlanAndRegister() {
    let data = { "school_id": this.userDetails.details.school_id };

    this.dataProvider.run(() => this.dataProvider.getCountStudents(data)).then(res => {
      var totalStudents = res.data;
      if(this.AvailablePlan.isExpire == true){
        this.dataProvider.showToast("This feature is part of subscription plan.Please subscribe plan!");
        return;
      }
      let studentData = { student_name: this.newStudentName, student_id: this.newStudentId };
      this.addNewStudent(studentData, this.addStudentLang);
    }).catch(err => {
      this.dataProvider.errorALertMessage(err);
    });
  }

  addNewStudent(data, response){
    data.student_id = parseInt(data.student_id);
    if(Number.isInteger(data.student_id)){
      this.dataProvider.run(() => this.dataProvider.registerStudent({
        "name": data.student_name,
        "student_id": data.student_id,
        "user_no": this.userDetails.details.user_no,
        "school_id": this.userDetails.details.school_id,
        "course_id": this.courseInfo.cid
      })).then((res)=>{
        if(res.session){
          this.getStudents(false);
          this.dataProvider.showToast(this.lang.create_student_success_msg);
        }else{
          this.dataProvider.showToast(res.message);
        }
      }).catch((err)=>{
        this.dataProvider.errorALertMessage(err);
      });
    }else{
      this.dataProvider.showToast(response.invalid_stu_id);
    }
  }

  async presentNoteActionSheet(event: any, student: any) {
    const action = await this.studentUi.presentStudentOptions(event, student, this.student_detailse);
    this.zone.run(() => {
      if (action === 'review') this.openNoteModal(student, 'review');
      if (action === 'note') this.openNoteModal(student, 'note');
      if (action === 'points') this.openSkillTreeModal(student);
    });
  }

  async openSkillTreeModal(student: any) {
    const result = await this.studentUi.openSkillTree(student);
    if (result && result.skillType && result.points) {
      this.awardSkillPoints(student, result.skillType, result.points);
    }
  }

  async awardSkillPoints(student: any, skillType: string, point: number) {
    let body = {
      sid: String(student.sid),
      userId: String(this.userDetails.details.user_no),
      points: "+" + point,
      skill_type: skillType
    };

    try {
      const res: any = await this.dataProvider.run(() => this.studentEngagement.awardSkillPoints(body));
      this.zone.run(() => {
        if (res && res.success) {
          this.dataProvider.showToast(`تمت إضافة ${point} نقطة بنجاح!`);
          student.student_points = Number(student.student_points || 0) + point;
        } else {
          this.showModernWarning(res?.msg || 'تعذر إضافة النقاط');
        }
      });
    } catch (err: any) {
      this.zone.run(() => {
        this.showModernWarning(`خطأ: ${typeof err === 'string' ? err : err?.message}`);
      });
    }
  }

  async openNoteModal(student: any, mode: 'note' | 'review') {
    const result = await this.studentUi.openNoteOrReviewModal(student, mode);
    if (result.mode === 'note' && result.data?.noteMessage) {
      this.submitTextNote(student, result.data.noteMessage);
    } else if (result.mode === 'review' && result.data?.data) {
      this.submitReviewNote(student, result.data.data, result.data.noteMessage);
    }
  }

  // 🟢 7. إصلاح دالتي إرسال الملاحظات (إضافة date و course_id الناقصة)
  submitTextNote(student: any, message: string) {
    let data = {
      sid: student.sid,
      note: message,
      user_id: this.userDetails.details.user_no,
      rating: 0,
      new_rating: JSON.stringify([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      course_id: this.navData?.cid || ''
    };

    this.dataProvider.run(() => this.studentEngagement.addNote(data)).then(() => {
      this.dataProvider.showToast(this.lang.add_note_success_message);
    }).catch(error => {
      this.dataProvider.errorALertMessage(error);
    });
  }

  submitReviewNote(student: any, stars: number, message: string) {
    let data = {
      sid: student.sid,
      note: message,
      user_id: this.userDetails.details.user_no,
      rating: stars,
      new_rating: JSON.stringify(stars),
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      course_id: this.navData?.cid || ''
    };

    this.dataProvider.run(() => this.studentEngagement.addNote(data)).then(() => {
      this.dataProvider.showToast(this.lang.add_review_success_message);
    }).catch(error => {
      this.dataProvider.errorALertMessage(error);
    });
  }

  isTodayOrYesterday(date: Date): boolean {
    let today = new Date();
    let yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    let d = new Date(date);
    return (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) ||
           (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear());
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
      this.dataProvider.showToast("عذراً، يسمح لك بالتعديل لليوم الحالي أو الأمس فقط");
      return;
    }
    this.toggleEditMode();
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.attendanceSheet = {};
      this.removeSheet = {};
      this.dataProvider.showToast("تم إلغاء التعديلات بنجاح");
      this.getStudents(false); 
    } else {
      this.dataProvider.showToast(this.lang.edit_mode_enabled || "تم تفعيل وضع التعديل");
    }
  }

  showModernWarning(msg: string) {
    this.warningType = (msg.includes('مجم') || msg.includes('تجميد')) ? 'frozen' : 'warning';
    this.warningMessage = msg;
    this.showWarningPopup = true;
  }

  closeWarningPopup() {
    this.showWarningPopup = false;
  }

  isStudentFrozen(student: any): boolean {
    if (!student || !student.frozen_until) return false;
    const today = new Date().toISOString().split('T')[0]; 
    return student.frozen_until >= today;
  }

  getStudentTitle(student: any): string {
    if (!student) return '';
    const skillsData = {
      cognitive: Number(student?.cognitive || 0),
      social: Number(student?.social || 0),
      discipline: Number(student?.discipline || 0),
      emotional: Number(student?.emotional || 0),
      practical: Number(student?.practical || 0)
    };
    return this.gamification.getFinalStudentTitle(student?.active_crafted_title || null, skillsData, Number(student?.student_points || 0));
  }
}