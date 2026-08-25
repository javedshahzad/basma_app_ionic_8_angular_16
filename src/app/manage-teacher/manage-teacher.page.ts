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
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-manage-teacher',
    templateUrl: './manage-teacher.page.html',
    styleUrls: ['./manage-teacher.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, FormsModule, NgFor, TranslatePipe]
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
    }
    this.cdr.markForCheck();
  }

  getTeacher(loader = true) {
    let data = {
      class_id: '',
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no
    };

    if (loader) this.dataProvider.showLoading();

    this.schoolDirectoryApi.getTeachers(data).then(
      res => {
        if (loader) this.dataProvider.hideLoading();
        this.show_loading = true;

        if (res.session) {
          this.selectedTeacher = res.data;
          if (this.selectedTeacher.length > 20) {
            this.trimmedTeacher = [...this.selectedTeacher].slice(0, 20);
          } else {
            this.trimmedTeacher = [...this.selectedTeacher];
          }
          this.noTeacher = res.data.length < 1;
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
        pageno: 0
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
