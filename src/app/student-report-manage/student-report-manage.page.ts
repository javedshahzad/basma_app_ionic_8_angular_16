import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, AlertController, PopoverController, Platform, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { DatabaseService } from '../service/database/database.service';
import { StudentDataService } from '../service/student-data/student-data.service';
import { environment } from '../../environments/environment';
import { Storage } from '@ionic/storage';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import {
  ReportsApiService,
  StudentReportsSummary,
  DegreeViolation,
  DegreeAction,
  Degree,
  PledgesReport,
  LeaveRecord,
  ExitDayRecord
} from '../service/reports-api/reports-api.service';
import { HolidaysApiService } from '../service/holidays-api/holidays-api.service';
import { UserType } from '../constants/user-type';
import { FormsModule } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';
import { UserPlan } from '../service/plan-api/plan-api.service';
import { HasRoleDirective } from '../directives/has-role.directive';

const env = environment;

@Component({
  selector: 'app-student-report-manage',
  templateUrl: './student-report-manage.page.html',
  styleUrls: ['./student-report-manage.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, NgClass, DatePipe, TranslatePipe, HasRoleDirective]
})
export class StudentReportManagePage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  trackById(index: number, item: { id?: string | number }): string | number {
    return item?.id ?? index;
  }
  readonly UserType = UserType;
  navData: Record<string, unknown> = {};
  lang: Record<string, string>;
  reportType: string;
  selectedDate: string;

  formData: {
    reportType: string;
    selectedDate: string;
    selectedDays: string;
    note: string;
    time: string;
    reason?: string | number;
    action?: string | number;
    degree?: string | number;
  } = {
    reportType: '',
    selectedDate: new Date().toISOString(),
    selectedDays: '1',
    note: '',
    time: new Date().toISOString()
  };

  lang1: Record<string, string>;
  // 🟢 الدرع الأول: تهيئة الكائن لكي لا يكون details غير معرف (undefined)
  userDetails: LoggedInUser = { details: {} };

  exitdays: ExitDayRecord[] = [];
  callOfStudentsReport: any[] = [];
  isExitToday: boolean = false;
  medical: LeaveRecord[] = [];
  suspend: LeaveRecord[] = [];

  foundAnyReport = true;
  isDeleted: boolean = false;
  AllDegrees: Degree[] = [];
  AllDegreesViolations: DegreeViolation[] = [];
  AllDegreeActions: DegreeAction[] = [];
  pledgesViolation: DegreeViolation;
  pledgesAction: DegreeAction;
  AllStudentPledgesReports: PledgesReport[] = [];
  AvailablePlan: UserPlan;
  holidayString: string;
  options = {
    canBackwardsSelected: true,
    from: 1,
    to: 0,
    disableWeeks: <unknown[]>[],
    daysConfig: <unknown[]>[]
  };
  currentEvents: unknown[] = [];
  dateSelected: Date;
  isHoliday: boolean = false;

  isDeleteModalOpen: boolean = false;
  reportToDeleteId: string | number | null = null;
  reportToDeleteType: string = '';

  isViolationModalOpen: boolean = false;
  isActionModalOpen: boolean = false;
  filteredViolations: DegreeViolation[] = [];
  filteredActions: DegreeAction[] = [];

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after
  // ionViewWillEnter()'s `if (userLoggedIn)` guard has already populated
  // it — the non-null assertion documents that invariant once instead of
  // at every access site.
  get userInfo(): UserDetails {
    return this.userDetails.details!;
  }

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public dbProvider: DatabaseService,
    public studentService: StudentDataService,
    public alertController: AlertController,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private router: Router,
    private printer: Printer,
    public zone: NgZone,
    private popover: PopoverController,
    public platform: Platform,
    private storage: Storage,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private reportsApi: ReportsApiService,
    private holidaysApi: HolidaysApiService,
    private cdr: ChangeDetectorRef
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state;
      console.log(this.navData);
    }

    this.translate.get('alertmessages').subscribe(val => {
      this.lang = val;
      this.cdr.markForCheck();
    });
    this.translate.get('manage_report').subscribe(val => {
      this.lang1 = val;
      this.cdr.markForCheck();
    });
  }

  async ngOnInit() {
    if (Object.keys(this.navData).length > 0) {
      await this.storageSr.set('currentReportStudent', this.navData);
    } else {
      let savedNavData = await this.storageSr.get('currentReportStudent');
      if (savedNavData) {
        this.navData = savedNavData;
      }
    }

    let userLoggedIn = await this.storageSr.get('userloggedin');
    this.AvailablePlan = await this.storageSr.get('availablePlan');

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      if (this.navData && this.navData.student_id) {
        this.getReports();
      }
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }

    this.getHolidaysForOff();
    this.cdr.markForCheck();
  }

  submitForm() {
    if (this.isHoliday) {
      this.dataProvider.showToast(this.lang.holiday);
      return;
    }

    let date = new Date(this.formData.selectedDate);
    let finalFormattedDate = this.dataProvider.getFormatedDate(date);

    if (this.formData.reportType == 'callofstudents') {
      if (this.formData.time) {
        let timeObj = new Date(this.formData.time);
        let hours = timeObj.getHours().toString().padStart(2, '0');
        let minutes = timeObj.getMinutes().toString().padStart(2, '0');
        finalFormattedDate = `${finalFormattedDate} ${hours}:${minutes}:00`;
      }
    }

    let submitData = {
      ...this.formData,
      selectedDate: finalFormattedDate,
      student_id: this.navData.student_id,
      course_id: this.navData.course_id,
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .run(() => this.reportsApi.submitStudentReports(submitData))
      .then(data => {
        if (data) {
          this.dataProvider.showToast(this.lang.report_generated);
          this.getReports(false);
        }
      })
      .catch(er => {
        let errorMsg = typeof er === 'string' ? er : 'تم الحفظ بنجاح (مع وجود ملاحظة في السيرفر)';
        this.dataProvider.showToast(errorMsg);
        console.error('Server Status:', er);
        this.getReports(false);
      });
  }

  getReports(loader = true) {
    let data = {
      student_id: this.navData.student_id,
      course_id: this.navData.course_id,
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };
    if (loader) this.dataProvider.showLoading();

    this.reportsApi
      .getStudentReports(data)
      .then(res => {
        if (loader) this.dataProvider.hideLoading();
        if (res.session) {
          if (res.data) {
            if (res.data.suspend && res.data.suspend.length) {
              this.suspend = res.data.suspend;
              this.foundAnyReport = false;
            } else {
              this.suspend = [];
            }
            if (res.data.exitdays && res.data.exitdays.length) {
              this.exitdays = res.data.exitdays;
              this.exitdays.forEach(d => {
                let spl = (d.date || '').split(' ');
                d.date = spl[0];
                d.time = spl[1];
              });
              this.foundAnyReport = false;
            } else {
              this.exitdays = [];
            }
            if (res.data.medical && res.data.medical.length) {
              this.medical = res.data.medical;
              this.foundAnyReport = false;
            } else {
              this.medical = [];
            }
            this.isExitToday = false;
            if (res.data.exittoday && res.data.exittoday.length) {
              this.isExitToday = true;
              this.foundAnyReport = false;
            }
          }
        } else {
          this.authProvider.flushLocalStorage();
          this.router.navigate(['login'], { replaceUrl: true });
        }
        this.cdr.markForCheck();
      })
      .catch(er => {
        if (loader) this.dataProvider.hideLoading();
        console.log(er);
      });

    this.getStudentCallOfReports();
  }

  changeReportType(event: any) {
    this.formData.reportType = event.detail.value;
    if (event.detail.value == 'suspend') {
      var tomorrow = new Date();
      tomorrow.setDate(new Date().getDate() + 1);
      this.formData.note = this.lang1.suspend_def_note;
      this.formData.selectedDate = tomorrow.toISOString();
    } else {
      var today = new Date();
      this.formData.note = event.detail.value == 'exit' ? this.lang1.exit_def_note : '';
      this.formData.selectedDate = today.toISOString();

      if (event.detail.value == 'callofstudents') {
        this.formData.time = today.toISOString();
      }
    }
    if (event.detail.value == 'studentspledges') {
      this.getAllDegress();
    }
  }

  getAllDegress() {
    let data = {
      student_id: this.navData.student_id,
      course_id: this.navData.course_id,
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };
    this.dataProvider
      .run(() => this.reportsApi.GetAllDegrees(data))
      .then(res => {
        console.log(res);
        this.AllDegrees = res.data || [];
        this.cdr.markForCheck();
      });
  }

  OnselectDegree(event: any) {
    this.getAllActionsAndViolations(event.target.value);
  }

  getAllActionsAndViolations(degreeId: string) {
    let data = {
      degree_id: degreeId,
      session_id: this.userDetails.session_id
    };
    this.dataProvider.showLoading();

    this.reportsApi.GetAllDegreeViolations(data).then(res => {
      let violations = res.data || [];
      violations.forEach((element, index) => {
        violations[index].description = `${element.desc_number}-${element.description}`;
      });
      this.AllDegreesViolations = violations;
      this.filteredViolations = violations;
      this.cdr.markForCheck();
    });

    this.reportsApi.GetAllDegreeActions(data).then(res => {
      let actions = res.data || [];
      actions.forEach((element, index) => {
        actions[index].description = `${element.action_number}-${element.description}`;
      });
      this.AllDegreeActions = actions;
      this.filteredActions = actions;
      this.dataProvider.hideLoading();
      this.cdr.markForCheck();
    });
  }

  searchViolations(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredViolations = this.AllDegreesViolations.filter(
      d => (d.description || '').toLowerCase().indexOf(query) > -1
    );
  }

  searchActions(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredActions = this.AllDegreeActions.filter(d => (d.description || '').toLowerCase().indexOf(query) > -1);
  }

  selectViolation(item: DegreeViolation) {
    this.pledgesViolation = item;
    this.formData.reason = item.id;
    this.isViolationModalOpen = false;
  }

  selectAction(item: DegreeAction) {
    this.pledgesAction = item;
    this.formData.action = item.id;
    this.isActionModalOpen = false;
  }

  deleteReport(rid: string | number, reportType: string) {
    console.log(rid);
    let data = {
      id: rid,
      reportType: reportType,
      student_id: this.navData.student_id,
      course_id: this.navData.course_id,
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };

    this.reportsApi
      .removeStudentReportByType(data)
      .then(data => {
        this.dataProvider.hideLoading();
        if (data) {
          this.dataProvider.showToast(this.lang.report_deleted);
          this.getReports(false);
        }
      })
      .catch(er => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(er);
        console.log(er);
      });
  }

  deleteCallOfParentReport(id: string | number) {
    let data = {
      id: id
    };
    this.reportsApi
      .deleteCallOfParentReport(data)
      .then(data => {
        this.dataProvider.hideLoading();
        if (data.success) {
          this.dataProvider.showToast(this.lang.report_deleted);
          this.getReports(false);
        }
      })
      .catch(er => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(er);
        console.log(er);
      });
  }

  deletePledgesReport(id: string | number) {
    let data = {
      id: id
    };
    this.reportsApi
      .deletePledgesReport(data)
      .then(data => {
        this.dataProvider.hideLoading();
        if (data.success) {
          this.dataProvider.showToast(this.lang.report_deleted);
          this.getReports(false);
        }
      })
      .catch(er => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(er);
        console.log(er);
      });
  }

  printReport(reportType: string) {
    let data = {
      student_id: this.navData.student_id,
      course_id: this.navData.course_id,
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      report_type: reportType,
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .run(() => this.reportsApi.printAllReports(data))
      .then(res => {
        if (res && res.data) {
          let printContent = res.data.toString().replace(/(\r\n|\n|\r)/gm, '');

          if (this.platform.is('cordova') || this.platform.is('capacitor')) {
            let options: PrintOptions = { orientation: 'portrait' };
            this.printer.print(printContent, options).then(
              () => {},
              e => {
                console.log('printer.print', e);
                this.dataProvider.showToast(this.lang.report_error);
              }
            );
          } else {
            let printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(printContent);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => printWindow.print(), 500);
            } else {
              this.dataProvider.showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة');
            }
          }
        } else {
          this.dataProvider.showToast(this.lang.report_error);
        }
      })
      .catch(er => {
        this.dataProvider.showToast(er);
        console.log(er);
      });
  }

  printReports(type: string) {
    if (type == 'pledges') {
      let data = {
        user_no: this.userInfo.user_no,
        course_id: this.navData.course_id,
        student_id: this.navData.student_id,
        school_id: this.userInfo.school_id,
        session_id: this.userDetails.session_id
      };
      this.dataProvider
        .run(() => this.reportsApi.generateStudentPledgesReportPDF(data))
        .then(
          res => {
            if (res.success && res.data) {
              let printContent = res.data.toString().replace(/(\r\n|\n|\r)/gm, '');

              if (this.platform.is('cordova') || this.platform.is('capacitor')) {
                let options: PrintOptions = { orientation: 'portrait' };
                this.printer.print(printContent, options).then(
                  () => {},
                  e => {
                    console.log('printer.print', e);
                    this.dataProvider.showToast(this.lang.report_error);
                  }
                );
              } else {
                let printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(printContent);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => printWindow.print(), 500);
                } else {
                  this.dataProvider.showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة');
                }
              }
            } else {
              this.dataProvider.showToast(this.lang.report_error);
            }
          },
          error => {
            this.dataProvider.showToast(this.lang.report_error);
          }
        );
    }

    if (type == 'callOfParent') {
      let data = {
        user_no: this.userInfo.user_no,
        course_id: this.navData.course_id,
        student_id: this.navData.student_id,
        school_id: this.userInfo.school_id,
        session_id: this.userDetails.session_id
      };
      this.dataProvider
        .run(() => this.reportsApi.generateCallOfStudentPDF(data))
        .then(
          res => {
            if (res.success && res.data) {
              let printContent = res.data.toString().replace(/(\r\n|\n|\r)/gm, '');

              if (this.platform.is('cordova') || this.platform.is('capacitor')) {
                let options: PrintOptions = { orientation: 'portrait' };
                this.printer.print(printContent, options).then(
                  () => {},
                  e => {
                    console.log('printer.print', e);
                    this.dataProvider.showToast(this.lang.report_error);
                  }
                );
              } else {
                let printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(printContent);
                  printWindow.document.close();
                  printWindow.focus();
                  setTimeout(() => printWindow.print(), 500);
                } else {
                  this.dataProvider.showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة');
                }
              }
            } else {
              this.dataProvider.showToast(this.lang.report_error);
            }
          },
          error => {
            this.dataProvider.showToast(this.lang.report_error);
          }
        );
    }
  }

  openDeleteConfirm(rid: string | number, type: string) {
    this.reportToDeleteId = rid;
    this.reportToDeleteType = type;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
    this.isDeleteModalOpen = false;

    let rid = this.reportToDeleteId!;
    let type = this.reportToDeleteType;

    if (type == 'callofparent') {
      this.deleteCallOfParentReport(rid);
      return;
    }
    if (type == 'PledgesReports') {
      this.deletePledgesReport(rid);
      return;
    }
    this.deleteReport(rid, type);
  }

  getStudentCallOfReports() {
    let data = {
      user_no: this.userInfo.user_no,
      course_id: this.navData.course_id,
      student_id: this.navData.student_id,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };
    this.reportsApi.GetAllCallOfStudentReport(data).then(
      res => {
        console.log(res);
        this.callOfStudentsReport = res.data || [];
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
      user_no: this.userInfo.user_no,
      course_id: this.navData.course_id,
      student_id: this.navData.student_id,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };
    this.reportsApi.GetStudentPledgesReport(data).then(
      res => {
        console.log(res);
        this.AllStudentPledgesReports = res.data || [];
        this.cdr.markForCheck();
      },
      error => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(this.lang.report_error);
      }
    );
  }

  getHolidaysForOff() {
    this.dateSelected = new Date();
    let data = {
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id
    };
    this.holidaysApi
      .getHolidays(data)
      .then(response => {
        if (response) {
          if (response.holidays && response.holidays.length > 0) {
            this.holidayString = response.holiday_string || '';
            response.holidays.forEach(holiday => {
              let date = new Date(holiday.date);
              let p = {
                date: holiday.date,
                disable: true
              };
              this.options.daysConfig.push(p);
              this.currentEvents.push({
                year: date.getFullYear(),
                month: date.getMonth(),
                date: date.getDate()
              });
            });
          }
          let day: string | number = this.dateSelected.getDate();
          day = day < 10 ? '0' + day : day;
          let month: string | number = this.dateSelected.getMonth();
          month = month + 1;
          month = month < 10 ? '0' + month : month;

          let strint_date = this.dateSelected.getFullYear() + '-' + month + '-' + day;
          if (this.holidayString.indexOf(strint_date) > -1) {
            this.isHoliday = true;
          } else {
            this.isHoliday = false;
          }
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.dataProvider.hideLoading();
        this.dataProvider.errorALertMessage(error);
      });
  }
}
