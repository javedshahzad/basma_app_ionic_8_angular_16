import { Component, NgZone, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { NavController, NavParams, AlertController, PopoverController, Platform, ModalController, ActionSheetController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService, getFileReader } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Network } from '@capacitor/network';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { DatabaseService } from '../service/database/database.service';
import { StudentDataService } from '../service/student-data/student-data.service';
import { environment } from '../../environments/environment';
import { Storage } from '@ionic/storage';
import { AddReviewComponent } from '../add-review/add-review.component';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';
import { StudentDetailsComponent } from '../components/student-details/student-details.component';
import { AvatarImagesComponent } from '../components/avatar-images/avatar-images.component';
import { Browser } from '@capacitor/browser';
import { ImageProcessingService } from '../service/image-processing/image-processing.service';

import { StudentOptionsPopoverComponent } from '../components/student-options-popover/student-options-popover.component';
import { ImageOptionPopoverComponent } from '../components/image-option-popover/image-option-popover.component';
import { PrintOptionsPopoverComponent } from '../components/print-options-popover/print-options-popover.component';
import { EditDeleteNotePopoverComponent } from '../components/edit-delete-note-popover/edit-delete-note-popover.component';

import { GamificationEngineService } from '../service/gamification-engine/gamification-engine.service';
import { SkillTreeModalComponent } from '../components/skill-tree-modal/skill-tree-modal.component';
import { NotesApiService } from '../service/notes-api/notes-api.service';
import { ReportsApiService } from '../service/reports-api/reports-api.service';
import { GamificationApiService } from '../service/gamification-api/gamification-api.service';
import { FollowupFieldsApiService } from '../service/followup-fields-api/followup-fields-api.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { StorageService } from '../service/storage.service';
import { StudentEngagementService } from '../service/student-engagement/student-engagement.service';
import { UserType } from '../constants/user-type';
import { NgIf, NgClass, NgSwitch, NgSwitchCase, NgFor, NgStyle, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Student } from '../model/student.model';
import { LoggedInUser } from '../model/logged-in-user.model';
import { UserPlan } from '../service/plan-api/plan-api.service';
import { StudentNote, StudentNotesResponse } from '../service/notes-api/notes-api.service';
import { StudentProfileDashboard, StudentInventory, SkillData } from '../service/gamification-api/gamification-api.service';
import { StudentInventoryModalComponent } from '../components/student-inventory-modal/student-inventory-modal.component';

const env = environment;

interface DeletePayload {
  type: 'note' | 'absence';
  id: string | number;
  index: number;
  notesArray?: AbsenceNote[];
}

interface AbsenceNote {
  ID?: string | number;
  note?: string;
  created_by?: string | number;
}

@Component({
    selector: 'app-student-detail',
    templateUrl: './student-detail.page.html',
    styleUrls: ['./student-detail.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgClass, NgSwitch, NgSwitchCase, NgFor, NgStyle, FormsModule, DecimalPipe, DatePipe, TranslatePipe, StudentInventoryModalComponent]
})
export class StudentDetailPage {
  readonly UserType = UserType;
  trackByIndex(index: number): number {
    return index;
  }
  trackByAbsentDate(index: number, details: { date?: string }): string | number {
    return details?.date ?? index;
  }
  trackByAbsenceNoteId(index: number, note: { ID?: string | number }): string | number {
    return note?.ID ?? index;
  }
  trackByNoteId(index: number, note: StudentNote): string | number {
    return note?.id ?? index;
  }
  absenceDetail: unknown[] = [];
  notes: StudentNotesResponse = {};
  category: string;
  studentDetails: Student = {};
  // Typed string | number (not just string) even though the backend only
  // ever sends a string: the template compares this against numeric
  // literals (userType === 1 etc, pre-existing — a real bug where the
  // comparison always evaluates false, hiding a button for every role).
  // Narrowing to string alone would flag that comparison as a type error;
  // widening here preserves the exact (broken) existing behavior without
  // this lint pass silently deciding to fix or hide a UI-visibility bug.
  userType: string | number;
  lang: Record<string, string> = {};
  userDetails: LoggedInUser = {};
  noteMessage: string = '';
  canAddStudentNote: boolean = true;
  noNotesFound: string = '';
  noAbsenceFound: string = '';
  selections: string[] = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
  aggStars: string[] = ['#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
  ratingStars: number;
  showNoteModal: boolean = false;
  halfStar: boolean = false;
  halfStarPosition: number;
  studentBehaviour: { icon?: string; text?: string } = {
    icon: '',
    text: ''
  };
  totalDelay: number;
  navData: Record<string, unknown> = {};
  planLang: Record<string, string>;
  app_rate: Record<string, string>;
  student_detailse: Record<string, string>;
  student_points: number[] = [];
  id: string | number;
  callOfStudentsReport = [];
  AllStudentPledgesReports = [];
  AvailablePlan: UserPlan;
  editNoteData: StudentNote;

  showAbsenceNoteModal: boolean = false;
  absenceNoteText: string = '';
  currentAbsenceDate: string = null;
  currentAbsenceNotesArray: StudentNote[] = null;

  showDeleteConfirmModal: boolean = false;
  deletePayload: DeletePayload = null;

  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  isLoadingSkills: boolean = false;
  studentTotalPoints: number = 0;
  studentSkillData: SkillData = null;
  studentTitle: string = '';
  skillMaxTarget: number = 100;

  isAbsenceLoaded: boolean = false;
  isReportsLoaded: boolean = false;
  isNotesLoaded: boolean = false;

  badgesProgress: number = 0;

  showWarningPopup: boolean = false;
  warningMessage: string = '';
  warningType: 'frozen' | 'warning' = 'warning';

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public dbProvider: DatabaseService,
    public studentService: StudentDataService,
    public alertController: AlertController,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private printer: Printer,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    private popover: PopoverController,
    public platform: Platform,
    private storage: Storage,
    public modalController: ModalController,
    public actionSheetController: ActionSheetController,
    private imageService: ImageProcessingService,
    public gamification: GamificationEngineService,
    private notesApi: NotesApiService,
    private reportsApi: ReportsApiService,
    private gamificationApi: GamificationApiService,
    private followupFieldsApi: FollowupFieldsApiService,
    private userManagementApi: UserManagementApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private storageSr: StorageService,
    private studentEngagement: StudentEngagementService,
    private cdr: ChangeDetectorRef
  ) {
    // 🟢 الإصلاح الأول: صيد البيانات فوراً بدون التورط في subscribe لـ queryParams
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state;
      this.storage.set('currentStudent', this.navData);
      localStorage.setItem('currentStudent', JSON.stringify(this.navData));
      this.totalDelay = this.navData.total_delay as number;
    }

    this.translate.get('alertmessages').subscribe(val => {
      this.lang = val;
      this.cdr.markForCheck();
    });
    this.translate.get('plan').subscribe(val => {
      this.planLang = val;
      this.cdr.markForCheck();
    });
    this.translate.get('app_rate').subscribe(val => {
      this.app_rate = val;
      this.cdr.markForCheck();
    });
    this.translate.get('student-details').subscribe(val => {
      this.student_detailse = val;
      this.cdr.markForCheck();
    });
  }

  closeWarningPopup() {
    this.showWarningPopup = false;
  }

  async openSkillTreeModal() {
    const modal = await this.modalController.create({
      component: SkillTreeModalComponent,
      componentProps: { student: this.studentDetails },
      cssClass: 'bottom-drawer-modal',
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.6,
      handle: true
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.awardSkillPoints(data.skillType, data.points);
    }
  }

  async awardSkillPoints(skillType: string, point: number) {
    let formattedPoint = '+' + point;

    let body = {
      sid: String(this.studentDetails.sid),
      userId: String(this.userDetails.details.user_no),
      points: formattedPoint,
      skill_type: skillType
    };

    try {
      const res = await this.dataProvider.run(() => this.studentEngagement.awardSkillPoints(body));

      this.zone.run(() => {
        if (res && res.success) {
          this.dataProvider.showToast(`تمت إضافة ${point} نقطة بنجاح!`);

          if (this.studentDetails.student_points !== undefined) {
            this.studentDetails.student_points = Number(this.studentDetails.student_points) + point;
          } else {
            this.studentDetails.student_points = point;
          }
          this.cdr.markForCheck();
        } else {
          setTimeout(() => {
            let msg = res?.msg || 'تعذر إضافة النقاط';
            this.warningType = this.isFrozen || msg.includes('مجم') || msg.includes('تجميد') ? 'frozen' : 'warning';
            this.warningMessage = msg;
            this.showWarningPopup = true;
            this.cdr.markForCheck();
          }, 300);
        }
      });
    } catch (err: unknown) {
      this.zone.run(() => {
        setTimeout(() => {
          let errorDetails = typeof err === 'string' ? err : (err as { message?: string })?.message || JSON.stringify(err);
          let msg = `خطأ: ${errorDetails}`;

          this.warningType = this.isFrozen || msg.includes('مجم') || msg.includes('تجميد') ? 'frozen' : 'warning';
          this.warningMessage = msg;
          this.showWarningPopup = true;
          this.cdr.markForCheck();
        }, 300);
      });
    }
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  fetchStudentSkills(sid: string | number) {
    this.isLoadingSkills = true;
    this.studentTotalPoints = 0;
    this.studentSkillData = null;
    this.studentTitle = 'جاري التحليل...';

    let body = { sid: sid };

    this.gamificationApi
      .getStudentSkillTree(body)
      .then((raw) => {
        const res = raw as { success?: boolean; total_points?: number; skills?: SkillData } | undefined;
        this.isLoadingSkills = false;
        if (res && res.success) {
          this.studentTotalPoints = res.total_points || 0;
          this.studentSkillData = res.skills;
          this.studentTitle = this.gamification.getFinalStudentTitle(
            this.activeCraftedTitle,
            res.skills,
            this.studentTotalPoints
          );
        } else {
          this.studentTitle = '🌱 بطل في البداية';
        }
        this.cdr.markForCheck();
      })
      .catch(err => {
        this.isLoadingSkills = false;
        this.studentTitle = '⚠️ تعذر جلب اللقب';
        this.cdr.markForCheck();
      });
  }

  generateStudentTitle(skills: Record<string, unknown>, total: number) {
    if (!skills || total === 0) return '🌱 بطل في البداية';

    let highestSkill = 'general';
    let maxPoints = 0;

    for (const [skill, points] of Object.entries(skills)) {
      let numPoints = Number(points);
      if (skill.toLowerCase() !== 'general' && numPoints > maxPoints) {
        maxPoints = numPoints;
        highestSkill = skill.toLowerCase();
      }
    }

    switch (highestSkill) {
      case 'cognitive':
        return '💡 عبقري المستقبل';
      case 'social':
        return '🤝 روح الفريق';
      case 'discipline':
        return '🛡️ درع الانضباط';
      case 'emotional':
        return '❤️ القلب الكبير';
      case 'practical':
        return '💻 المبدع الرقمي';
      default:
        return '🌟 نجم المشاركة';
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

  getStudentPoints() {
    this.gamificationApi.getPointsValue().then(res => {
      this.student_points = res.points;
      this.cdr.markForCheck();
    });
  }

  async ionViewWillEnter() {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      if ((await Network.getStatus()).connected) {
        this.checkProfile();
      } else {
        if (this.navData.student_id) {
          this.getOfflineNote();
          this.studentService
            .getStudent(this.navData.student_id)
            .then(response => {
              this.studentDetails = response;

              if (this.studentDetails.can_view_absent) {
                this.category = 'absence';
              } else {
                this.category = 'notes';
              }
              if (this.userType == UserType.Teacher) {
                this.category = 'notes';
              }
              if (this.studentDetails.absents.length == 0) {
                this.noAbsenceFound = this.lang.no_absent;
              }
              this.cdr.markForCheck();
            })
            .catch(error => {
              this.dataProvider.showToast(this.lang.no_internet);
            });
        } else {
          this.dataProvider.showToast(this.lang.no_internet);
          this.navCtrl.back();
        }
      }
    } else {
      this.checkProfile();
    }
    this.getStudentPoints();

    let planStorage = localStorage.getItem('availablePlan');
    if (planStorage && planStorage !== 'undefined') {
      this.AvailablePlan = JSON.parse(planStorage);
    }
    this.cdr.markForCheck();

    if (this.navData?.student_id) {
      this.fetchStudentSkills(this.navData.student_id as string | number);
    }
  }

  getOfflineNote() {
    this.studentService
      .getStudentNote(this.navData.student_id)
      .then(response => {
        this.aggStars = ['#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
        this.notes = response;
        if (response.agg_ranking > 0 && response.agg_ranking < 2.6) {
          this.studentBehaviour.icon = './assets/icon/warning.png';
          this.studentBehaviour.text = this.lang.warning_behaviour;
        } else if (response.agg_ranking > 2.5 && response.agg_ranking < 3.6) {
          this.studentBehaviour.icon = './assets/icon/good.png';
          this.studentBehaviour.text = this.lang.good_behaviour;
        } else if (response.agg_ranking > 3.5 && response.agg_ranking < 4.6) {
          this.studentBehaviour.icon = './assets/icon/very-good.png';
          this.studentBehaviour.text = this.lang.very_good_behaviour;
        } else if (response.agg_ranking > 4.5 && response.agg_ranking < 5.1) {
          this.studentBehaviour.icon = './assets/icon/excellent.png';
          this.studentBehaviour.text = this.lang.excellent_behaviour;
        } else {
          this.studentBehaviour.icon = 'chatbubbles';
          this.studentBehaviour.text = this.lang.no_behaviour;
        }
        if (response.notes.length > 0) {
          this.notes.notes.forEach((note: StudentNote) => {
            if (note.user_id == this.userDetails.details.user_no && this.userDetails.details.pic) {
              note.teacher_pic = this.userDetails.details.pic;
            }
            let picToUse = note.teacher_pic ? note.teacher_pic : note.pic;
            if (!picToUse || picToUse === '' || picToUse === 'null' || picToUse.includes('default_avatar')) {
              picToUse = 'assets/imgs/default_avatar.png';
            } else if (!picToUse.startsWith('http') && !picToUse.startsWith('assets')) {
              picToUse = environment.docUrl + 'uploads/' + picToUse.replace('uploads/', '');
            }
            note.display_pic = picToUse;

            if (
              (this.checkNoteDate(new Date(note.date)) && note.user_id == this.userDetails.details.user_no) ||
              this.userDetails.details.user_type != UserType.Teacher
            ) {
              if (this.userDetails.details.user_type === UserType.Teacher) {
                this.canAddStudentNote = false;
              }
            }
            if (Number(note.rating) > 0) {
              note.selections = ['#fff', '#fff', '#fff', '#fff', '#fff'];
              for (let i = 0; i < parseInt(String(note.rating)); i++) {
                note.selections[i] = '#04855f';
              }
            }
          });
          let realNo = 0;
          if (this.notes.agg_ranking % 1 == 0) {
            realNo = parseInt(String(this.notes.agg_ranking));
          } else {
            realNo = Math.floor(this.notes.agg_ranking);
            this.halfStarPosition = realNo;
            this.halfStar = true;
          }
          for (let i = 0; i < realNo; i++) {
            this.aggStars[i] = '#04855f';
          }
        } else {
          this.noNotesFound = this.lang.no_note;
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.dataProvider.showToast(this.lang.no_internet);
      });
  }

  // 🟢 الإصلاح الثاني: تأمين دالة الجلب بـ try..finally لضمان إغلاق التحميل اللانهائي!
  async checkProfile() {
    try {
      await this.dataProvider.run(async () => {
        const userData = await this.storageSr.get('userloggedin');
        if (userData) {
          this.userDetails = userData;
          this.userType = this.userDetails.details.user_type;

          let data = {
            user_no: this.userDetails.details.user_no,
            session_id: this.userDetails.session_id,
            cid: this.navData?.course_id || '',
            date: this.navData?.dateSelected || this.dataProvider.getFormatedDate(new Date()),
            sid: this.navData?.student_id || this.navData?.sid
          };

          const response = await this.schoolDirectoryApi.getStudentDetails(data);

          if (response && response.session && response.data) {
            this.studentService.checkStudent(response.data);
            this.studentDetails = response.data;

            if (this.studentDetails && !this.studentDetails.agg_ranking) {
              this.studentDetails.agg_ranking = (this.navData?.agg_ranking as number) || 0;
            }

            this.studentDetails.student_points =
              this.navData?.student_points !== undefined
                ? (this.navData.student_points as number)
                : response.data.student_points || 0;

            let dashboardData = {
              sid: String(data.sid),
              userId: String(this.userDetails.details.user_no)
            };

            const dashRes: StudentProfileDashboard | false = await this.gamificationApi.getStudentProfileDashboard(dashboardData);

            if (dashRes && dashRes.success) {
              let rawTitle = dashRes.inventory?.active_title;
              if (rawTitle && rawTitle !== 'null' && rawTitle !== '') {
                this.activeCraftedTitle =
                  typeof rawTitle === 'object' ? rawTitle.code || rawTitle.title_name : rawTitle;
              } else {
                this.activeCraftedTitle = null;
              }

              if (this.studentDetails) {
                this.studentDetails.active_crafted_title = this.activeCraftedTitle;
              }

              this.studentTotalPoints = dashRes.skill_tree?.skill_tree_total || 0;
              this.studentSkillData = dashRes.skill_tree?.skills || null;

              if (this.gamification) {
                this.studentTitle = this.getStudentTitle(this.studentDetails);
              }
            }
            this.cdr.markForCheck();
          } else {
            // في حال الرد بفشل من السيرفر
            this.dataProvider.showToast(response?.message || 'تعذر جلب بيانات الطالب بشكل كامل');
          }
        } else {
          this.authProvider.flushLocalStorage();
          this.router.navigate(['login'], { replaceUrl: true });
        }
      });
    } catch (error) {
      console.error('Critical Profile Error:', error);
    }
  }

  getNotes(): Promise<void> {
    return new Promise(resolve => {
      let data = {
        user_no: this.userDetails.details.user_no,
        session_id: this.userDetails.session_id,
        cid: this.navData.course_id,
        date: this.navData.dateSelected,
        sid: this.navData.student_id
      };

      this.notesApi
        .getStudentNotes(data)
        .then(response => {
          this.studentService.checkStudentNotes(response, this.navData.student_id);
          this.aggStars = ['#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
          this.notes = response;

          if (response.notes.length > 0) {
            this.notes.notes.forEach((note: StudentNote) => {
              if (note.user_id == this.userDetails.details.user_no && this.userDetails.details.pic) {
                note.teacher_pic = this.userDetails.details.pic;
              }

              let picToUse = note.teacher_pic ? note.teacher_pic : note.pic;

              if (!picToUse || picToUse === '' || picToUse === 'null' || picToUse.includes('default_avatar')) {
                picToUse = 'assets/imgs/default_avatar.png';
              } else if (!picToUse.startsWith('http') && !picToUse.startsWith('assets')) {
                picToUse = environment.docUrl + 'uploads/' + picToUse.replace('uploads/', '');
              }

              note.display_pic = picToUse;

              if (
                (this.checkNoteDate(new Date(note.date)) && note.user_id == this.userDetails.details.user_no) ||
                this.userDetails.details.user_type != UserType.Teacher
              ) {
                if (this.userDetails.details.user_type === UserType.Teacher) {
                  this.canAddStudentNote = false;
                }
              }

              if (Number(note.rating) > 0) {
                note.selections = ['#fff', '#fff', '#fff', '#fff', '#fff'];
                for (let i = 0; i < parseInt(String(note.rating)); i++) {
                  note.selections[i] = '#04855f';
                }
              }
            });

            let realNo = 0;
            if (this.notes.agg_ranking % 1 == 0) {
              realNo = parseInt(String(this.notes.agg_ranking));
            } else {
              realNo = Math.floor(this.notes.agg_ranking);
              this.halfStarPosition = realNo;
              this.halfStar = true;
            }
            for (let i = 0; i < realNo; i++) {
              this.aggStars[i] = '#04855f';
            }
          } else {
            this.noNotesFound = this.lang.no_note;
          }

          this.cdr.markForCheck();
          resolve();
        })
        .catch((error: { error?: { msg?: string; message?: string }; message?: string } | string) => {
          let safeErrorMsg =
            (typeof error !== 'string' && (error?.error?.msg || error?.error?.message || error?.message)) ||
            (typeof error === 'string' ? error : 'حدث خطأ غير متوقع أثناء جلب الملاحظات');
          this.dataProvider.errorALertMessage(safeErrorMsg);
          resolve();
        });
    });
  }

  async addAbsentNote(notes: AbsenceNote[], date: string) {
    let note = notes.filter((note: AbsenceNote) => {
      return note.created_by == this.userDetails.details.user_no;
    });

    if (note.length == 0) {
      this.currentAbsenceNotesArray = notes;
      this.currentAbsenceDate = date;
      this.absenceNoteText = '';
      this.showAbsenceNoteModal = true;
    } else {
      this.dataProvider.showToast(this.lang.already_submit_note);
    }
  }

  hideAbsenceNoteModal() {
    this.showAbsenceNoteModal = false;
    this.absenceNoteText = '';
  }

  submitAbsenceNote() {
    if (this.absenceNoteText && this.absenceNoteText.trim() != '') {
      let dataToSave = { note: this.absenceNoteText };
      this.saveNote(dataToSave, this.currentAbsenceNotesArray, this.currentAbsenceDate);
      this.hideAbsenceNoteModal();
    } else {
      this.dataProvider.showToast(this.lang.empty_note);
    }
  }

  saveNote(noteData: { note: string }, notes: AbsenceNote[], date: string) {
    let data = {
      sid: this.studentDetails.sid,
      cid: this.navData.course_id,
      date: date,
      note: noteData.note,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .run(() => this.notesApi.saveAbsenceNote(data))
      .then(response => {
        if (response.session) {
          notes.push({
            note: noteData.note,
            ID: response.note_id,
            created_by: this.userDetails.details.user_no
          });
          this.dataProvider.showToast(response.message);
        } else {
          this.authProvider.flushLocalStorage();
          this.dataProvider.errorALertMessage(response.message);
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error);
      });
  }

  deleteUserNote(note_id: string | number, index: number) {
    this.deletePayload = { type: 'note', id: note_id, index: index };
    this.showDeleteConfirmModal = true;
  }

  deleteAbsenceNote(notes: AbsenceNote[], note_id: string | number, index: number) {
    this.deletePayload = { type: 'absence', id: note_id, index: index, notesArray: notes };
    this.showDeleteConfirmModal = true;
  }

  hideDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
    this.deletePayload = null;
  }

  confirmDelete() {
    if (!this.deletePayload) return;

    let data = {
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    if (this.deletePayload.type === 'note') {
      this.dataProvider
        .run(() => this.notesApi.deleteStudentNote(data, this.deletePayload.id))
        .then(response => {
          this.canAddStudentNote = true;
          this.getNotes();
          this.hideDeleteConfirmModal();
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.errorALertMessage(error);
          this.hideDeleteConfirmModal();
          this.cdr.markForCheck();
        });
    } else if (this.deletePayload.type === 'absence') {
      this.dataProvider
        .run(() => this.notesApi.deleteAbsenceNote(data, this.deletePayload.id))
        .then(response => {
          if (response.session) {
            this.deletePayload.notesArray.splice(this.deletePayload.index, 1);
            this.dataProvider.showToast(response.message);
          } else {
            this.authProvider.flushLocalStorage();
            this.dataProvider.errorALertMessage(response.message);
          }
          this.hideDeleteConfirmModal();
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.errorALertMessage(error);
          this.hideDeleteConfirmModal();
          this.cdr.markForCheck();
        });
    }
  }

  addNotesNote() {
    if (this.noteMessage && this.noteMessage.trim() != '') {
      if (this.noteMessage.length <= 45) {
        if (this.canAddStudentNote) {
          let data = {
            sid: this.navData.student_id,
            note: this.noteMessage,
            user_id: this.userDetails.details.user_no,
            rating: this.ratingStars,
            new_rating: JSON.stringify(this.ratingStars)
          };
          this.dataProvider
            .run(() => this.studentEngagement.addNote(data))
            .then(note_id => {
              this.getNotes();
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

  EditStudentNotes() {
    if (this.noteMessage && this.noteMessage.trim() != '') {
      if (this.noteMessage.length <= 45) {
        if (this.canAddStudentNote) {
          let data = {
            sid: this.navData.student_id,
            note: this.noteMessage,
            user_id: this.editNoteData.user_id,
            rating: 0,
            id: this.id,
            new_rating: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
          };
          this.dataProvider
            .run(() => this.studentEngagement.editNote(data))
            .then(note_id => {
              this.getNotes();
              this.noteMessage = '';
              this.showNoteModal = false;
              this.id = '';
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

  addTextNotesNote() {
    if (this.noteMessage && this.noteMessage.trim() != '') {
      if (this.noteMessage.length <= 45) {
        if (this.canAddStudentNote) {
          let data = {
            sid: this.navData.student_id,
            note: this.noteMessage,
            user_id: this.userDetails.details.user_no,
            rating: 0,
            user_type: this.userDetails.details.user_type,
            new_rating: JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
          };
          this.dataProvider
            .run(() => this.studentEngagement.addNote(data))
            .then(note_id => {
              this.getNotes();
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

  async editDeleteNotes(event: Event, note_id: string | number, index: number, note: StudentNote) {
    this.editNoteData = note;

    if (this.platform.width() >= 768 && event) {
      const popover = await this.popover.create({
        component: EditDeleteNotePopoverComponent,
        event: event,
        mode: 'ios',
        translucent: true,
        cssClass: 'custom-popover'
      });
      await popover.present();

      const { data } = await popover.onDidDismiss();

      this.zone.run(() => {
        if (data && data.selectedAction === 'edit') {
          if (note.new_ratting === '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]') {
            this.openNoteModal('note', 'edit', note, note_id);
          } else {
            this.openNoteModal('review', 'edit', note, note_id);
          }
        }
        if (data && data.selectedAction === 'delete') {
          this.deleteUserNote(note_id, index);
        }
        this.cdr.markForCheck();
      });
    } else {
      const actionSheet = await this.actionSheetController.create({
        header: this.lang.cange_note || 'إجراءات الملاحظة',
        mode: 'md',
        cssClass: 'custom-action-sheet',
        buttons: [
          {
            text: this.lang.edit_title || 'تعديل الملاحظة',
            icon: 'pencil-outline',
            handler: () => {
              if (note.new_ratting === '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]') {
                this.openNoteModal('note', 'edit', note, note_id);
              } else {
                this.openNoteModal('review', 'edit', note, note_id);
              }
            }
          },
          {
            text: this.lang.delete || 'حذف',
            icon: 'trash-outline',
            cssClass: 'text-rose-500 font-bold',
            handler: () => {
              this.deleteUserNote(note_id, index);
            }
          },
          {
            text: this.student_detailse && this.student_detailse.cancel ? this.student_detailse.cancel : 'إلغاء',
            icon: 'close',
            role: 'cancel'
          }
        ]
      });
      await actionSheet.present();
    }
  }

  udateNotes(data: { data?: number; noteMessage?: string }, note_id: string | number) {
    let updates = {
      sid: this.navData.student_id,
      note_id: note_id,
      rating: data.data,
      new_rating: data.data,
      note: data.noteMessage,
      updated_by: this.userDetails.details.user_no
    };
    this.notesApi
      .editAbsentNotes(updates)
      .then(res => {
        if (res) {
          this.dataProvider.showToast(res.data.msg);
          this.getNotes();
        }
      })
      .catch(err => {
        this.dataProvider.showToast(err.message);
      });
  }

  checkNoteDate(date: Date) {
    let currentDate = new Date();
    if (
      date.getDate() == currentDate.getDate() &&
      date.getMonth() == currentDate.getMonth() &&
      date.getFullYear() == currentDate.getFullYear()
    ) {
      return true;
    } else {
      return false;
    }
  }

  async takePicture(event?: Event) {
    if ((await Network.getStatus()).connected) {
      if (this.platform.width() >= 768 && event) {
        const popover = await this.popover.create({
          component: ImageOptionPopoverComponent,
          event: event,
          mode: 'ios',
          translucent: true,
          cssClass: 'custom-popover'
        });
        await popover.present();

        const { data } = await popover.onDidDismiss();
        this.zone.run(() => {
          if (data && data.selectedAction === 'camera') this.handleImageSelection('camera');
          if (data && data.selectedAction === 'gallery') this.handleImageSelection('gallery');
          if (data && data.selectedAction === 'avatar') this.OpenAvatarModel();
        });
      } else {
        const actionSheet = await this.actionSheetController.create({
          header: this.lang.image_option || 'تغيير صورة الطالب',
          mode: 'md',
          cssClass: 'custom-action-sheet',
          buttons: [
            {
              text: this.lang.camera || 'التقاط بالكاميرا',
              icon: 'camera-outline',
              handler: () => {
                this.handleImageSelection('camera');
              }
            },
            {
              text: this.lang.gallery || 'اختيار من المعرض',
              icon: 'image-outline',
              handler: () => {
                this.handleImageSelection('gallery');
              }
            },
            {
              text: this.lang.avatar || 'اختيار صورة رمزية',
              icon: 'people-circle-outline',
              handler: () => {
                this.OpenAvatarModel();
              }
            },
            {
              text: this.lang.cancel || 'إلغاء',
              icon: 'close',
              role: 'cancel',
              cssClass: 'text-rose-500 font-bold'
            }
          ]
        });
        await actionSheet.present();
      }
    } else {
      this.dataProvider.showToast(this.lang.no_internet);
    }
  }

  async handleImageSelection(source: 'camera' | 'gallery') {
    const base64Image = await this.imageService.takePicture(source);
    if (base64Image) {
      this.ChangeStudentProfileAvatar(base64Image);
    }
  }

  async OpenAvatarModel() {
    const modal = await this.modalController.create({
      component: AvatarImagesComponent,
      cssClass: 'my-custom-class',
      componentProps: { student: this.studentDetails }
    });

    modal.onDidDismiss().then((data: { data?: { image_url?: string } }) => {
      if (data && data.data && data.data.image_url) {
        this.dataProvider.showLoading();
        this.imageService
          .convertUrlToBase64(data.data.image_url)
          .then(base64 => {
            this.ChangeStudentProfileAvatar(base64);
          })
          .catch(err => {
            this.dataProvider.hideLoading();
            this.dataProvider.errorALertMessage('تعذر معالجة الصورة الرمزية، يرجى المحاولة مرة أخرى.');
          });
      }
    });
    return await modal.present();
  }

  async ChangeStudentProfileAvatar(base64Data: string) {
    if (!base64Data) {
      this.dataProvider.hideLoading();
      return;
    }

    try {
      const result = await this.dataProvider.run(() =>
        this.studentEngagement.uploadAvatar(base64Data, {
          user_no: this.userDetails.details.user_no,
          session_id: this.userDetails.session_id,
          sid: this.navData.student_id as string | number
        })
      );

      if (result.success) {
        this.studentDetails.pic = result.url;
        this.dataProvider.showToast('تم تحديث الصورة بنجاح');
      } else {
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(result.message);
      }
      this.cdr.markForCheck();
    } catch (error: unknown) {
      this.dataProvider.errorALertMessage((error as { message?: string })?.message || 'حدث خطأ في الاتصال');
    }
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

  async presentNoteActionSheet(event: Event, mode: string, note: StudentNote | '', note_id: string | number | '') {
    if (this.platform.width() >= 768 && event) {
      const popover = await this.popover.create({
        component: StudentOptionsPopoverComponent,
        event: event,
        componentProps: { student: this.studentDetails },
        mode: 'md',
        translucent: true,
        cssClass: 'custom-popover'
      });
      await popover.present();

      const { data } = await popover.onDidDismiss();

      this.zone.run(() => {
        if (data && data.selectedAction === 'review') this.openNoteModal('review', mode, note, note_id);
        if (data && data.selectedAction === 'note') this.openNoteModal('note', mode, note, note_id);
        if (data && data.selectedAction === 'points') this.openSkillTreeModal();
      });
    } else {
      const actionSheet = await this.actionSheetController.create({
        header: `إجراءات الطالب: ${this.studentDetails.name}`,
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
              this.openNoteModal('review', mode, note, note_id);
            }
          },
          {
            text:
              this.student_detailse && this.student_detailse.student_note
                ? this.student_detailse.student_note
                : 'إضافة ملاحظة',
            icon: 'document-text-outline',
            handler: () => {
              this.openNoteModal('note', mode, note, note_id);
            }
          },
          {
            text:
              this.student_detailse && this.student_detailse.student_point
                ? this.student_detailse.student_point
                : 'نقاط الطالب',
            icon: 'medal-outline',
            handler: () => {
              this.openSkillTreeModal();
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

  async openNoteModal(mode, note_mode, note, note_id) {
    if (mode === 'note') {
      if (note_mode === 'edit') {
        this.canAddStudentNote = true;
        this.noteMessage = note.note;
        this.id = note.id;
      }
      this.showNoteModal = true;
      this.cdr.markForCheck();
    } else {
      const modal = await this.modalController.create({
        component: AddReviewComponent,
        cssClass: 'my-custom-class',
        componentProps: { data: note_mode === 'edit' ? note : null, student: this.studentDetails }
      });
      modal.onDidDismiss().then(data => {
        if (data.data && data.data.data) {
          this.ratingStars = data.data.data;
          this.noteMessage = data.data.noteMessage;
          if (note_mode === 'edit') {
            this.udateNotes(data.data, note_id);
          } else {
            this.addNotesNote();
          }
          this.cdr.markForCheck();
        }
      });
      return await modal.present();
    }
  }

  hideNoteModal() {
    this.id = '';
    this.showNoteModal = false;
  }

  openPdf() {
    let data = {
      school_id: this.userDetails.details.school_id,
      sid: this.navData.student_id
    };
    let planData = {
      user_no: this.userDetails.details.user_no
    };
    this.dataProvider.showLoading();
    this.dataProvider
      .openPdf(planData)
      .then(res => {
        let url = env.serverURL + 'student_report_new?school_id=' + data.school_id + '&sid=' + data.sid;
        this.reportsApi
          .openStudentReport(url)
          .then(res => {
            this.dataProvider.hideLoading();
            if (res) {
              window.open(res.url, '_system');
            } else {
              this.dataProvider.showToast('Unable to generate report');
            }
          })
          .catch(e => {
            this.dataProvider.hideLoading();
            this.dataProvider.showToast('Unable to generate report');
          });
      })
      .catch(e => {
        this.dataProvider.hideLoading();
        this.presentAlertConfirm();
      });
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: this.planLang.not_valid,
      mode: 'ios',
      buttons: [
        {
          text: this.planLang.cancel,
          role: 'cancel',
          cssClass: 'secondary',
          handler: blah => {
            console.log('Confirm Cancel: blah');
          }
        },
        {
          text: this.planLang.subscribe,
          handler: () => {
            this.router.navigate(['available-plan']);
          }
        }
      ]
    });

    await alert.present();
  }


  async presentPrintOption(event: Event) {
    // if(this.AvailablePlan?.plan?.slug == 'free' || this.AvailablePlan?.isExpire == true){
    //   this.presentAlertPlanConfirm();
    //   return;
    // }

    if ((await Network.getStatus()).connected) {
      if (this.platform.width() >= 768 && event) {
        const popover = await this.popover.create({
          component: PrintOptionsPopoverComponent,
          event: event,
          mode: 'md',
          translucent: true,
          cssClass: 'custom-popover'
        });

        await popover.present();

        const { data } = await popover.onDidDismiss();

        if (data && data.selectedAction) {
          this.printReport(data.selectedAction);
        }
      } else {
        const actionSheet = await this.actionSheetController.create({
          header: this.lang.report_option || 'خيارات التصدير والطباعة',
          cssClass: 'custom-action-sheet',
          mode: 'md',
          buttons: [
            {
              text: this.lang.exel || 'تصدير كملف Excel',
              icon: 'grid-outline',
              cssClass: 'text-emerald-600 font-bold',
              handler: () => {
                this.printReport('exel');
              }
            },
            {
              text: this.lang.pdf || 'عرض كملف PDF',
              icon: 'document-text-outline',
              cssClass: 'text-rose-500 font-bold',
              handler: () => {
                this.printReport('pdf');
              }
            },
            {
              text: this.lang.cancel || 'إلغاء',
              icon: 'close',
              role: 'cancel',
              cssClass: 'text-slate-400 font-medium border-t border-slate-100',
              handler: () => {}
            }
          ]
        });
        await actionSheet.present();
      }
    } else {
      this.dataProvider.showToast(this.lang.no_internet);
    }
  }

  printReport(type) {
    let planData = {
      user_no: this.userDetails.details.user_no,
      report_type: type
    };

    this.dataProvider.showLoading();

    this.dataProvider
      .openPdf(planData)
      .then(res => {
        let studentData = {
          school_id: this.userDetails.details.school_id,
          sid: this.navData.student_id,
          report_type: type
        };

        if (type === 'pdf') {
          let url = env.serverURL + 'student_report_new?school_id=' + studentData.school_id + '&sid=' + studentData.sid;

          this.reportsApi
            .openStudentReport(url)
            .then(async (res) => {
              this.dataProvider.hideLoading();

              if (res && res.data) {
                let htmlContent = String(res.data);

                if (this.platform.is('cordova') || this.platform.is('capacitor')) {
                  let options: PrintOptions = { orientation: 'portrait' };
                  this.printer.print(htmlContent.replace(/(\r\n|\n|\r)/gm, ''), options).then(
                    () => {
                      console.log('تم فتح نافذة الطباعة بنجاح');
                    },
                    (e) => {
                      console.log('تعذرت الطباعة، سيتم الفتح في المتصفح', e);
                      this.openHtmlInBrowser(htmlContent);
                    }
                  );
                } else {
                  this.openHtmlInBrowser(htmlContent);
                }
              } else {
                this.dataProvider.showToast('تعذر جلب بيانات التقرير من الخادم');
              }
            })
            .catch(e => {
              this.dataProvider.hideLoading();
              this.dataProvider.showToast('خطأ في الاتصال بسيرفر التقارير');
            });
        } else {
          this.reportsApi.getStudentReport(studentData).then(
            async (res) => {
              this.dataProvider.hideLoading();
              if (res && res.data) {
                let splitUrl = String(res.data).split('/');
                let filename = splitUrl[splitUrl.length - 1];
                let url = `${environment.docUrl}uploads/stufollowup/${filename}`;
                await Browser.open({ url: url });
              } else {
                this.dataProvider.showToast(this.lang.report_error);
              }
            },
            error => {
              this.dataProvider.hideLoading();
              this.dataProvider.showToast(this.lang.report_error);
            }
          );
        }
      })
      .catch(e => {
        this.dataProvider.hideLoading();
        this.presentAlertConfirm();
      });
  }

  openHtmlInBrowser(htmlContent: string) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 1000);
    } else {
      this.dataProvider.showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) لعرض التقرير');
    }
  }

  async presentAlertPlanConfirm() {
    let buttonsAdmin = [
      {
        text: this.planLang.cancel,
        role: 'cancel',
        cssClass: 'secondary',
        handler: blah => {
          console.log('Confirm Cancel: blah');
        }
      },
      {
        text: this.planLang.subscribe,
        handler: () => {
          this.router.navigate(['available-plan']);
        }
      }
    ];
    let button = [
      {
        text: 'Ok',
        role: 'cancel',
        cssClass: 'secondary',
        handler: blah => {
          console.log('Confirm Cancel: blah');
        }
      }
    ];

    const alert = await this.alertCtrl.create({
      header:
        this.userDetails.details.is_school_admin == 1 ? this.planLang.not_valid : this.planLang.not_valid_for_others,
      mode: 'ios',
      buttons: this.userDetails.details.is_school_admin == 1 ? buttonsAdmin : button
    });

    await alert.present();
  }

  async presentAlertForPremiumsection() {
    let button = [
      {
        text: 'Ok',
        role: 'cancel',
        cssClass: 'secondary',
        handler: blah => {
          console.log('Confirm Cancel: blah');
        }
      }
    ];

    const alert = await this.alertCtrl.create({
      header: this.planLang.not_valid_for_others,
      mode: 'ios',
      buttons: button
    });

    await alert.present();
  }

  notes_action() {
    if (this.id) {
      this.EditStudentNotes();
    } else {
      this.addTextNotesNote();
    }
  }

  getArabicDayName(dateString) {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const formatter = new Intl.DateTimeFormat('ar', { weekday: 'long' });
    return formatter.format(date);
  }

  async openUserDetails(ev: Event, student: Student) {
    const modal = await this.modalController.create({
      component: StudentDetailsComponent,
      componentProps: {
        student: student,
        userType: this.userType,
        course_id: this.navData.course_id
      },
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
      handleBehavior: 'cycle',
      cssClass: 'lineone-bottom-sheet'
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'save' && data) {
      this.studentDetails.phone_no = data.phone_no;
      this.studentDetails.phone_no_two = data.phone_no_two;
      this.studentDetails.medical_condition = data.medical_condition;

      student.phone_no = data.phone_no;
      student.phone_no_two = data.phone_no_two;
      student.medical_condition = data.medical_condition;
      this.cdr.markForCheck();
    }
  }

  sendPushMessageToStudentParent(msg) {
    let studentData = {
      student_id: this.userDetails.details.school_id,
      message: msg,
      title: 'Absent'
    };
    this.userManagementApi.sendPushMessageToStudentParent(studentData).then(
      res => {
        console.log(res);
      },
      error => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(this.lang.report_error);
      }
    );
  }

  getStudentCallOfReports() {
    let data = {
      user_no: this.userDetails.details.user_no,
      student_id: this.navData.student_id,
      school_id: this.userDetails.details.school_id
    };
    this.reportsApi.GetAllCallOfStudentReport(data).then(
      res => {
        this.callOfStudentsReport = res.data;
        this.cdr.markForCheck();
      },
      error => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(this.lang.report_error);
      }
    );
    this.GetStudentPledgesReport();
  }

  GetStudentPledgesReport() {
    let data = {
      user_no: this.userDetails.details.user_no,
      student_id: this.navData.student_id,
      school_id: this.userDetails.details.school_id
    };
    this.reportsApi.GetStudentPledgesReport(data).then(
      res => {
        this.AllStudentPledgesReports = res.data;
        this.cdr.markForCheck();
      },
      error => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(this.lang.report_error);
      }
    );
  }

  printReports(type) {
    if (type == 'pledges') {
      let data = {
        user_no: this.userDetails.details.user_no,
        course_id: this.navData.course_id,
        student_id: this.navData.student_id,
        school_id: this.userDetails.details.school_id
      };
      this.dataProvider
        .run(() => this.reportsApi.generateStudentPledgesReportPDF(data))
        .then(
          res => {
            let data = res.data;
            let options: PrintOptions = { orientation: 'portrait' };
            this.printer.print(data.toString().replace(/(\r\n|\n|\r)/gm, '')).then(
              () => {},
              (e) => {
                this.dataProvider.showToast(this.lang.report_error);
              }
            );
          },
          error => {
            this.dataProvider.showToast(this.lang.report_error);
          }
        );
    }
    if (type == 'callOfParent') {
      let data = {
        user_no: this.userDetails.details.user_no,
        course_id: this.navData.course_id,
        student_id: this.navData.student_id,
        school_id: this.userDetails.details.school_id
      };
      this.dataProvider
        .run(() => this.reportsApi.generateCallOfStudentPDF(data))
        .then(
          res => {
            let data = res.data;
            let options: PrintOptions = { orientation: 'portrait' };
            this.printer.print(data.toString().replace(/(\r\n|\n|\r)/gm, '')).then(
              () => {},
              (e) => {
                this.dataProvider.showToast(this.lang.report_error);
              }
            );
          },
          error => {
            this.dataProvider.showToast(this.lang.report_error);
          }
        );
    }
  }

  showInventoryModal: boolean = false;
  activeCraftedTitle: string = null;

  @ViewChild(StudentInventoryModalComponent) inventoryModal: StudentInventoryModalComponent;

  // Loads inventory data before opening (not reactively on isOpen) so the
  // modal never flashes an empty state — matches the pre-extraction
  // behavior, where fetchInventory() was always awaited first too.
  async openInventoryModal() {
    await this.inventoryModal.fetchInventory();
    this.showInventoryModal = true;
    this.cdr.markForCheck();
  }

  closeInventoryModal() {
    this.showInventoryModal = false;
  }

  onInventoryActiveTitleChange(title: string | null) {
    this.activeCraftedTitle = title;
    if (this.studentDetails) {
      this.studentDetails.active_crafted_title = title;
    }
  }

  onInventoryStudentTitleChange(title: string) {
    this.studentTitle = title;
    this.cdr.markForCheck();
  }

  onInventorySkillsRefreshNeeded() {
    this.fetchStudentSkills(this.selectedStudentId);
  }

  async switchCategory(selectedCategory: string) {
    this.category = selectedCategory;

    if (this.category === 'absence' && !this.isAbsenceLoaded) {
      let followUpData = {
        date: this.navData.dateSelected || new Date().toISOString().split('T')[0],
        user_no: this.userDetails.details.user_no,
        session_id: this.userDetails.session_id,
        course_id: this.navData.course_id,
        school_id: this.userDetails.details.school_id
      };

      try {
        await this.dataProvider.run(async () => {
          const followUpRes = await this.followupFieldsApi.getFollowUpStudentList(followUpData);
          if (followUpRes && followUpRes.data && followUpRes.data.students) {
            let matched = followUpRes.data.students.find((s) => s.sid === this.navData.student_id);
            if (matched) {
              this.zone.run(() => {
                this.studentDetails.unacceptable_absent_days =
                  matched.unacceptable_absent_days !== undefined ? matched.unacceptable_absent_days : 0;
                this.studentDetails.suspend_days = matched.suspend_days !== undefined ? matched.suspend_days : 0;
                this.studentDetails.medical_days = matched.medical_days !== undefined ? matched.medical_days : 0;
                this.cdr.markForCheck();
              });
            }
          }

          let agg_ranking = this.notes && this.notes.agg_ranking ? Number(this.notes.agg_ranking) : 5;
          if (
            (Number(this.studentDetails.unacceptable_absent_days) == 10 ||
              Number(this.studentDetails.unacceptable_absent_days) == 15) &&
            agg_ranking < 4
          ) {
            let message = `عزيزي ولي الأمر، نحيطكم علماً بأن المتعلم ${this.studentDetails.name} معرض لخطر التعثر الدراسي.`;
            this.sendPushMessageToStudentParent(message);
          }

          this.isAbsenceLoaded = true;
          this.cdr.markForCheck();
        });
      } catch (e) {
        console.error(e);
      }
    } else if (this.category === 'pledgesAndCallOffParent' && !this.isReportsLoaded) {
      try {
        await this.dataProvider.run(async () => {
          this.getStudentCallOfReports();
          this.isReportsLoaded = true;
          this.cdr.markForCheck();
        });
      } catch (e) {
        console.log(e);
      }
    } else if (this.category === 'notes' && !this.isNotesLoaded) {
      try {
        await this.dataProvider.run(async () => {
          await this.getNotes();
          this.isNotesLoaded = true;
          this.cdr.markForCheck();
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  get selectedStudentId(): string | number {
    return (this.studentDetails?.sid || this.navData?.student_id) as string | number;
  }

  get isFrozen(): boolean {
    if (!this.studentDetails || !this.studentDetails.frozen_until) return false;
    const today = new Date().toISOString().split('T')[0];
    return this.studentDetails.frozen_until >= today;
  }

  get finalStudentTitle(): string {
    if (!this.studentDetails) return '🌱 بطل في البداية';

    const activeTitle = this.studentDetails.active_crafted_title;

    const skillsData = {
      cognitive: Number(this.studentDetails.cognitive || 0),
      social: Number(this.studentDetails.social || 0),
      discipline: Number(this.studentDetails.discipline || 0),
      emotional: Number(this.studentDetails.emotional || 0),
      practical: Number(this.studentDetails.practical || 0)
    };

    const totalPoints = Number(this.studentDetails.student_points || 0);

    return this.gamification.getFinalStudentTitle(activeTitle, skillsData, totalPoints);
  }

  getStudentTitle(student: Student): string {
    if (!student) return '🌱 بطل في البداية';

    const activeCode =
      student.active_crafted_title ||
      student.student_data?.active_crafted_title ||
      this.activeCraftedTitle ||
      student.active_title ||
      student.title;

    const skillsData = {
      cognitive: Number(student.cognitive || this.studentSkillData?.cognitive || 0),
      social: Number(student.social || this.studentSkillData?.social || 0),
      discipline: Number(student.discipline || this.studentSkillData?.discipline || 0),
      emotional: Number(student.emotional || this.studentSkillData?.emotional || 0),
      practical: Number(student.practical || this.studentSkillData?.practical || 0)
    };
    const totalPoints = Number(student.student_points || this.studentTotalPoints || 0);

    return this.gamification.getFinalStudentTitle(activeCode, skillsData, totalPoints);
  }

  // 🟢 دالة للتعامل مع زر العودة بناءً على نوع المستخدم
  goBack() {
    // إذا كان المستخدم ولي أمر (userType == '4')
    if (this.userType == UserType.Parent || this.userDetails?.details?.user_type == UserType.Parent) {
      this.zone.run(() => {
        // تم إضافة مسار الصفحة هنا بشكل صحيح
        // ملاحظة: إذا كان المسار مختلفاً في ملف التوجيه (routing)، قم بتغييره، مثلاً
        this.router.navigate(['/tabs/children'], { replaceUrl: true });
      });
    } else {
      // للمستخدمين الآخرين (معلم، إدارة، مشرف)
      this.navCtrl.back();
    }
  }
}
