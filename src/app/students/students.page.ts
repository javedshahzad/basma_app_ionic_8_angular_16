import { Component, NgZone, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavController,
  NavParams,
  AlertController,
  Platform,
  PopoverController,
  ActionSheetController,
  ModalController,
  IonicModule
} from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService, getFileReader } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { CameraResultType, Camera, ImageOptions, CameraSource } from '@capacitor/camera';
import { Network } from '@capacitor/network';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// الاستيرادات الخاصة بالصورة والنوافذ
import { Filesystem } from '@capacitor/filesystem';
import { FileUploadService } from '../service/file-upload/file-upload.service';
import { AvatarImagesComponent } from '../components/avatar-images/avatar-images.component';
import { ImageOptionPopoverComponent } from '../components/image-option-popover/image-option-popover.component';
import { StudentPointsPopoverComponent } from '../components/student-points-popover/student-points-popover.component';
import { StudentOptionsPopoverComponent } from '../components/student-options-popover/student-options-popover.component';
import { AddReviewComponent } from '../add-review/add-review.component';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { StudentUiService } from '../service/student-ui/student-ui.service';
import { ImageProcessingService } from '../service/image-processing/image-processing.service';
import { AttendanceApiService, AttendanceSubmitPayload } from '../service/attendance-api/attendance-api.service';
import { HolidaysApiService } from '../service/holidays-api/holidays-api.service';
import { StudentEngagementService } from '../service/student-engagement/student-engagement.service';
import { GamificationApiService } from '../service/gamification-api/gamification-api.service';
import { UserType } from '../constants/user-type';
import { NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { ɵɵDir, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { Student } from '../model/student.model';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';
import { Course } from '../service/courses-api/courses-api.service';
import { HasRoleDirective } from '../directives/has-role.directive';

@Component({
  selector: 'app-students',
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonicModule,
    NgClass,
    ɵɵDir,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    DecimalPipe,
    DatePipe,
    TranslatePipe,
    HasRoleDirective
  ]
})
export class StudentsPage {
  readonly UserType = UserType;
  private destroyRef = inject(DestroyRef);
  showProfileModal: boolean = false;
  students: Student[] = [];
  dateSelected: Date;
  student: Student = {};
  userDetails: LoggedInUser = {};
  showCalenderModal: boolean = false;
  attendanceSheet: Record<string, string> = {};
  userType: string | number;
  attMarkBegin: boolean = false;
  attNotMarked: boolean = true;
  lang: Record<string, string> = {};
  delayRule: number = 5;
  editMode: boolean = false;
  holidayString: string = '';
  currentEvents: unknown[] = [];
  isHoliday: boolean = false;
  noDataFound: string = '';
  studentBehaviour: string = '';
  courseInfo: Course = {};
  navData: Record<string, unknown>;
  show_loading: boolean = false;

  // متغيرات الملاحظات
  canAddStudentNote: boolean = true;
  noteMessage: string = '';
  studentData: Student;
  ratingStars: number = 1;
  selections: string[] = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
  showNoteModal: boolean = false;
  student_detailse: Record<string, string> = {};
  student_points: number[] = [];
  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after the
  // constructor's `if (userLoggedIn)` guard has already populated it —
  // the non-null assertion documents that invariant once instead of at
  // every access site.
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
    public platform: Platform,
    public popoverController: PopoverController,
    public actionSheetController: ActionSheetController,
    public modalController: ModalController,
    private fileUpload: FileUploadService,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private imageService: ImageProcessingService,
    private studentUi: StudentUiService,
    private attendanceApi: AttendanceApiService,
    private holidaysApi: HolidaysApiService,
    private studentEngagement: StudentEngagementService,
    private gamificationApi: GamificationApiService
  ) {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async params => {
      const nav = this.router.getCurrentNavigation();
      if (nav && nav.extras.state) {
        this.navData = nav.extras.state['course'];
        await this.storageSr.set('currentStudentsCourse', this.navData);
      } else {
        this.navData = await this.storageSr.get('currentStudentsCourse');
        if (!this.navData) {
          this.navCtrl.back();
          return;
        }
      }

      let userLoggedIn = await this.storageSr.get('userloggedin');

      if (userLoggedIn) {
        this.dateSelected = new Date();
        this.userDetails = userLoggedIn;
        this.userType = this.userInfo.user_type || '';
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
              this.checkIfHoliday();
            }
            this.cdr.markForCheck();
          })
          .catch(error => {
            this.dataProvider.hideLoading();
          });

        this.show_loading = true;
        this.getStudents();
        this.cdr.markForCheck();
      } else {
        this.dataProvider.hideLoading();
        this.authProvider.flushLocalStorage();
        this.router.navigate(['login'], { replaceUrl: true });
      }
    });

    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });

    this.translate.get('student-details').subscribe(val => {
      this.student_detailse = val;
      this.cdr.markForCheck();
    });
  }

  trackByStudent(index: number, student: Student): string | number {
    return student?.sid ?? index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  ionViewWillEnter() {
    this.getStudentPoints();
    this.editMode = false;
  }

  checkIfHoliday() {
    let day: string | number = this.dateSelected.getDate();
    day = day < 10 ? '0' + day : day;
    let month: string | number = this.dateSelected.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    let strint_date = this.dateSelected.getFullYear() + '-' + month + '-' + day;
    this.isHoliday = this.holidayString.indexOf(strint_date) > -1;
  }

  getStudentPoints() {
    this.gamificationApi.getPointsValue().then(res => {
      this.student_points = res.points || [];
      this.cdr.markForCheck();
    });
  }

  async getStudents(loader: boolean = true) {
    if (loader) this.show_loading = true;
    let course = this.navData;
    this.courseInfo = course;
    let studentData = {
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      user_no: this.userInfo.user_no,
      session_id: this.userDetails.session_id,
      course_id: course.cid,
      school_id: this.userInfo.school_id
    };

    let delayClassLocalAtt = await this.storageSr.get('delayclasslocalatt');
    if (delayClassLocalAtt) {
      let attendance = delayClassLocalAtt;
      Object.keys(attendance).map(async courseId => {
        if (!this.checkCurrentDate(new Date(attendance[courseId].date))) {
          await this.storageSr.remove('delayclasslocalatt');
        }
      });
    }

    this.attendanceApi.getDelayClassStudentList(studentData).then(async res => {
      this.show_loading = false;
      if (res.success && res.data) {
        let responseData = res.data;
        this.delayRule = parseInt(String(responseData.delay_rule));
        this.students = responseData.students || [];
        this.attMarkBegin = false;
        this.attendanceSheet = {};

        if (this.students.length == 0) {
          this.noDataFound = this.lang.no_students_in_class;
        }

        if (this.checkDateSelected(new Date())) {
          let currentDelayClassLocalAtt = (await this.storageSr.get('delayclasslocalatt')) || {};
          responseData.date = this.dataProvider.getFormatedDate(this.dateSelected);
          currentDelayClassLocalAtt[course.cid as string] = responseData;
          await this.storageSr.set('delayclasslocalatt', currentDelayClassLocalAtt);
        }
      } else {
        this.show_loading = false;
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(res.message || '');
        this.router.navigate(['login'], { replaceUrl: true });
      }
      this.cdr.markForCheck();
    });
  }

  // 🟢 دالة التبديل الذكية المطابقة لصفحة الغياب
  toggleEditMode() {
    if (this.userType == UserType.Admin) {
      this.editMode = !this.editMode;
      if (!this.editMode) {
        // إذا قام بإلغاء التعديل، نصفر التغييرات ونعيد تحميل البيانات
        this.attendanceSheet = {};
        this.attMarkBegin = false;
        this.dataProvider.showToast(this.lang.changes_cancelled || 'تم إلغاء التعديلات');
        this.getStudents(false);
      } else {
        this.dataProvider.showToast(this.lang.edit_mode_enabled || 'تم تفعيل وضع التعديل');
      }
    } else {
      this.dataProvider.showToast(this.lang.not_permission_to_enable || 'ليس لديك صلاحية لتفعيل هذا النمط');
    }
  }

  // 🟢 تعديل دالة النقر على الغياب لتدعم الرسائل الذكية
  changeAttendanceStatus(student: Student) {
    if (this.isHoliday) {
      this.dataProvider.showToast(this.lang.holiday || 'لا يمكن التعديل في يوم عطلة');
      return;
    }

    if (student.suspend_leave || student.medical_leave) {
      this.dataProvider.showToast(this.lang.att_modification_error || 'الطالب مجاز طبياً أو موقوف');
      return;
    }

    if (this.userType == UserType.Admin) {
      if (this.editMode) {
        this.toggleAttendance(student);
      } else {
        this.dataProvider.showToast(this.lang.enable_edit_mode_first || 'يرجى تفعيل وضع التعديل من الزر بالأسفل أولاً');
      }
    } else if (this.userType == UserType.Moderator && this.checkDateSelected(new Date())) {
      // 🟢 المشرف الإداري لا يحتاج لتفعيل نمط التعديل
      this.toggleAttendance(student);
    } else {
      this.dataProvider.showToast(this.lang.att_modification_error || 'لا تملك صلاحية التعديل');
    }
  }

  openStudentDetail(student_id: string | number, student: Student) {
    if (!this.attMarkBegin) {
      const navigation: NavigationExtras = {
        state: {
          student_id: student_id,
          course_id: this.navData.cid,
          dateSelected: this.dataProvider.getFormatedDate(this.dateSelected),
          total_delay: student.total_delay
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
      // 🟢🟢 السطر السحري المفقود الذي يحل المشكلة جذرياً 🟢🟢
      this.student = student;

      let behaviour = this.lang.no_behaviour;
      const aggRanking = student.agg_ranking || 0;
      if (aggRanking > 0 && aggRanking < 2.6) behaviour = this.lang.warning_behaviour;
      else if (aggRanking > 2.5 && aggRanking < 3.6) behaviour = this.lang.good_behaviour;
      else if (aggRanking > 3.5 && aggRanking < 4.6) behaviour = this.lang.very_good_behaviour;
      else if (aggRanking > 4.5 && aggRanking < 5.1) behaviour = this.lang.excellent_behaviour;

      student.studentBehaviour = behaviour;

      const { StudentProfileModalComponent } =
        await import('../components/student-profile-modal/student-profile-modal.component');
      const modal = await this.modalController.create({
        component: StudentProfileModalComponent,
        cssClass: 'profile-modal-class',
        componentProps: {
          student: this.student, // 🟢 تم التمرير من المتغير المربوط بالواجهة
          userType: this.userType,
          editMode: this.editMode,
          onPhotoClick: (event: Event) => {
            this.takePicture(event);
          },
          onFullscreenClick: (url: string) => {
            this.openFullscreenImage(url);
          },
          sessionId: this.userDetails.session_id
        }
      });
      return await modal.present();
    } else {
      this.dataProvider.showToast(this.lang.complete_att_submission);
    }
  }

  openFullscreenImage(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => {
      this.viewImageUrl = '';
      this.cdr.markForCheck();
    }, 300);
  }

  async openCalenderModal() {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      if (!(await Network.getStatus()).connected) {
        this.dataProvider.showToast(this.lang.no_internet);
        return;
      }
    }
    this.showCalenderModal = true;
    this.cdr.markForCheck();
  }

  hideCalenderModal() {
    this.showCalenderModal = false;
  }

  onDaySelect(event: CustomEvent) {
    if (!event.detail.value) return;
    let selectedDate = new Date(event.detail.value);
    let currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999);

    if (selectedDate.getTime() > currentDate.getTime()) {
      this.dataProvider.showToast(this.lang.future_date || 'لا يمكن اختيار تاريخ مستقبلي');
      return;
    }

    this.dateSelected = selectedDate;
    this.checkIfHoliday();

    if (this.isHoliday) {
      this.dataProvider.showToast(this.lang.holiday);
    }

    this.hideCalenderModal();
    this.getStudents();
  }

  toggleAttendance(student: Student) {
    this.attMarkBegin = true;
    this.attNotMarked = false;

    if (!student.sheet) student.sheet = {};
    const sheet = student.sheet;

    if (sheet['cem-1']) {
      sheet['cem-1'] = false;
      this.attendanceSheet['sid-' + student.sid] = '0';
    } else {
      sheet['cem-1'] = true;
      this.attendanceSheet['sid-' + student.sid] = '1';
    }
  }

  checkDateSelected(date: Date) {
    return (
      date.getDate() == this.dateSelected.getDate() &&
      date.getMonth() == this.dateSelected.getMonth() &&
      date.getFullYear() == this.dateSelected.getFullYear()
    );
  }

  // 🟢 تحديث دالة الحفظ لتقوم بإغلاق وضع التعديل تلقائياً
  async submitAttendance() {
    if (this.attMarkBegin) {
      this.dataProvider.showLoading();
      let data: AttendanceSubmitPayload = {} as AttendanceSubmitPayload;
      data.sheet = {};
      data.sheet['cem-1'] = {};
      const cem1Sheet = data.sheet['cem-1'];
      data.user_no = this.userInfo.user_no!;
      data.session_id = this.userDetails.session_id!;
      data.cid = this.navData.cid as string | number;
      data.date = this.dataProvider.getFormatedDate(this.dateSelected);
      data.school_id = this.userInfo.school_id!;

      Object.keys(this.attendanceSheet).map(key => {
        cem1Sheet[key] = this.attendanceSheet[key];
      });

      let submittedByUser = this.userType == UserType.Admin ? 1 : this.userType == UserType.Moderator ? 2 : 0;

      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        if ((await Network.getStatus()).connected) {
          this.attendanceApi
            .markDelayAttendance(data, submittedByUser)
            .then(response => {
              this.dataProvider.hideLoading();
              if (response) {
                // 🟢 بعد الحفظ بنجاح: أغلق نمط التعديل وأعد تحميل الطلاب
                this.editMode = false;
                this.attMarkBegin = false;
                this.getStudents(false);
                this.dataProvider.showToast(this.lang.saved_successfully || 'تم الحفظ بنجاح');
              }
              this.cdr.markForCheck();
            })
            .catch(error => {
              this.dataProvider.hideLoading();
              this.dataProvider.errorALertMessage(error);
            });
        } else {
          this.dataProvider.hideLoading();
          let delayAttendance = (await this.storageSr.get('delayattendance')) || [];
          delayAttendance.push({ attendance: data, submittedByUser: submittedByUser });
          await this.storageSr.set('delayattendance', delayAttendance);

          // 🟢 للإرسال في وضع الأوفلاين أيضاً
          this.editMode = false;
          this.attMarkBegin = false;
          this.dataProvider.showToast(this.lang.offline_att_stored || 'تم الحفظ أوفلاين');
          this.getStudents(false);
          this.cdr.markForCheck();
        }
      } else {
        this.attendanceApi
          .markDelayAttendance(data, submittedByUser)
          .then(response => {
            this.dataProvider.hideLoading();
            if (response) {
              // 🟢 للمتصفح أيضاً
              this.editMode = false;
              this.attMarkBegin = false;
              this.getStudents(false);
              this.dataProvider.showToast(this.lang.saved_successfully || 'تم الحفظ بنجاح');
            }
            this.cdr.markForCheck();
          })
          .catch(error => {
            this.dataProvider.hideLoading();
            this.dataProvider.errorALertMessage(error);
          });
      }
    } else {
      this.dataProvider.showToast(this.lang.select_att_to_update);
    }
  }

  // ================= دوال قائمة الإجراءات والنقاط =================
  async presentNoteActionSheet(event: Event, student: Student) {
    if (this.platform.width() >= 768 && event) {
      const popover = await this.popoverController.create({
        component: StudentOptionsPopoverComponent,
        event: event,
        componentProps: { student: student },
        mode: 'md',
        translucent: true,
        cssClass: 'custom-popover'
      });
      await popover.present();

      const { data } = await popover.onDidDismiss();

      this.zone.run(() => {
        if (data && data.selectedAction === 'review') this.openNoteModal(student, 'review');
        if (data && data.selectedAction === 'note') this.openNoteModal(student, 'note');
        if (data && data.selectedAction === 'points') this.presentPointsActionSheet(event, student);
      });
    } else {
      const actionSheet = await this.actionSheetController.create({
        header: `إجراءات الطالب: ${student.name}`,
        cssClass: 'custom-action-sheet',
        mode: 'md',
        buttons: [
          {
            text:
              this.student_detailse && this.student_detailse.student_review
                ? this.student_detailse.student_review
                : 'تقييم الطالب',
            icon: 'star-outline',
            handler: () => {
              this.openNoteModal(student, 'review');
            }
          },
          {
            text:
              this.student_detailse && this.student_detailse.student_note
                ? this.student_detailse.student_note
                : 'إضافة ملاحظة',
            icon: 'document-text-outline',
            handler: () => {
              this.openNoteModal(student, 'note');
            }
          },
          {
            text:
              this.student_detailse && this.student_detailse.student_point
                ? this.student_detailse.student_point
                : 'نقاط الطالب',
            icon: 'medal-outline',
            handler: () => {
              this.presentPointsActionSheet(null, student);
            }
          },
          {
            text: this.student_detailse && this.student_detailse.cancel ? this.student_detailse.cancel : 'إلغاء',
            icon: 'close',
            role: 'cancel',
            cssClass: 'text-rose-500 font-bold'
          }
        ]
      });
      await actionSheet.present();
    }
  }

  async presentPointsActionSheet(event: Event | null, student: Student) {
    if (this.platform.width() >= 768 && event) {
      const popover = await this.popoverController.create({
        component: StudentPointsPopoverComponent,
        event: event,
        componentProps: { student: student, points: this.student_points },
        mode: 'md',
        translucent: true,
        cssClass: 'custom-popover'
      });
      await popover.present();

      const { data } = await popover.onDidDismiss();
      this.zone.run(() => {
        if (data && data.point) {
          this.addStudentPoints(data.point, student);
        }
      });
    } else {
      const actionSheet = await this.actionSheetController.create({
        header: `منح نقاط للطالب: ${student.name}`,
        cssClass: 'custom-action-sheet',
        mode: 'md',
        buttons: this.createButtons(student)
      });
      await actionSheet.present();
    }
  }

  createButtons(student: Student) {
    let buttons = [];
    for (var index in this.student_points) {
      let pointValue = this.student_points[index];
      let button = {
        text: String(pointValue),
        icon: 'add-circle-outline',
        cssClass: 'text-emerald-600 font-bold',
        handler: () => {
          this.addStudentPoints(pointValue, student);
        }
      };
      buttons.push(button);
    }

    buttons.push({
      text: this.student_detailse && this.student_detailse.cancel ? this.student_detailse.cancel : 'إلغاء',
      icon: 'close',
      role: 'cancel',
      cssClass: 'text-rose-500 font-bold border-t border-slate-100',
      handler: () => {}
    });

    return buttons;
  }

  addStudentPoints(point: string | number, student: Student) {
    let body = {
      sid: student.sid,
      userId: this.userInfo.user_no,
      points: point,
      session_id: this.userDetails.session_id
    };
    this.studentEngagement.awardSkillPoints(body).then(res => {
      if (res.success) {
        this.dataProvider.showToast(res.msg || '');
      }
    });
  }

  async openNoteModal(student: Student, mode: 'note' | 'review') {
    if (mode === 'note') {
      this.studentData = student;
      this.showNoteModal = true;
      this.cdr.markForCheck();
    } else {
      this.studentData = student;
      const modal = await this.modalController.create({
        component: AddReviewComponent,
        cssClass: 'my-custom-class'
      });
      modal.onDidDismiss().then(data => {
        if (data && data.data && data.data.data) {
          this.ratingStars = data.data.data;
          this.noteMessage = data.data.noteMessage;
          this.addNotesNote();
        }
        this.cdr.markForCheck();
      });
      return await modal.present();
    }
  }

  hideNoteModal() {
    this.showNoteModal = false;
  }

  getSelectedStars() {
    return new Array(5);
  }

  selectStarsForRating(index: number) {
    this.ratingStars = index + 1;
    this.selections = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
    for (let i = 0; i <= index; i++) {
      this.selections[i] = '#04855f';
    }
  }

  addNotesNote() {
    if (this.noteMessage && this.noteMessage.trim() != '') {
      if (this.noteMessage.length <= 45) {
        if (this.canAddStudentNote) {
          let data = {
            sid: this.studentData.sid,
            note: this.noteMessage,
            user_id: this.userInfo.user_no,
            rating: this.ratingStars,
            new_rating: JSON.stringify(this.ratingStars),
            session_id: this.userDetails.session_id
          };
          this.studentEngagement
            .addNote(data)
            .then(note_id => {
              this.noteMessage = '';
              this.showNoteModal = false;
              this.dataProvider.showToast(this.lang.add_review_success_message);
              this.cdr.markForCheck();
            })
            .catch(error => {
              this.dataProvider.hideLoading();
              this.dataProvider.errorALertMessage(error);
            });
        } else {
          this.dataProvider.showToast(this.lang.already_submit_note);
        }
      } else {
        this.dataProvider.showToast(this.lang.max_note_length);
      }
    } else {
      this.dataProvider.showToast(this.lang.empty_note);
    }
  }

  addTextNotesNote() {
    if (this.noteMessage && this.noteMessage.trim() != '') {
      if (this.noteMessage.length <= 45) {
        if (this.canAddStudentNote) {
          let data = {
            sid: this.studentData.sid,
            note: this.noteMessage,
            user_id: this.userInfo.user_no,
            rating: 0,
            new_rating: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            session_id: this.userDetails.session_id
          };
          this.dataProvider
            .run(() => this.studentEngagement.addNote(data))
            .then(note_id => {
              this.noteMessage = '';
              this.showNoteModal = false;
              this.dataProvider.showToast(this.lang.add_note_success_message);
              this.cdr.markForCheck();
            })
            .catch(error => {
              this.dataProvider.errorALertMessage(error);
            });
        } else {
          this.dataProvider.showToast(this.lang.already_submit_note);
        }
      } else {
        this.dataProvider.showToast(this.lang.max_note_length);
      }
    } else {
      this.dataProvider.showToast(this.lang.empty_note);
    }
  }

  // ================= دوال الكاميرا وتغيير الصورة =================
  async takePicture(event?: Event) {
    if ((await Network.getStatus()).connected) {
      if (this.platform.width() >= 768 && event) {
        const popover = await this.popoverController.create({
          component: ImageOptionPopoverComponent,
          event: event,
          mode: 'ios',
          translucent: true,
          cssClass: 'custom-popover'
        });
        await popover.present();

        const { data } = await popover.onDidDismiss();
        this.zone.run(() => {
          if (data && data.selectedAction === 'camera') this.openCamera();
          if (data && data.selectedAction === 'gallery') this.openGallery();
          if (data && data.selectedAction === 'avatar') this.OpenAvatarModel();
        });
      } else {
        const actionSheet = await this.actionSheetController.create({
          header: this.lang.image_option || 'تغيير صورة الطالب',
          cssClass: 'custom-action-sheet',
          mode: 'md',
          buttons: [
            {
              text: this.lang.camera || 'التقاط بالكاميرا',
              icon: 'camera-outline',
              handler: () => {
                this.openCamera();
              }
            },
            {
              text: this.lang.gallery || 'اختيار من المعرض',
              icon: 'image-outline',
              handler: () => {
                this.openGallery();
              }
            },
            {
              text: this.lang.avatar || 'اختيار صورة رمزية',
              icon: 'people-circle-outline',
              handler: () => {
                this.OpenAvatarModel();
              }
            },
            { text: this.lang.cancel || 'إلغاء', icon: 'close', role: 'cancel', cssClass: 'text-rose-500 font-bold' }
          ]
        });
        await actionSheet.present();
      }
    } else {
      this.dataProvider.showToast(this.lang.no_internet);
    }
  }

  openCamera() {
    const options: ImageOptions = {
      quality: 100,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 500,
      height: 500,
      allowEditing: true
    };
    Camera.getPhoto(options).then(imageData => {
      if (imageData) {
        this.ChangeStudentProfileAvatar(imageData.base64String || '');
      }
    });
  }

  openGallery() {
    const options: ImageOptions = {
      quality: 100,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 500,
      height: 500,
      allowEditing: true
    };
    Camera.getPhoto(options).then(imageData => {
      if (imageData) {
        this.ChangeStudentProfileAvatar(imageData.base64String || '');
      }
    });
  }

  async OpenAvatarModel() {
    const data = await this.studentUi.openAvatarModal(this.student);

    if (data && data.image_url) {
      // تنظيف الرابط من السلاش المزدوج
      let cleanUrl = data.image_url.replace(/([^:]\/)\/+/g, '$1');

      // التحديث الفوري للصورة في الشاشة لراحة المستخدم (Optimistic UI)
      this.zone.run(() => {
        this.student.pic = cleanUrl;

        if (this.students && this.students.length > 0) {
          const idx = this.students.findIndex((s: Student) => s.sid === this.student.sid);
          if (idx > -1) {
            this.students[idx].pic = cleanUrl;
            // ❌ تم حذف سطر الاستنساخ {...} هنا أيضاً!
          }
        }
        this.cdr.detectChanges();
      });

      // إكمال المعالجة والرفع للسيرفر
      this.dataProvider.showLoading();
      this.imageService
        .convertUrlToBase64(cleanUrl)
        .then(base64 => {
          this.ChangeStudentProfileAvatar(base64);
        })
        .catch(err => {
          this.dataProvider.hideLoading();
          this.dataProvider.errorALertMessage(this.lang.image_processing_error_retry || 'تعذر معالجة الصورة، يرجى المحاولة مجدداً.');
        });
    }
  }

  convertImageUrlToBase64(url: string) {
    this.dataProvider.showLoading();
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.drawImage(img, 0, 0);
        const fullBase64 = canvas.toDataURL('image/png');
        const pureBase64 = fullBase64.split(',')[1];
        this.ChangeStudentProfileAvatar(pureBase64);
      } catch (e) {
        this.dataProvider.hideLoading();
        this.dataProvider.errorALertMessage(this.lang.browser_blocks_image_read || 'إعدادات المتصفح تمنع قراءة الصورة. يرجى التجربة من الجوال.');
      }
    };
    img.onerror = error => {
      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        try {
          this.DownloadAndReadFilePath(url);
        } catch (e) {
          this.dataProvider.hideLoading();
        }
      } else {
        this.dataProvider.hideLoading();
        this.dataProvider.errorALertMessage(this.lang.browser_blocks_image_upload || 'المتصفح يمنع تحميل الصورة. يرجى التجربة من التطبيق.');
      }
    };
    img.src = url + '?t=' + new Date().getTime();
  }

  async DownloadAndReadFilePath(url: string) {
    try {
      const response = (await this.fileUpload.DownloadAndGetUri(url)) as { nativeURL: string };
      let nativeUrl = response.nativeURL;
      const contents = await Filesystem.readFile({
        path: nativeUrl
      });
      let base64String = contents.data as string;

      // 🟢 هذا هو السطر الذي كان مفقوداً ويتسبب في توقف العملية بصمت!
      this.ChangeStudentProfileAvatar(base64String);
    } catch (e) {
      console.error('Error reading student file:', e);
      this.dataProvider.hideLoading();
    }
  }

  convertToBase64(file: Blob, url?: string) {
    try {
      const reader = getFileReader();
      reader.onloadend = () => {
        var base64 = reader.result as string;
        const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
        this.ChangeStudentProfileAvatar(pureBase64);
      };
      reader.onerror = () => {
        this.dataProvider.hideLoading();
      };
      reader.readAsDataURL(file);
    } catch (e) {
      this.dataProvider.hideLoading();
    }
  }

  async ChangeStudentProfileAvatar(base64Data: string) {
    if (!base64Data) {
      this.dataProvider.hideLoading();
      return;
    }

    // 🟢 عدنا للدالة الصحيحة الخاصة بك والتي تعمل بامتياز
    try {
      const result = await this.studentEngagement.uploadAvatar(base64Data, {
        user_no: this.userInfo.user_no!,
        session_id: this.userDetails.session_id!,
        sid: this.student.sid!
      });
      this.dataProvider.hideLoading();

      if (result.success) {
        const newPicUrl = result.url;

        this.zone.run(() => {
          // 🟢 التحديث المباشر للمرجع (بدون تدميره) لكي يشعر المودال بالتغيير فوراً
          this.student.pic = newPicUrl;

          if (this.students && this.students.length > 0) {
            const idx = this.students.findIndex((s: Student) => s.sid === this.student.sid);
            if (idx > -1) {
              this.students[idx].pic = newPicUrl;
              // ❌ تم حذف سطر الاستنساخ {...} لكي يبقى المودال متصلاً بالبيانات!
            }
          }
          this.cdr.detectChanges();
        });

        this.dataProvider.showToast(this.lang.student_image_updated_success || 'تم تحديث صورة الطالب بنجاح');
      } else {
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(result.message || '');
        this.router.navigate(['login'], { replaceUrl: true });
      }
    } catch (error) {
      this.dataProvider.hideLoading();
      this.dataProvider.errorALertMessage(this.lang.connection_error_with_server || 'حدث خطأ في الاتصال بالخادم.');
    }
  }

  checkCurrentDate(date: Date) {
    let currentDate = new Date();
    return (
      date.getDate() == currentDate.getDate() &&
      date.getMonth() == currentDate.getMonth() &&
      date.getFullYear() == currentDate.getFullYear()
    );
  }
}
