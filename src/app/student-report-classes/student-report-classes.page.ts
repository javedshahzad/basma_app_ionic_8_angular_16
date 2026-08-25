import { Component, OnInit, NgZone, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { DatabaseService } from '../service/database/database.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { CreateClassPage } from '../create-class/create-class.page';
import { PopoverController } from '@ionic/angular';
import { LoaderComponent } from '../components/loader/loader.component';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { CoursesApiService } from '../service/courses-api/courses-api.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-student-report-classes',
    templateUrl: './student-report-classes.page.html',
    styleUrls: ['./student-report-classes.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, TranslatePipe]
})
export class StudentReportClassesPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  classes: any = [];
  noDataFound: string = '';
  userType: any;
  editMode: boolean = false;
  lang: any = {};
  userDetails: any = {};
  category: any;
  classBackgroundColor = [
    '#ff7043',
    '#2962ff',
    '#43a047',
    '#6d4c41',
    '#ffab00',
    '#00b0ff',
    '#651fff',
    '#2962ff',
    '#d81b60',
    '#6a1b9a'
  ];
  dashBoard: any;
  popOver: any;
  canPresentPopover = false;
  isLoading: boolean = true; // 🟢 إضافة متغير حالة التحميل الوهمي

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    public popoverController: PopoverController,
    public zone: NgZone,
    private router: Router,
    public modalCtrl: ModalController,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private cdr: ChangeDetectorRef,
    private coursesApi: CoursesApiService
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  async presentPopover() {
    this.popOver = await this.popoverController.create({
      component: LoaderComponent,
      backdropDismiss: true,
      translucent: false,
      cssClass: 'loaderStyle'
    });
    return this.popOver.present();
  }

  // 🟢 3. تأمين مسح نافذة التحميل لمنع خطأ التجميد
  dissmissPopOver() {
    setTimeout(() => {
      if (this.popOver) {
        this.popOver.dismiss().catch(() => {});
        this.popOver = null;
      }
    }, 500);
  }

  doRefresh(event: any) {
    this.refresh(false);
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  ngOnInit() {
    this.refresh();
  }

  // 🟢 4. جعل الدالة async لاستخدام التخزين الآمن بدلاً من localStorage
  async refresh(loader: boolean = true) {
    if (loader) this.isLoading = true;

    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.getCourse(loader);
    } else {
      this.isLoading = false;
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getCourse(loader: boolean = true) {
    if (loader) {
      this.isLoading = true;
      this.presentPopover();
    }

    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    this.coursesApi
      .getCourses(data)
      .then(response => {
        if (loader) {
          this.dissmissPopOver();
          this.isLoading = false; // 👈 إخفاء التحميل الوهمي عند وصول البيانات
        }

        if (response.session) {
          let courses = response.data;
          if (courses && courses.length > 0) {
            let i = 0;
            this.classes = courses;
            this.classes.forEach((course: any) => {
              course.backgroundColor = this.classBackgroundColor[i];
              i++;
              if (i == 9) i = 0;
            });
          } else {
            this.noDataFound = this.lang.no_class_found;
          }
        } else {
          this.authProvider.flushLocalStorage();
          this.router.navigate(['login'], { replaceUrl: true });
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        if (loader) {
          this.dissmissPopOver();
          this.isLoading = false;
        }
        this.cdr.markForCheck();
      });
  }

  openClassStudents(course: any) {
    const navigation: NavigationExtras = {
      state: { course: course }
    };
    this.zone.run(() => {
      this.router.navigate(['student-report-list'], navigation);
    });
  }
}
