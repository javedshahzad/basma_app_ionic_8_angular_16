import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { FollowupFieldsApiService } from '../service/followup-fields-api/followup-fields-api.service';

@Component({
  selector: 'app-followup-add-fields',
  templateUrl: './followup-add-fields.page.html',
  styleUrls: ['./followup-add-fields.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FollowupAddFieldsPage implements OnInit {

  trackByIndex(index: number): number { return index; }
  userDetails: any = {};
  lang: any = {};
  fields: Array<any> = [];
  navData: any;
  show_loading: boolean = false; 

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
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private followupFieldsApi: FollowupFieldsApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get("alertmessages").subscribe((response) => {
      this.lang = response;
      this.cdr.markForCheck();
    });

    // 🟢 1. صيد البيانات فوراً في الـ Constructor (هذا هو الحل الجذري)
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state;
      // حفظها فوراً في الذاكرة تحسباً لتحديث الصفحة
      this.storageSr.set('followUpAddFieldsContext', this.navData);
    }
  }

  ngOnInit() {}

  async ionViewWillEnter() {
    this.show_loading = true;
    this.fields = [];

    // 🟢 2. إذا لم تكن البيانات موجودة (بسبب Refresh)، نستعيدها من الذاكرة الآمنة
    if (!this.navData) {
      this.navData = await this.storageSr.get('followUpAddFieldsContext');
    }

    let userLoggedIn = await this.storageSr.get("userloggedin");
    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;
      
      if (this.navData) {
        this.getFields();
      } else {
        this.show_loading = false;
        console.error("⚠️ لم يتم العثور على بيانات الفصل حتى بعد محاولة الاستعادة.");
      }
    } else {
      this.show_loading = false;
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getFields() {
    // 🔍 استخراج معرّف الفصل بدقة (cid أو course_id)
    const courseId = this.navData?.course?.cid || 
                     this.navData?.course?.course_id || 
                     this.navData?.course_id || 
                     this.navData?.cid || '';

    if (!courseId) {
       this.show_loading = false;
       this.dataProvider.showToast("عفواً، لم يتم التعرف على الفصل.");
       this.cdr.markForCheck();
       return;
    }

    let data = {
      "user_no": this.userDetails.details.user_no,
      "school_id": this.userDetails.details.school_id,
      "session_id": this.userDetails.session_id,
      "course_id": courseId
    };

    // جلب الحقول السابقة من السيرفر
    this.followupFieldsApi.getFollowupFields(data).then((res: any) => {
      this.show_loading = false;
      if (res && res.data) {
        this.fields = res.data;
        // معالجة حالة التبديل (Toggle) لتظهر بشكل صحيح
        this.fields.forEach(f => {
          f.absent_marks = (f.absent_marks == 1 || f.absent_marks == '1' || f.absent_marks === true);
        });
      }
      this.cdr.markForCheck();
    }).catch(error => {
      this.show_loading = false;
      console.error("Error fetching fields:", error);
      this.cdr.markForCheck();
    });
  }

  addExtraFields() {
    this.zone.run(() => {
      this.fields.push({
        field_name: '',
        field_max_marks: '',
        marks_on_present: '',
        absent_marks: true,
        marks_id: 0 
      });
    });
  }

  async removeField(index: number, field: any) {
    if (field.id) {
      const alert = await this.alertCtrl.create({
        header: 'حذف حقل',
        message: 'سيتم حذف هذا الحقل وبياناته نهائياً، هل أنت متأكد؟',
        mode: 'ios',
        buttons: [
          { text: 'إلغاء', role: 'cancel' },
          {
            text: 'حذف',
            cssClass: 'text-rose-500 font-bold',
            handler: () => { this.executeDeleteField(index, field); }
          }
        ]
      });
      await alert.present();
    } else {
      this.fields.splice(index, 1);
    }
  }

  executeDeleteField(index: number, field: any) {
    let data = {
      "user_no": this.userDetails.details.user_no,
      "session_id": this.userDetails.session_id,
      "id": field.id
    };
    
    this.dataProvider.run(() => this.followupFieldsApi.deleteFollowupFields(data)).then((res: any) => {
      this.fields.splice(index, 1);
      this.dataProvider.showToast("تم الحذف بنجاح");
      this.cdr.markForCheck();
    }).catch(() => {});
  }

  submitFields() {
    if (this.checkField()) {
      const courseId = this.navData?.course?.cid ||
                       this.navData?.course?.course_id ||
                       this.navData?.course_id ||
                       this.navData?.cid || '';

      let data = {
        "field": this.fields,
        "user_no": this.userDetails.details.user_no,
        "school_id": this.userDetails.details.school_id,
        "session_id": this.userDetails.session_id,
        "course_id": courseId
      };

      this.dataProvider.run(() => this.followupFieldsApi.saveFollowupFields(data)).then((res: any) => {
        if (res && res.data) {
          this.dataProvider.showToast(this.lang.field_added || 'تم الحفظ بنجاح');
          this.goBackToStudentList();
        }
      }).catch(() => {});
    }
  }

  checkField(): boolean {
    if (this.fields.length === 0) {
      this.dataProvider.showToast('يرجى إضافة حقل واحد على الأقل');
      return false;
    }
    for (let field of this.fields) {
      // تحويل القيم إلى أرقام للسيرفر (1 للصح، 0 للخطأ)
      field.absent_marks = (field.absent_marks === true || field.absent_marks == 1) ? 1 : 0;
      
      if (!field.field_name?.trim()) {
        this.dataProvider.showToast('اسم الحقل مطلوب');
        return false;
      }
      if (!field.field_max_marks) {
        this.dataProvider.showToast('الدرجة العظمى مطلوبة');
        return false;
      }
    }
    return true;
  }

  goBackToStudentList() {
    const navigation: NavigationExtras = {
      state: { update: true, course: this.navData?.course || this.navData }
    };
    this.zone.run(() => {
      this.router.navigate(['followup-student-list'], navigation);
    });
  }
}