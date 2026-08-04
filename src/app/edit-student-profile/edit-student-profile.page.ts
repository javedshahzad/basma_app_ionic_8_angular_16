import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { PopoverController, AlertController, NavController, Platform, MenuController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DatabaseService } from '../service/database/database.service';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { DataService } from './../service/data/data.service';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';

@Component({
  selector: 'app-edit-student-profile',
  templateUrl: './edit-student-profile.page.html',
  styleUrls: ['./edit-student-profile.page.scss'],
})
export class EditStudentProfilePage implements OnInit {
  trackByIndex(index: number): number { return index; }
	student: any = {};
	classes: any[] = [];
	loggedinUser: any;
	userDetails: any = { details: {} }; // 🟢 تهيئة آمنة لحماية الـ HTML
	currentUser: any;
	studentName: any = ''; 
	studentSemester: any = '';
	navData: any;
  student_id: any = '';
  lang: any;
  currentUserEmail: any;
  showDeleteModal: boolean = false;

  isDataReady: boolean = false; // 🟢 متغير جديد للتحكم بظهور القائمة

  constructor(
      public popoverController: PopoverController,
      public navCtrl: NavController, 
      public device: Device, 
      public authProvider: AuthService,
      public platform: Platform, 
      private alertCtrl: AlertController,
      public translate: TranslateService, 
      private dataProvider: DataService,
      private route: ActivatedRoute,
      public zone: NgZone,
      private router: Router,
      public menuCtrl: MenuController,
      public dbProvider: DatabaseService,
      private storageSr: StorageService,
      private cdr: ChangeDetectorRef,
      private userManagementApi: UserManagementApiService
  ) {
    this.translate.get("alertmessages").subscribe((val) => {
      this.lang = val;
    });

    // 🟢 3. صيد البيانات المرسلة فوراً في المشيد لحمايتها من الضياع
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state;
      this.storageSr.set('editStudentProfileContext', this.navData);
    }
  }

  ngOnInit() {}

  // 🟢 4. دورة حياة الصفحة الآمنة والمتسلسلة (تمنع الاستباق)
  async ionViewWillEnter() {
    this.menuCtrl.swipeGesture(false);
    this.isDataReady = false; // 🟢 نخفي القائمة في البداية
    this.dataProvider.showLoading();

    if (!this.navData) {
      this.navData = await this.storageSr.get('editStudentProfileContext');
    }

    let userLoggedIn = await this.storageSr.get("userloggedin");
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      // نجلب الصفوف أولاً
      await this.getClasses(); 
      // ثم نجلب بيانات الطالب ونحدد صفه
      await this.getStudentProfile();
    }
    
    // 🟢 السحر هنا: بعد أن جهزت كل البيانات، نسمح للقائمة بالظهور!
    this.isDataReady = true; 
    this.dataProvider.hideLoading();
  }

  ionViewWillLeave() {
    this.menuCtrl.swipeGesture(true);
  }

  closeModal() {
  	this.popoverController.dismiss();
  }

  getClasses() {
    return new Promise((resolve) => {
      let data = {
        "user_no": this.userDetails.details.user_no,
        "school_id": this.userDetails.details.school_id,
        "session_id": this.userDetails.session_id
      };

      this.dataProvider.getCourses(data).then((response: any) => {
        if (response && response.session) {
          this.classes = response.data.map(c => {
            // نضمن أن جميع المعرفات مخزنة كنصوص للمطابقة السهلة
            return { ...c, cid: String(c.cid || c.course_id || c.id) };
          });
        }
        resolve(true);
      }).catch(() => resolve(false));
    });
  }

  getStudentProfile() {
    return new Promise((resolve) => {
      let data = {
        "user_no": this.userDetails.details.user_no,
        "session_id": this.userDetails.session_id,
        "cid": this.navData?.course_id || this.navData?.student?.cid || '',
        "date": this.navData?.dateSelected || this.dataProvider.getFormatedDate(new Date()),
        "sid": this.navData?.student?.sid 
      };

      this.dataProvider.getStudentDetails(data).then((response: any) => {
        if (response && response.session) {
          this.student = response.data;
          this.studentName = this.student.name;
          this.student_id = this.student.student_id;

          console.log("----------------- بدء عملية المطابقة -----------------");
          console.log("1️⃣ بيانات navData كاملة:", this.navData);
          console.log("2️⃣ اسم الصف في navData هو:", this.navData?.student?.class_name);
          
          let rawId = this.student.cid || this.student.course_id;

          if (!rawId || rawId === 'undefined' || rawId === '') {
            rawId = this.navData?.course_id || this.navData?.student?.cid || this.navData?.student?.class_id;
          }

          if (!rawId || rawId === 'undefined' || rawId === '') {
            let targetName = (this.navData?.course_name || this.navData?.student?.class_name || this.student?.course_name || '').toString().trim();
            console.log("3️⃣ الاسم الذي يبحث عنه الكود (targetName):", targetName ? `'${targetName}'` : 'فارغ!');
            console.log("4️⃣ أسماء الصفوف المتاحة للبحث:", this.classes.map(c => `'${c.name}'`));
            
            if (targetName) {
              let matched = this.classes.find(c => c.name.toString().trim() === targetName);
              if (matched) {
                rawId = matched.cid;
                console.log("✅ نجحت المطابقة عبر الاسم! المعرف هو:", rawId);
              } else {
                console.log("❌ لم يتطابق الاسم مع أي صف في القائمة!");
              }
            }
          }

          if (rawId) {
            this.studentSemester = String(rawId);
            setTimeout(() => { this.cdr.detectChanges(); }, 200);
          } else {
            console.error("❌ فشل العثور على أي رقم أو اسم للصف في جميع المحطات!");
          }
          console.log("----------------- انتهاء عملية المطابقة -----------------");
        }
        resolve(true);
      }).catch(() => resolve(false));
    });
  }

  async saveChanges() {
    let updateData = {
      sid: this.student.sid,
      cid: this.studentSemester,       // 🟢 إرسال قيمة القائمة المنسدلة الجديدة
      class_id: this.studentSemester,  // 🟢 التأكيد على إرسالها بكلا المسميين
      student_name: this.studentName,
      student_id: this.student_id,
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    try {
      const res: any = await this.dataProvider.run(() => this.userManagementApi.updateStudentProfile(updateData));
      if (!res.response) {
        this.dataProvider.errorALertMessage(res.msg);
      } else {
        this.dataProvider.showToast(this.lang.edit_student_success_msg);
        const navigation: NavigationExtras = {
          state: { isUpdated: true }
        };
        this.zone.run(() => {
          this.router.navigate(['manage-student'], navigation);
        });
      }
    } catch (error: any) {
      this.dataProvider.errorALertMessage(error?.message || this.lang.usnexpectedError);
    }
  }

  deleteStudent() {
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }

  async confirmDelete() {
    this.showDeleteModal = false;
    let deleteData = {
      sid: this.student.sid,
      cid: this.student.cid,
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    try {
      const res: any = await this.dataProvider.run(() => this.userManagementApi.deleteStudent(deleteData));
      this.dataProvider.showToast(res.msg);
      const navigation: NavigationExtras = {
        state: { isUpdated: true }
      };
      this.zone.run(() => {
        this.router.navigate(['manage-student'], navigation);
      });
    } catch (error: any) {
      this.dataProvider.errorALertMessage(error?.message || this.lang.usnexpectedError);
    }
  }

  async deleteClass() {
  	let deleteData = {
      sid: this.student.sid,
      cid: this.student.cid,
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    try {
      const res: any = await this.dataProvider.run(() => this.userManagementApi.deleteStudentClass(deleteData));
      this.dataProvider.showToast(res.msg);
      this.router.navigate(['manage-student']);
    } catch (error: any) {
      this.dataProvider.errorALertMessage(error?.message || this.lang.usnexpectedError);
    }
  }

  // 🟢 دالة ذكية لمقارنة القيم بغض النظر عما إذا كانت نصاً أم رقماً
  compareClasses(o1: any, o2: any) {
  if (o1 == null || o2 == null) return o1 === o2;
  return String(o1) === String(o2);
}
}