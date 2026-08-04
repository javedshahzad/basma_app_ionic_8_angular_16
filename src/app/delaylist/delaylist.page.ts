import { Component, OnInit, NgZone, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { LoaderComponent } from '../components/loader/loader.component';

// 🟢 استيراد خدمة التخزين الموحدة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-delaylist',
  templateUrl: './delaylist.page.html',
  styleUrls: ['./delaylist.page.scss'],
})
export class DelaylistPage implements OnInit {
  trackByIndex(index: number): number { return index; }
  private destroyRef = inject(DestroyRef);

  classes: any = [];
  noDataFound: string = "";
  userType: any;
  editMode: boolean = false;
  lang: any = {};
  userDetails: any = { details: {} }; // قيمة افتراضية آمنة
  
  // ألوان الفصول الجذابة
  classBackgroundColor = ["#ff7043", "#2962ff", "#43a047", "#6d4c41", "#ffab00", "#00b0ff", "#651fff", "#2962ff", "#d81b60", "#6a1b9a"];
  popOver: any;
  isLoading: boolean = true; // 🟢 للتحكم بشاشة التحميل (Skeleton)

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    private route: ActivatedRoute,
    public popoverController: PopoverController,
    public zone: NgZone,
    private router: Router,
    public alertCtrl: AlertController,
    private storageSr: StorageService // 🟢 حقن خدمة التخزين
  ) {
    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      if (res.changeUser) {
        this.loadClasses();
      }
    });

    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((resq) => {
      this.translate.get("alertmessages").subscribe((res) => {
        this.lang = res;
      });
      this.loadClasses();
    });
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

  dissmissPopOver() {
    setTimeout(() => {
      if (this.popOver) {
        this.popOver.dismiss().catch(() => {});
        this.popOver = null;
      }
    }, 1500);
  }

  ngOnInit() {
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
    });
    this.loadClasses();
  }

  ionViewWillEnter() {
    this.editMode = false;
  }

  // 🟢 دالة مخصصة وآمنة لجلب الفصول
  async loadClasses() {
    this.isLoading = true;
    this.classes = []; // تفريغ القائمة القديمة

    let userLoggedIn = await this.storageSr.get("userloggedin"); 

    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      
      let data = {
        "user_no": this.userDetails.details.user_no,
        "school_id": this.userDetails.details.school_id,
        "session_id": this.userDetails.session_id
      };

      this.dataProvider.getCourses(data).then(response => {
        this.isLoading = false;
        
        if (response.session) {
          let courses = response.data;
          if (courses && courses.length > 0) {
            let i = 0;
            this.classes = courses.map(course => {
              course.backgroundColor = this.classBackgroundColor[i];
              i = (i + 1) % this.classBackgroundColor.length; // تأمين الدوران بين الألوان
              return course;
            });
          } else {
            this.noDataFound = this.lang.no_class_found || "لا توجد فصول متاحة";
          }
        } else {
          this.authProvider.flushLocalStorage();
          this.router.navigate(['login'], { replaceUrl: true });
          this.dataProvider.errorALertMessage(response.message);
        }
      }).catch(error => {
        this.isLoading = false;
        this.noDataFound = "حدث خطأ في الاتصال بالسيرفر";
      });
    } else {
      this.isLoading = false;
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  async openClassStudents(course: any) {
    if (this.editMode) {
      const alert = await this.alertCtrl.create({
        header: this.lang.edit_title || 'تعديل',
        message: this.lang.givecourse || 'تعديل بيانات الفصل',
        backdropDismiss: false,
        inputs: [
          { type: "text", value: course.name, name: "courseName", placeholder: this.lang.enter_value_placeholder },
          { type: "text", value: course.desc, name: "courseDesc", placeholder: this.lang.enter_value_placeholder }
        ],
        buttons: [
          { text: this.lang.alert_btn_cancel_text || 'إلغاء', role: 'cancel' },
          {
            text: this.lang.alert_btn_submit_text || 'حفظ',
            handler: (data) => {
              if (data.courseName?.trim() && data.courseDesc?.trim()) {
                let postData = {
                  cid: course.cid,
                  user_no: this.userDetails.details.user_no,
                  session_id: this.userDetails.session_id,
                  course: { name: data.courseName, desc: data.courseDesc }
                };

                this.dataProvider.updateCourseDesc(postData).then((response: any) => {
                  if (response.session) {
                    course.name = data.courseName;
                    course.desc = data.courseDesc;
                    this.editMode = false;
                  } else {
                    this.authProvider.flushLocalStorage();
                    this.dataProvider.errorALertMessage(response.message);
                  }
                }).catch((error) => {
                  this.dataProvider.errorALertMessage(error);
                });
              } else {
                this.dataProvider.showToast(this.lang.can_not_empty || "لا يمكن ترك الحقول فارغة");
              }
            }
          }
        ]
      });
      await alert.present();
    } else {
      // 🟢 التوجيه الصحيح: العودة إلى صفحة students الأصلية
      const navigation: NavigationExtras = {
        state: { course: course }
      };
      this.zone.run(() => {
        this.router.navigate(['students'], navigation); 
      });
    }
  }

  enableEditMode() {
    this.editMode = !this.editMode;
  }
}