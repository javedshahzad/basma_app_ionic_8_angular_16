import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { SearchApiService } from '../service/search-api/search-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { TeacherManagementApiService, PendingTeacher } from '../service/teacher-management-api/teacher-management-api.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-teacher',
  templateUrl: './manage-teacher.page.html',
  styleUrls: ['./manage-teacher.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, TranslatePipe]
})
export class ManageTeacherPage {
  trackByIndex(index: number): number {
    return index;
  }
  course: any;
  userDetails: any;
  lang: any;
  teacherList: any = [];
  noTeacher = false;
  selectedTeacher: any = [];
  trimmedTeacher: any = [];
  show_loading: boolean = false;

  // 🟢 متغيرات البحث الآمن
  searchQuery: string = '';
  searchTimeout: any;

  // docs/SELF_REGISTRATION_VIA_SCHOOL_CODE_PLAN.md §6.6 -- pending-approval
  // tab, mirroring requested-parent's segmented-control pattern.
  category: 'teachers' | 'requested' = 'teachers';
  pendingTeachers: PendingTeacher[] = [];
  noPendingTeachers: boolean = false;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    public zone: NgZone,
    private router: Router,
    public modalController: ModalController,
    private storageSr: StorageService, // 🟢 حقن الخدمة
    private searchApi: SearchApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private teacherManagementApi: TeacherManagementApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    // 🟢 استقبال إشارة التحديث بأمان
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      let isUpdated = navigation.extras.state['isUpdated'];
      if (isUpdated) {
        this.refreshData(); // دالة مخصصة لتحديث البيانات بهدوء
      }
    }
  }

  // 🟢 استخدام async/await للتعامل مع الذاكرة وجلب المعلمين بأمان
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.getTeacher(true);
      this.getPendingTeachers();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  async refreshData() {
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.getTeacher(false); // تحديث بدون Loading
      this.getPendingTeachers();
    }
    this.cdr.markForCheck();
  }

  getPendingTeachers() {
    let data = {
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    this.teacherManagementApi.getPendingTeachers(data).then(
      res => {
        this.pendingTeachers = res.data || [];
        this.noPendingTeachers = this.pendingTeachers.length < 1;
        this.cdr.markForCheck();
      },
      error => {
        console.log(error);
        this.cdr.markForCheck();
      }
    );
  }

  acceptPendingTeacher(teacher: PendingTeacher) {
    let data = {
      teacher_user_no: teacher.user_no,
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .run(() => this.teacherManagementApi.acceptPendingTeacher(data))
      .then(res => {
        if (res.session) {
          this.getPendingTeachers();
          this.getTeacher(false);
          this.dataProvider.showToast(this.lang.request_accepted);
        } else {
          this.dataProvider.showToast(this.lang.request_not_accepted);
        }
      })
      .catch(error => {
        this.dataProvider.showToast(error);
      });
  }

  deletePendingTeacher(teacher: PendingTeacher) {
    let data = {
      teacher_user_no: teacher.user_no,
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .run(() => this.teacherManagementApi.deletePendingTeacher(data))
      .then(res => {
        if (res.session) {
          this.getPendingTeachers();
          this.dataProvider.showToast(this.lang.request_deleted);
        } else {
          this.dataProvider.showToast(this.lang.request_not_deleted);
        }
      })
      .catch(error => {
        this.dataProvider.showToast(error);
      });
  }

  getTeacher(loader = true) {
    let data = {
      class_id: '',
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    if (loader) this.dataProvider.showLoading();

    this.schoolDirectoryApi.getTeachers(data).then(
      res => {
        if (loader) this.dataProvider.hideLoading();
        this.show_loading = true;

        if (res.session) {
          this.selectedTeacher = res.data || [];
          if (this.selectedTeacher.length > 20) {
            this.trimmedTeacher = [...this.selectedTeacher].slice(0, 20);
          } else {
            this.trimmedTeacher = [...this.selectedTeacher];
          }
          this.noTeacher = this.selectedTeacher.length < 1;
        } else {
          this.noTeacher = true;
        }
        this.cdr.markForCheck();
      },
      error => {
        this.noTeacher = true;
        if (loader) this.dataProvider.hideLoading();
        console.log(error);
        this.cdr.markForCheck();
      }
    );
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      if (this.selectedTeacher && this.selectedTeacher.length > 0) {
        this.trimmedTeacher = this.trimmedTeacher.concat(this.selectedTeacher.splice(0, 20));
      }
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 500);
  }

  openEditPage(teacher: any) {
    const navigation: NavigationExtras = {
      state: {
        user: teacher,
        returnPath: 'manage-teacher'
      }
    };
    this.zone.run(() => {
      this.router.navigate(['edit-user-profile'], navigation);
    });
  }

  addTeacher() {
    const navigation: NavigationExtras = {
      state: {
        role: 'teacher',
        returnPath: 'manage-teacher'
      }
    };
    this.zone.run(() => {
      this.router.navigate(['add-user'], navigation);
    });
  }

  // 🟢 2. دالة البحث المحدثة والمحمية بالكامل (Debounce + ngModel)
  filterList() {
    let input = this.searchQuery;

    if (!input || input.trim() === '') {
      this.trimmedTeacher = [...this.selectedTeacher].slice(0, 20);
      this.noTeacher = this.trimmedTeacher.length === 0;
      this.cdr.markForCheck();
      return;
    }

    // تأخير البحث لحماية السيرفر (Debounce)
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      let data = {
        keyword: input.trim(),
        school_id: this.userDetails.details.school_id,
        pageno: 0,
        session_id: this.userDetails.session_id
      };

      this.searchApi
        .searTeacher(data)
        .then((res: any) => {
          if (res && res.data) {
            let teacher = res.data.profile ? res.data.profile : Array.isArray(res.data) ? res.data : [];

            if (teacher && teacher.length > 0) {
              this.trimmedTeacher = teacher.slice(0, 20);
              this.noTeacher = false;
            } else {
              this.trimmedTeacher = [];
              this.noTeacher = true;
            }
          } else {
            this.trimmedTeacher = [];
            this.noTeacher = true;
          }
          this.cdr.markForCheck();
        })
        .catch(err => {
          this.trimmedTeacher = [];
          this.noTeacher = true;
          this.cdr.markForCheck();
        });
    }, 500); // الانتظار نصف ثانية بعد توقف المستخدم عن الطباعة
  }
}
