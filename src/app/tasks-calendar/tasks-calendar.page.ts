import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { LoaderComponent } from '../components/loader/loader.component';
import { ActionSheetController } from '@ionic/angular';
// 🟢 1. استيراد خدمة التخزين الآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-tasks-calendar',
  templateUrl: './tasks-calendar.page.html',
  styleUrls: ['./tasks-calendar.page.scss'],
})
export class TasksCalendarPage implements OnInit {
  classes: any = [];
  selectedClass: any = [];
  noDataFound: string = "";
  userType: any;
  popOver: any;
  lang: any = {};
  lang1: any = {};
  navData: any;
  data: any = [];
  dataAll: any = [];
  userDetails: any = {};
  category: any;
  classBackgroundColor = ["#ff7043", "#2962ff", "#43a047", "#6d4c41", "#ffab00", "#00b0ff", "#651fff", "#2962ff", "#d81b60", "#6a1b9a"];
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
    private storageSr: StorageService // 🟢 2. حقن خدمة التخزين
  ) {
    this.translate.get("sidemenu").subscribe((res) => {
      this.lang = res;
    });
    this.translate.get("alertmessages").subscribe((response) => {
      this.lang1 = response;
    });
  }

  // 🟢 3. جعل الدالة async لاستخدام StorageService الآمن
  async ngOnInit(loader: boolean = true) {
    let userLoggedIn = await this.storageSr.get("userloggedin"); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.getCourse(loader);
    } else {
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  async presentPopover() {
    this.popOver = await this.popoverController.create({
      component: LoaderComponent,
      backdropDismiss: true,
      translucent: false,
      cssClass: 'loaderStyle',
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
      "user_no": this.userDetails.details.user_no,
      "school_id": this.userDetails.details.school_id,
      "session_id": this.userDetails.session_id
    };

    this.dataProvider.getCourses(data).then(response => {
      if (loader) {
        this.dissmissPopOver();
        this.isLoading = false;
      }
      
      if (response.session) {
        this.dataProvider.syncOffileData();
        let courses = response.data;
        
        if (response.linkData != undefined) {
          this.authProvider.piblisEvenetActiveLink(response.linkData);
        }
        
        if (courses && courses.length > 0) {
          let i = 0;
          this.classes = courses;

          this.classes.forEach((course) => {
            course.backgroundColor = this.classBackgroundColor[i];
            i++;
            if (i == 9) i = 0;
          })
        } else {
          this.noDataFound = this.lang.no_class_found;
          this.classes = [];
        }
      } else {
        this.authProvider.flushLocalStorage();
        this.router.navigate(['login'], { replaceUrl: true });
      }
    }).catch(error => {
      if (loader) {
        this.dissmissPopOver();
        this.isLoading = false;
      }
    });
  }

  openCalendar() {
    if (this.selectedClass.length < 1) {
      this.dataProvider.showToast(this.lang1.select_class || 'الرجاء تحديد صف واحد على الأقل');
    } else {
      
      let studentData = {
        "user_no": this.userDetails.details.user_no,
        "session_id": this.userDetails.session_id,
        "course_id": JSON.stringify(this.selectedClass), // 🟢 الإبقاء على JSON للـ API
        "school_id": this.userDetails.details.school_id,
      }
      
      this.dataProvider.showLoading();
      this.dataProvider.getAllClassNotes(studentData).then(res => {
        this.dataProvider.hideLoading();
        
        if (res) {
          // 🟢 5. التوجيه وتمرير البيانات بشكل صحيح
          this.router.navigate(['note-calendar'], { state: { note: res, state: this.selectedClass } });
        }
      }).catch(error => {
        this.dataProvider.hideLoading();
        console.log(error);
      });
    }
  }

  // دالة تحديد الصفوف (تبقى كما هي لأنها تعمل بشكل ممتاز)
  selectUser(course, eve, id) {
    if (eve.detail.checked == true) {
      // التأكد من عدم إضافة نفس الصف مرتين
      let exists = this.selectedClass.find(c => c.cid === course.cid);
      if (!exists) {
        this.selectedClass.push(course);
      }
    } else {
      this.selectedClass.find((inc, ix) => {
        if (inc.cid == course.cid) {
          this.selectedClass.splice(ix, 1);
        }
      });
    }
  }

}