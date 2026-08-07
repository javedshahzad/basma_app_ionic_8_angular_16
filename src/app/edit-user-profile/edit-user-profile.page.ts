import {
  Component,
  NgZone,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, Platform, ActionSheetController, PopoverController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { DeviceApiService } from '../service/device-api/device-api.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';
import { CoursesApiService } from '../service/courses-api/courses-api.service';
import { UserType } from '../constants/user-type';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass, NgFor } from '@angular/common';

@Component({
    selector: 'app-edit-user-profile',
    templateUrl: './edit-user-profile.page.html',
    styleUrls: ['./edit-user-profile.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, NgIf, NgClass, NgFor, TranslatePipe]
})
export class EditUserProfilePage {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;
  private destroyRef = inject(DestroyRef);
  navData: any;
  lang: any = {};
  userDetails: any;
  user: any = {};
  classes: any = [];
  show_save_user_spinner: boolean = false;
  userType: any;

  isPopoverOpen: boolean = false;
  popoverEvent: any;
  activePermissionType: string = '';

  isClassModalOpen: boolean = false;
  classSearchQuery: string = '';
  selectedClasses: any[] = [];
  filteredClasses: any[] = [];
  searchTerm: string = '';

  showDeleteModal: boolean = false;
  show_delete_user_spinner: boolean = false;

  returnPath: string = 'users-list'; // المسار الافتراضي

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
    public actionSheetController: ActionSheetController,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private deviceApi: DeviceApiService,
    private userManagementApi: UserManagementApiService,
    private coursesApi: CoursesApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });

    // 🟢 التقاط البيانات عبر Router مع التخزين للحماية من الـ Refresh
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.navData = navigation.extras.state['user'];

        if (navigation.extras.state['returnPath']) {
          this.returnPath = navigation.extras.state['returnPath'];
        }

        // حفظ البيانات مؤقتاً
        await this.storageSr.set('editUserProfileContext', {
          navData: this.navData,
          returnPath: this.returnPath
        });

        this.initUserData();
      } else {
        // استرجاع البيانات في حالة التحديث (Refresh)
        let savedData = await this.storageSr.get('editUserProfileContext');
        if (savedData) {
          this.navData = savedData.navData;
          this.returnPath = savedData.returnPath;
          this.initUserData();
        }
      }
      this.cdr.markForCheck();
    });
  }


  async ionViewWillEnter() {
    // 🟢 قراءة بيانات المشرف أو المدير الحالي بأمان
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.getClasses();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  // 🟢 استرجاع منطق تهيئة بيانات المستخدم (تم إعادته بالكامل)
  initUserData() {
    if (!this.navData) return;

    this.user.email_id = this.navData.email_id;
    this.user.first_name = this.navData.first_name;
    this.user.username = this.navData.username;
    this.user.user_type = this.navData.user_type;
    this.user.status = this.navData.status;

    // قراءة نوع المعلم
    let rawType = this.navData.teacher_type || this.navData.assigned_as;
    let tType = rawType ? String(rawType).trim().toLowerCase() : '';
    this.user.teacher_type = tType === 'split' ? 'split' : 'regular';

    // قراءة الفصول
    if (this.navData.in_class) {
      this.user.class = [...this.navData.in_class];
    } else if (this.navData.class || this.navData.classes) {
      let classData = this.navData.class || this.navData.classes;
      try {
        this.user.class = typeof classData === 'string' ? JSON.parse(classData) : classData;
      } catch (e) {
        this.user.class = [];
      }
    } else {
      this.user.class = [];
    }

    this.user.is_show_absent_students = this.navData.is_show_absent_students;
    this.user.is_show_absent_application_list = this.navData.is_show_absent_application_list;

    // صلاحية تعديل الغياب
    let hasEditPower =
      this.navData.attendence_permit == '1' ||
      this.navData.moderatorAttenEditPower == '1' ||
      this.navData.TeacherAttenEditPower == '1';
    this.user.attendence_permit = hasEditPower ? true : false;

    // وقت التعديل للمعلم
    this.user.time = this.navData.time || this.navData.editTimeForTeacher || '';
  }

  get selectInterface(): string {
    return window.innerWidth > 768 ? 'popover' : 'action-sheet';
  }

  async openPermissionMenu(event: any, type: string) {
    if (this.user.status === '0' && (type === 'absent' || type === 'application')) {
      this.dataProvider.showToast('لا يمكن تعديل هذه الصلاحية والحساب غير نشط');
      return;
    }

    if (this.platform.width() >= 768) {
      this.activePermissionType = type;
      this.popoverEvent = event;
      this.isPopoverOpen = true;
    } else {
      let headerText = '';
      let buttons = [];

      if (type === 'status') {
        headerText = this.translate.instant('user_profile.action') || 'الحالة';
        buttons = [
          {
            text: this.translate.instant('user_profile.active') || 'نشط',
            icon: 'checkmark-circle-outline',
            cssClass: this.user.status == '1' ? 'text-emerald-500 font-bold' : 'text-slate-600',
            handler: () => {
              this.setPermission('status', '1');
            }
          },
          {
            text: this.translate.instant('user_profile.inactive') || 'غير نشط',
            icon: 'close-circle-outline',
            cssClass: this.user.status == '0' ? 'text-rose-500 font-bold' : 'text-slate-600',
            handler: () => {
              this.setPermission('status', '0');
            }
          }
        ];
      } else if (type === 'absent') {
        headerText = this.translate.instant('teacher_profile.absent_students') || 'الطلاب الغائبون';
        buttons = [
          {
            text: this.translate.instant('teacher_profile.show') || 'عرض',
            icon: 'eye-outline',
            cssClass: this.user.is_show_absent_students == '1' ? 'text-indigo-500 font-bold' : 'text-slate-600',
            handler: () => {
              this.setPermission('absent', '1');
            }
          },
          {
            text: this.translate.instant('teacher_profile.hide') || 'إخفاء',
            icon: 'eye-off-outline',
            cssClass: this.user.is_show_absent_students == '0' ? 'text-slate-500 font-bold' : 'text-slate-600',
            handler: () => {
              this.setPermission('absent', '0');
            }
          }
        ];
      } else if (type === 'application') {
        headerText = this.translate.instant('teacher_profile.application_list') || 'الطلبات المقدمة';
        buttons = [
          {
            text: this.translate.instant('teacher_profile.show') || 'عرض',
            icon: 'eye-outline',
            cssClass: this.user.is_show_absent_application_list == '1' ? 'text-indigo-500 font-bold' : 'text-slate-600',
            handler: () => {
              this.setPermission('application', '1');
            }
          },
          {
            text: this.translate.instant('teacher_profile.hide') || 'إخفاء',
            icon: 'eye-off-outline',
            cssClass: this.user.is_show_absent_application_list == '0' ? 'text-slate-500 font-bold' : 'text-slate-600',
            handler: () => {
              this.setPermission('application', '0');
            }
          }
        ];
      }

      buttons.push({
        text: this.translate.instant('alertmessages.alert_btn_cancel_text') || 'إلغاء',
        icon: 'close',
        role: 'cancel',
        cssClass: 'text-rose-500 font-bold border-t border-slate-100'
      });

      const actionSheet = await this.actionSheetController.create({
        header: headerText,
        cssClass: 'custom-action-sheet',
        buttons: buttons
      });
      await actionSheet.present();
    }
  }

  setPermission(type: string, value: string) {
    if (type === 'status') {
      this.user.status = value;
    } else if (type === 'absent') {
      this.user.is_show_absent_students = value;
    } else if (type === 'application') {
      this.user.is_show_absent_application_list = value;
    }
    this.isPopoverOpen = false;
  }

  filterClasses() {
    if (!this.classSearchQuery || this.classSearchQuery.trim() === '') {
      this.filteredClasses = [...this.classes];
    } else {
      const query = this.classSearchQuery.toLowerCase();
      this.filteredClasses = this.classes.filter(c => c.name && c.name.toLowerCase().includes(query));
    }
  }

  openClassModal() {
    this.filteredClasses = [...this.classes];
    this.classSearchQuery = '';
    this.isClassModalOpen = true;
  }

  isClassSelected(cls: any): boolean {
    if (!this.user.class || !Array.isArray(this.user.class)) return false;
    let targetId = cls.cid || cls.id;
    return this.user.class.some((c: any) => c.cid === targetId || c.id === targetId);
  }

  toggleSelectedClass(cls: any) {
    if (!this.user.class || !Array.isArray(this.user.class)) {
      this.user.class = [];
    }

    let targetId = cls.cid || cls.id;
    const index = this.user.class.findIndex((c: any) => c.cid === targetId || c.id === targetId);

    if (index > -1) {
      this.user.class.splice(index, 1);
    } else {
      this.user.class.push(cls);
    }
  }

  getSelectedClassesText(): string {
    if (!this.user.class || this.user.class.length === 0) {
      return this.translate.instant('user_profile.class') || 'اضغط لتحديد الصفوف...';
    }
    if (this.user.class.length === 1) {
      return this.user.class[0].name;
    }
    return `تم تحديد (${this.user.class.length}) صفوف`;
  }

  async logoutDeviceFromAll(): Promise<void> {
    let data = {
      user_no: this.navData.user_no
    };
    try {
      await this.dataProvider.run(() => this.deviceApi.LogOutAllDevice(data));
    } catch (error) {
      this.dataProvider.showToast('error');
    }
    // 🟢 نكمل العملية حتى لو فشل الطرد لتتم عملية الحفظ
  }

  async saveUserProfile() {
    // 🟢 إضافة كلمة async هنا ضروري جداً
    if (this.user.password && this.user.password != this.user.c_pass) {
      this.dataProvider.showToast(this.lang.pass_not_match || 'كلمة المرور غير متطابقة');
    } else {
      this.show_save_user_spinner = true;
      this.user.school_id = this.navData.school_id;
      this.user.userId = this.navData.user_no;
      this.user.user_no = this.userDetails?.details?.user_no;

      if (typeof this.user.class === 'object') {
        this.user.class = JSON.stringify(this.user.class);
      }

      let permitValue =
        this.user.attendence_permit === true || this.user.attendence_permit == 1 || this.user.attendence_permit == '1'
          ? 1
          : 0;

      this.user.attendence_permit = permitValue;
      this.user.moderatorAttenEditPower = permitValue;
      this.user.TeacherAttenEditPower = permitValue;

      this.user.teacher_type = this.user.user_type == UserType.Teacher ? this.user.teacher_type : '';

      // 🟢 ضمان إرسال الحالة كنص صريح ('0' أو '1') لمنع أخطاء السيرفر
      this.user.status = this.user.status == '1' || this.user.status == 1 ? '1' : '0';

      // 🟢 السحر هنا: ننتظر (await) حتى ينتهي السيرفر من الطرد تماماً قبل الحفظ
      if (this.user.status == '0' || (this.user.password && this.user.password != '' && this.user.c_pass)) {
        await this.logoutDeviceFromAll();
      }

      // 🟢 الآن وبعد استقرار قاعدة البيانات، نقوم بإرسال التعديل براحة تامة
      this.show_save_user_spinner = false;
      this.cdr.markForCheck();

      // 🟢 السلوك الأصلي يكمل التوجيه دائماً بغض النظر عن نجاح/فشل الطلب
      this.userManagementApi.updateUserProfile(this.user).finally(() => {
        const navigation: NavigationExtras = {
          state: {
            isUpdated: true
          }
        };
        this.zone.run(() => {
          this.router.navigate([this.returnPath], navigation);
        });
      });
    }
  }

  async getClasses() {
    let data = {
      user_no: this.userDetails?.details?.user_no,
      school_id: this.userDetails?.details?.school_id,
      session_id: this.userDetails?.session_id
    };
    try {
      const response = await this.dataProvider.run(() => this.coursesApi.getCourses(data));
      if (response.session) {
        this.classes = response.data;
      }
    } catch (error) {
      this.dataProvider.errorALertMessage(error);
    }
    this.cdr.markForCheck();
  }

  compareClasses(c1: any, c2: any) {
    return c1 && c2 ? c1.cid === c2.cid : c1 === c2;
  }

  check() {
    console.log('حالة الزر الحالية:', this.user.attendence_permit);
  }

  portChange(event) {
    this.user.class = JSON.stringify(event.value);
  }

  openDeleteModal() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  confirmDelete() {
    this.show_delete_user_spinner = true;

    let data = {
      users_user_no: this.navData.user_no,
      school_id: this.userDetails?.details?.school_id,
      session_id: this.userDetails?.session_id
    };

    // 🟢 الإرجاع للدالة الأصلية بمدخلاتها الصحيحة (data, callback)
    this.userManagementApi
      .deleteUser(data)
      .then((response: any) => {
        this.show_delete_user_spinner = false;
        this.closeDeleteModal();

        // 🟢 الخدمة الأصلية كانت تعرض هذا التوست دائماً عند وجود استجابة، قبل التفرع
        this.dataProvider.showToast(response.msg);

        if (response && (response.success || response.response === true)) {
          this.dataProvider.showToast(response.msg || 'تم الحذف بنجاح');

          const navigation: NavigationExtras = {
            state: { isUpdated: true }
          };
          this.zone.run(() => {
            this.router.navigate([this.returnPath], navigation);
          });
        } else {
          this.dataProvider.errorALertMessage(response?.msg || 'حدث خطأ أثناء الحذف');
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.show_delete_user_spinner = false;
        console.log(error);
        this.cdr.markForCheck();
      });
  }
}
