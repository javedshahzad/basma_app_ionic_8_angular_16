import {
  Component,
  OnInit,
  NgZone,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavController,
  AlertController,
  Platform,
  ModalController,
  ActionSheetController,
  PopoverController
} from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 استيراد الخدمات المساعدة
import { GamificationEngineService } from '../service/gamification-engine/gamification-engine.service';
import { ImageProcessingService } from '../service/image-processing/image-processing.service';
import { StudentUiService } from '../service/student-ui/student-ui.service';
import { StorageService } from '../service/storage.service';

// 🟢 استيراد المكونات المطلوبة للنوافذ المنبثقة
import { StudentOptionsPopoverComponent } from '../components/student-options-popover/student-options-popover.component';
import { AddReviewComponent } from '../add-review/add-review.component';
import { Browser } from '@capacitor/browser';
import { environment } from '../../environments/environment';
import { ReportsApiService } from '../service/reports-api/reports-api.service';
import { HolidaysApiService } from '../service/holidays-api/holidays-api.service';
import { StudentEngagementService } from '../service/student-engagement/student-engagement.service';
import { UserType } from '../constants/user-type';

@Component({
  selector: 'app-followup-student-list',
  templateUrl: './followup-student-list.page.html',
  styleUrls: ['./followup-student-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class FollowupStudentListPage implements OnInit {
  readonly UserType = UserType;
  private destroyRef = inject(DestroyRef);

  courseInfo: any;
  dateSelected: any;
  attendanceResponse: any = {};
  show_loading: boolean = false;
  userDetails: any = {};
  userType: any;
  navData: any;
  noDataFound: string = '';
  isHoliday: boolean = false;
  holidayString: string = '';
  canAddStudentNote: boolean = true;
  lang: any = {};
  planLang: any = {};
  student_detailse: any = {};

  // المتغيرات الخاصة بالدرجات
  markSheet: any = [];
  student_points: any[] = [];
  AvailablePlan: any;

  // المتغيرات الخاصة بالصور وتكبيرها والملاحظات
  studentData: any = {};
  viewImageUrl: string = '';
  showImageViewer: boolean = false;
  showCalenderModal: boolean = false;
  showNoteModal: boolean = false;
  noteMessage: string = '';
  ratingStars: number = 1;
  selections: any = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];

  // النوافذ المنبثقة (التأكيد والتحذير)
  showWarningPopup: boolean = false;
  warningMessage: string = '';
  warningType: 'frozen' | 'warning' = 'warning';
  showDeleteConfirmModal: boolean = false;

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
    public modalController: ModalController,
    public actionSheetController: ActionSheetController,
    public popoverController: PopoverController,
    public gamification: GamificationEngineService,
    public imageService: ImageProcessingService,
    public studentUi: StudentUiService,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private reportsApi: ReportsApiService,
    private holidaysApi: HolidaysApiService,
    private studentEngagement: StudentEngagementService
  ) {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.navData = navigation.extras.state['course'];
        this.dateSelected = new Date();
        await this.storageSr.set('followUpCourseContext', this.navData);

        if (navigation.extras.state['update']) {
          this.initData(false);
        }
      } else {
        let savedData = await this.storageSr.get('followUpCourseContext');
        if (savedData) {
          this.navData = savedData;
          this.dateSelected = new Date();
        }
      }
      this.cdr.markForCheck();
    });

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

  ngOnInit() {}

  trackByStudent(index: number, student: any): any {
    return student?.sid ?? index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  async ionViewWillEnter() {
    this.initData(true);
    this.getStudentPoints();
    this.AvailablePlan = await this.storageSr.get('availablePlan');
    this.cdr.markForCheck();
  }

  async initData(loader: boolean = true) {
    this.show_loading = true;
    this.cdr.markForCheck();
    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.checkHolidays(loader);
    } else {
      this.show_loading = false;
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  checkHolidays(loader: boolean) {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    this.holidaysApi
      .getHolidays(data)
      .then(response => {
        if (response && response.holidays && response.holidays.length > 0) {
          this.holidayString = response.holiday_string;
          let day = this.dateSelected.getDate().toString().padStart(2, '0');
          let month = (this.dateSelected.getMonth() + 1).toString().padStart(2, '0');
          let string_date = `${this.dateSelected.getFullYear()}-${month}-${day}`;
          this.isHoliday = this.holidayString.includes(string_date);
        }
        this.cdr.markForCheck();
        this.getStudents(loader);
      })
      .catch(error => {
        this.getStudents(loader);
      });
  }

  getStudentPoints() {
    this.dataProvider.getPointsValue().then(res => {
      this.student_points = res.points;
      this.cdr.markForCheck();
    });
  }

  getStudents(loader: boolean = true) {
    if (loader) this.show_loading = true;
    this.markSheet = [];
    let course = this.navData;
    this.courseInfo = course;

    let studentData = {
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      course_id: course?.cid || course?.course_id || '',
      school_id: this.userDetails.details.school_id
    };

    this.dataProvider
      .getFollowUpStudentList(studentData)
      .then(res => {
        this.show_loading = false;
        if (res.session) {
          this.attendanceResponse = res.data;

          if (this.attendanceResponse.students) {
            this.attendanceResponse.students.forEach((student: any) => {
              student.sheet.forEach((sheet: any) => {
                this.markSheet.push({
                  sid: student.sid,
                  cid: student.cid,
                  marks: sheet.marks,
                  marks_id: sheet.marks_id,
                  field_id: sheet.field_id
                });
              });
              student.isFrozen = this.isStudentFrozen(student);
            });
          }

          if (this.attendanceResponse.students && this.attendanceResponse.students.length === 0) {
            this.noDataFound = this.lang.no_students_in_class || 'لا يوجد طلاب متاحين للتقييم.';
          }
        } else {
          this.authProvider.flushLocalStorage();
          this.dataProvider.errorALertMessage(res.message);
          this.router.navigate(['login'], { replaceUrl: true });
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.show_loading = false;
        this.dataProvider.errorALertMessage(error);
        this.cdr.markForCheck();
      });
  }

  isStudentFrozen(student: any): boolean {
    if (!student || !student.frozen_until) return false;
    const today = new Date().toISOString().split('T')[0];
    return student.frozen_until >= today;
  }

  // ================= دوال التاريخ =================
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
  }

  // ================= دوال الدرجات والحقول والطباعة =================

  // 🟢 زر الطباعة المباشر
  async presentPrintOption() {
    // if(this.AvailablePlan?.plan?.slug == 'free' || this.AvailablePlan?.isExpire == true){
    //   this.presentAlertConfirm();
    //   return;
    // }

    if (this.network.type != this.network.Connection.NONE && this.network.type != this.network.Connection.UNKNOWN) {
      const actionSheet = await this.actionSheetController.create({
        header: 'تصدير تقرير المتابعة',
        mode: 'md',
        cssClass: 'custom-action-sheet',
        buttons: [
          {
            text: 'تصدير كملف Excel',
            icon: 'grid-outline',
            cssClass: 'text-emerald-600 font-bold',
            handler: () => {
              this.printReport('exel');
            }
          },
          {
            text: 'عرض كملف PDF',
            icon: 'document-text-outline',
            cssClass: 'text-indigo-600 font-bold',
            handler: () => {
              this.printReport('pdf');
            }
          },
          { text: 'إلغاء', icon: 'close', role: 'cancel' }
        ]
      });
      await actionSheet.present();
    } else {
      this.dataProvider.showToast(this.lang.no_internet);
    }
  }

  printReport(type) {
    let planData = { user_no: this.userDetails.details.user_no, report_type: type };

    this.dataProvider.showLoading();
    this.dataProvider
      .openPdf(planData)
      .then(res => {
        let studentData = {
          date: this.dataProvider.getFormatedDate(this.dateSelected),
          user_no: this.userDetails.details.user_no,
          session_id: this.userDetails.session_id,
          course_id: this.navData?.cid || this.navData?.course_id,
          school_id: this.userDetails.details.school_id,
          report_type: type
        };

        this.reportsApi.getMarksReport(studentData).then(
          async (res: any) => {
            this.dataProvider.hideLoading();
            if (res && res.data) {
              let fileUrl = res.data;
              if (fileUrl.includes('uploads/stufollowup/')) {
                let splitUrl = fileUrl.split('/');
                let filename = splitUrl[splitUrl.length - 1];
                fileUrl = `${environment.docUrl}uploads/stufollowup/${filename}`;
              }
              if (this.platform.is('capacitor') || this.platform.is('cordova')) {
                await Browser.open({ url: fileUrl });
              } else {
                window.open(fileUrl, '_system');
              }
            } else {
              this.dataProvider.showToast(this.lang.report_error);
            }
          },
          error => {
            this.dataProvider.hideLoading();
            this.dataProvider.showToast(this.lang.report_error);
          }
        );
      })
      .catch(e => {
        this.dataProvider.hideLoading();
      });
  }

  async presentAlertConfirm() {
    const alert = await this.alertCtrl.create({
      header:
        this.userDetails.details.is_school_admin == 1 ? this.planLang.not_valid : this.planLang.not_valid_for_others,
      mode: 'ios',
      buttons: [{ text: 'موافق', role: 'cancel', cssClass: 'secondary' }]
    });
    await alert.present();
  }

  addFields() {
    const navigation: NavigationExtras = {
      state: {
        date: this.dataProvider.getFormatedDate(this.dateSelected),
        user_no: this.userDetails.details.user_no,
        session_id: this.userDetails.session_id,
        course_id: this.navData?.cid || this.navData?.course_id,
        school_id: this.userDetails.details.school_id,
        course: this.navData
      }
    };
    this.zone.run(() => {
      this.router.navigate(['followup-add-fields'], navigation);
    });
  }

  deleteStudentMarks() {
    this.showDeleteConfirmModal = true;
  }
  hideDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
  }

  confirmDeleteMarks() {
    this.showDeleteConfirmModal = false;
    let follwData = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id,
      course_id: this.navData?.cid || this.navData?.course_id,
      date: this.dataProvider.getFormatedDate(this.dateSelected)
    };

    this.dataProvider
      .run(() => this.dataProvider.deleteFollowUpStudentList(follwData))
      .then(response => {
        if (response.session) {
          this.dataProvider.showToast(response.message);
          this.getStudents();
        } else {
          this.dataProvider.errorALertMessage(response.message);
        }
      })
      .catch(error => {});
  }

  changeMarks(event: any, student: any, field: any) {
    if (this.isHoliday) {
      this.dataProvider.showToast(this.lang.holiday);
      return;
    }

    let max = parseFloat(field.field_max_marks);
    let val = event.detail.value;

    if (val === '' || val === null || val === undefined) {
      field.marks = '';
      return;
    }

    if (parseFloat(val) > max) {
      this.dataProvider.showToast((this.lang.could_not_be_greater || 'الحد الأقصى هو ') + max);
      field.marks = max;
      event.target.value = max;
    } else {
      field.marks = val;
    }

    let isPresent = false;
    let obj: any = {
      sid: student.sid,
      cid: student.cid,
      marks_id: field.marks_id,
      marks: field.marks,
      field_id: field.field_id
    };

    if (this.markSheet.length > 0) {
      for (let i = 0; i < this.markSheet.length; i++) {
        if (
          this.markSheet[i].sid == obj.sid &&
          this.markSheet[i].cid == obj.cid &&
          this.markSheet[i].field_id == field.field_id
        ) {
          this.markSheet[i]['marks'] = field.marks;
          isPresent = true;
          break;
        }
      }
      if (!isPresent) {
        this.markSheet.push(obj);
      }
    } else {
      this.markSheet.push(obj);
    }
  }

  submitMarks() {
    let isAllComplete = true;

    this.attendanceResponse.students.forEach((student: any) => {
      student.sheet.forEach((sheet: any) => {
        if (sheet.marks && parseFloat(sheet.marks) > parseFloat(sheet.field_max_marks)) {
          isAllComplete = false;
        }
      });
    });

    if (isAllComplete) {
      let data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id,
        session_id: this.userDetails.session_id,
        course_id: this.navData?.cid || this.navData?.course_id,
        date: this.dataProvider.getFormatedDate(this.dateSelected)
      };

      if (this.markSheet.length > 0) {
        this.dataProvider
          .run(() => this.dataProvider.submitMarks(data, this.markSheet))
          .then(response => {
            if (response.session) {
              this.dataProvider.showToast(this.lang.marks_added || 'تم حفظ الدرجات');
              this.getStudents(false);
            } else {
              this.dataProvider.errorALertMessage(this.lang.marks_added_error);
            }
          })
          .catch(error => {
            this.dataProvider.errorALertMessage(error);
          });
      } else {
        this.dataProvider.showToast('لا توجد تعديلات لحفظها');
      }
    } else {
      this.dataProvider.showToast('الرجاء مراجعة الدرجات، بعض القيم تتجاوز الحد الأقصى.');
    }
  }

  // ================= 🟢 دوال زر الإجراءات (+) بجانب الطالب =================
  async presentStudentActionSheet(event: any, student: any) {
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
        if (data && data.selectedAction === 'points') this.openSkillTreeModal(student);
      });
    } else {
      const actionSheet = await this.actionSheetController.create({
        header: `إجراءات الطالب: ${student.name}`,
        cssClass: 'custom-action-sheet',
        mode: 'md',
        buttons: [
          {
            text: 'تقييم الطالب',
            icon: 'star-outline',
            handler: () => {
              this.openNoteModal(student, 'review');
            }
          },
          {
            text: 'إضافة ملاحظة',
            icon: 'document-text-outline',
            handler: () => {
              this.openNoteModal(student, 'note');
            }
          },
          {
            text: 'المهارات والنقاط',
            icon: 'medal-outline',
            handler: () => {
              this.openSkillTreeModal(student);
            }
          },
          { text: 'إلغاء', icon: 'close', role: 'cancel', cssClass: 'text-rose-500 font-bold' }
        ]
      });
      await actionSheet.present();
    }
  }

  async openNoteModal(student: any, mode: any) {
    this.studentData = student;
    if (mode === 'note') {
      this.showNoteModal = true;
      this.cdr.markForCheck();
    } else {
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
    this.noteMessage = '';
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
            user_id: this.userDetails.details.user_no,
            rating: this.ratingStars,
            new_rating: JSON.stringify(this.ratingStars)
          };
          this.dataProvider
            .run(() => this.studentEngagement.addNote(data))
            .then(note_id => {
              this.noteMessage = '';
              this.showNoteModal = false;
              this.dataProvider.showToast(this.lang.add_review_success_message);
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

  addTextNotesNote() {
    if (this.noteMessage && this.noteMessage.trim() != '') {
      if (this.noteMessage.length <= 45) {
        if (this.canAddStudentNote) {
          let data = {
            sid: this.studentData.sid,
            note: this.noteMessage,
            user_id: this.userDetails.details.user_no,
            rating: 0,
            new_rating: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
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
      points: '+' + point,
      skill_type: skillType
    };

    try {
      const res: any = await this.dataProvider.run(() => this.studentEngagement.awardSkillPoints(body));
      this.zone.run(() => {
        if (res && res.success) {
          this.dataProvider.showToast(`تمت إضافة ${point} نقطة بنجاح!`);
          student.student_points = Number(student.student_points || 0) + point;
        } else {
          let msg = res?.msg || 'عفواً، لا يمكن منح النقاط الآن.';
          this.warningType = student.isFrozen || msg.includes('مجم') || msg.includes('تجميد') ? 'frozen' : 'warning';
          this.warningMessage = msg;
          this.showWarningPopup = true;
        }
        this.cdr.markForCheck();
      });
    } catch (err: any) {
      this.zone.run(() => {
        this.warningType = 'warning';
        this.warningMessage = `خطأ: ${typeof err === 'string' ? err : err?.message}`;
        this.showWarningPopup = true;
        this.cdr.markForCheck();
      });
    }
  }

  closeWarningPopup() {
    this.showWarningPopup = false;
  }

  // ================= دوال الصور (اعتماداً على الخدمة المركزية) =================
  async openUserImageModal(student: any) {
    // 🟢 السطر السحري لربط بيانات المودال بالمتغير الذي تستخدمه الكاميرا
    this.studentData = student;

    await this.studentUi.openStudentProfileModal(
      this.studentData, // 🟢 تم تمرير المتغير المربوط
      this.userType,
      false,
      (event: any) => {
        this.takePicture(this.studentData, event);
      },
      (url: string) => {
        this.openFullscreenImage(url);
      }
    );
  }

  async takePicture(student: any, event?: any) {
    this.studentData = student;
    this.cdr.markForCheck();
    const result = await this.studentEngagement.captureAvatarImage(event, this.lang);
    if (result.base64) {
      this.zone.run(() => this.ChangeStudentProfileAvatar(result.base64));
    } else if (result.action === 'avatar') {
      this.zone.run(() => this.handleAvatarSelection());
    }
  }

  async handleAvatarSelection() {
    const data = await this.studentUi.openAvatarModal(this.studentData);

    // 🟢 التصحيح: استخدام data.image_url لأن الوسيط قام بفك التغليف
    if (data && data.image_url) {
      // 1. تنظيف الرابط من السلاش المزدوج
      let cleanUrl = data.image_url.replace(/([^:]\/)\/+/g, '$1');

      // 2. التحديث الفوري للواجهة (Optimistic UI)
      this.zone.run(() => {
        this.studentData.pic = cleanUrl;

        // تحديث المصفوفة الحية التي تتصل بالشاشة
        if (this.attendanceResponse && this.attendanceResponse.students) {
          const index = this.attendanceResponse.students.findIndex((s: any) => s.sid === this.studentData.sid);
          if (index > -1) {
            this.attendanceResponse.students[index].pic = cleanUrl;
            // إجبار التحديث بعدم كسر المرجع أو بتغييره بطريقة صحيحة
            //this.attendanceResponse.students[index] = { ...this.attendanceResponse.students[index] };
          }
        }

        this.cdr.detectChanges();
      });

      // 3. الرفع للسيرفر في الخلفية
      this.dataProvider.showLoading();
      this.imageService
        .convertUrlToBase64(cleanUrl)
        .then(base64 => {
          this.ChangeStudentProfileAvatar(base64);
        })
        .catch(err => {
          this.dataProvider.hideLoading();
          this.dataProvider.errorALertMessage('تعذر معالجة الصورة الرمزية.');
        });
    }
  }

  async ChangeStudentProfileAvatar(base64Data: string) {
    if (!base64Data) return;

    try {
      const result = await this.dataProvider.run(() =>
        this.studentEngagement.uploadAvatar(base64Data, {
          user_no: this.userDetails.details.user_no,
          session_id: this.userDetails.session_id,
          sid: this.studentData.sid
        })
      );

      if (result.success) {
        const newPicUrl = result.url;

        this.zone.run(() => {
          this.studentData.pic = newPicUrl;

          if (this.attendanceResponse && this.attendanceResponse.students) {
            const index = this.attendanceResponse.students.findIndex((s: any) => s.sid === this.studentData.sid);
            if (index > -1) {
              this.attendanceResponse.students[index].pic = newPicUrl;
            }
          }
          this.cdr.detectChanges();
        });

        this.dataProvider.showToast('تم تحديث صورة الطالب بنجاح');
      } else {
        this.dataProvider.errorALertMessage(result.message);
      }
    } catch {
      this.dataProvider.errorALertMessage('حدث خطأ في الاتصال');
    }
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
}
