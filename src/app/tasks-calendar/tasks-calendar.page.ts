import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { LoaderComponent } from '../components/loader/loader.component';
import { ActionSheetController } from '@ionic/angular';
// 🟢 1. استيراد خدمة التخزين الآمنة
import { StorageService } from '../service/storage.service';
import { SyncService } from '../service/sync/sync.service';
import { NotesApiService } from '../service/notes-api/notes-api.service';
import { CoursesApiService } from '../service/courses-api/courses-api.service';

@Component({
  selector: 'app-tasks-calendar',
  templateUrl: './tasks-calendar.page.html',
  styleUrls: ['./tasks-calendar.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, TranslatePipe]
})
export class TasksCalendarPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  classes: any = [];
  selectedClass: any = [];
  noDataFound: string = '';
  userType: any;
  popOver: any;
  lang: any = {};
  lang1: any = {};
  navData: any;
  data: any = [];
  dataAll: any = [];
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
  isLoading: boolean = false; // 🟢 إضافة حالة للتحميل

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
    public actionSheet: ActionSheetController,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private syncService: SyncService,
    private notesApi: NotesApiService,
    private coursesApi: CoursesApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('sidemenu').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.translate.get('alertmessages').subscribe(response => {
      this.lang1 = response;
      this.cdr.markForCheck();
    });
  }

  // 🟢 3. جعل الدالة async لاستخدام StorageService الآمن
  async ngOnInit(loader: boolean = true) {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.getCourse(loader);
    } else {
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
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

  // 🟢 4. تأمين إغلاق النافذة لمنع خطأ Double Dismiss
  dissmissPopOver() {
    setTimeout(() => {
      if (this.popOver) {
        this.popOver.dismiss().catch(() => {});
        this.popOver = null;
      }
    }, 500);
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
          this.isLoading = false;
        }

        if (response.session) {
          this.syncService.syncOffileData();
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
            // no_class_found lives in the alertmessages bundle (lang1), not
            // sidemenu (lang) -- reading it off `lang` yielded undefined and
            // left the empty state blank.
            this.noDataFound = this.lang1.no_class_found;
            this.classes = [];
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

  async openCalendar() {
    if (this.selectedClass.length < 1) {
      this.dataProvider.showToast(this.lang1.select_class || 'الرجاء تحديد صف واحد على الأقل');
    } else {
      let studentData = {
        user_no: this.userDetails.details.user_no,
        session_id: this.userDetails.session_id,
        course_id: JSON.stringify(this.selectedClass), // 🟢 الإبقاء على JSON للـ API
        school_id: this.userDetails.details.school_id
      };

      try {
        const res = await this.dataProvider.run(() => this.notesApi.getAllClassNotes(studentData));
        if (res) {
          // 🟢 5. التوجيه وتمرير البيانات بشكل صحيح
          this.router.navigate(['note-calendar'], { state: { note: res, state: this.selectedClass } });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  // دالة تحديد الصفوف (تبقى كما هي لأنها تعمل بشكل ممتاز)
  selectUser(course: any, eve: any, id: any) {
    if (eve.detail.checked == true) {
      // التأكد من عدم إضافة نفس الصف مرتين
      let exists = this.selectedClass.find((c: any) => c.cid === course.cid);
      if (!exists) {
        this.selectedClass.push(course);
      }
    } else {
      this.selectedClass.find((inc: any, ix: any) => {
        if (inc.cid == course.cid) {
          this.selectedClass.splice(ix, 1);
        }
      });
    }
  }
}
