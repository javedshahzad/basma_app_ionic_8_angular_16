import {
  Component,
  OnInit,
  NgZone,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router'; // 🟢 تأكد من إضافة ActivatedRoute هنا
import { StorageService } from '../service/storage.service';
import { RegistrationApiService } from '../service/registration-api/registration-api.service';
import { CoursesApiService } from '../service/courses-api/courses-api.service';
import { UserType } from '../constants/user-type';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-add-user',
    templateUrl: './add-user.page.html',
    styleUrls: ['./add-user.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgClass, FormsModule, NgIf, NgFor, TranslatePipe]
})
export class AddUserPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;
  private destroyRef = inject(DestroyRef);
  userDetails: any;
  usersData: any = {};
  classes: any = [];
  validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  lang: any = {};

  // --- متغيرات التحقق (Validation) ---
  show_save_user_spinner: boolean = false;
  email_validation: boolean = false;
  confirm_password_validation: boolean = false;
  password_validation: boolean = false;
  user_name_validation: boolean = false;
  user_id_required: boolean = false;
  submitted: boolean = false;

  // --- متغيرات النافذة الذكية للفصول ---
  isClassModalOpen: boolean = false;
  classSearchQuery: string = '';
  selectedClasses: any[] = [];
  filteredClasses: any[] = [];
  // Mirrors selectedClasses' ids for O(1) isClassSelected() lookups in the
  // *ngFor row template instead of scanning the array per row per
  // change-detection cycle; kept in sync in toggleSelectedClass() below.
  selectedClassIds = new Set<string | number>();

  // 🟢 المتغير الذي سيحمل مسار العودة (افتراضياً قائمة المستخدمين)
  returnPath: string = 'users-list';

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public alertCtrl: AlertController,
    public zone: NgZone,
    private router: Router,
    private route: ActivatedRoute, // 🟢 تم حقن ActivatedRoute هنا
    public modalController: ModalController,
    private storageSr: StorageService,
    private registrationApi: RegistrationApiService,
    private coursesApi: CoursesApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    // إعدادات افتراضية للمستخدم الجديد
    this.usersData.user_type = '2'; // معلم افتراضياً
    this.usersData.attendence_permit = false; // تعطيل تعديل الغياب افتراضياً

    // 🟢 [التعديل الجوهري]: التقاط التوجيه الذكي لمعرفة من أي صفحة جئنا
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (this.router.getCurrentNavigation()?.extras.state) {
        let state = this.router.getCurrentNavigation().extras.state;

        // 1. التقاط مسار العودة (إذا جئنا من manage-teacher سيتم حفظه هنا)
        if (state['returnPath']) {
          this.returnPath = state['returnPath'];
        }

        // 2. إذا كان المطلوب إضافة معلم، نثبت نوع المستخدم في الواجهة على "معلم"
        if (state['role'] === 'teacher') {
          this.usersData.user_type = '2';
        }
      }
      this.cdr.markForCheck();
    });
  }

  async ngOnInit() {
    const userData = await this.storageSr.get('userloggedin');
    if (userData) {
      this.userDetails = userData;
      this.getCourses();
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  // 🟢 جلب الفصول من السيرفر
  getCourses() {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };
    this.coursesApi
      .getCourses(data)
      .then((response: any) => {
        if (response.session) {
          this.classes = response.data;
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        console.log(error);
        this.cdr.markForCheck();
      });
  }

  // =====================================
  // 🟢 دوال النافذة الذكية لاختيار الفصول
  // =====================================
  openClassModal() {
    this.filteredClasses = [...this.classes];
    this.classSearchQuery = '';
    this.isClassModalOpen = true;
  }

  filterClasses() {
    if (!this.classSearchQuery || this.classSearchQuery.trim() === '') {
      this.filteredClasses = [...this.classes];
    } else {
      const query = this.classSearchQuery.toLowerCase();
      this.filteredClasses = this.classes.filter((c: any) => c.name && c.name.toLowerCase().includes(query));
    }
  }

  isClassSelected(cls: any): boolean {
    let targetId = cls.cid || cls.id;
    return this.selectedClassIds.has(targetId);
  }

  toggleSelectedClass(cls: any) {
    let targetId = cls.cid || cls.id;
    const index = this.selectedClasses.findIndex((c: any) => c.cid === targetId || c.id === targetId);

    if (index > -1) {
      this.selectedClasses.splice(index, 1);
      this.selectedClassIds.delete(targetId);
    } else {
      this.selectedClasses.push(cls);
      this.selectedClassIds.add(targetId);
    }
  }

  getSelectedClassesText(): string {
    if (!this.selectedClasses || this.selectedClasses.length === 0) {
      return this.translate.instant('user_profile.class') || 'اضغط لتحديد الصفوف...';
    }
    if (this.selectedClasses.length === 1) {
      return this.selectedClasses[0].name;
    }
    return `تم تحديد (${this.selectedClasses.length}) صفوف`;
  }

  // =====================================
  // 🟢 إرسال البيانات للسيرفر
  // =====================================
  submit() {
    if (this.validateForm()) {
      // إذا لم يتم إدخال الإيميل، يتم إرساله كنص فارغ
      this.usersData.email_id = this.usersData.email_id || '';

      this.usersData.user_no = this.userDetails.details.user_no;
      this.usersData.school_id = this.userDetails.details.school_id;

      // החماية البرمجية: إرسال مصفوفة فارغة في حالة المدير أو ولي الأمر
      if (this.usersData.user_type === UserType.Admin || this.usersData.user_type === UserType.Parent) {
        this.usersData.class = JSON.stringify([]);
        this.usersData.attendence_permit = false;
        this.usersData.time = '';
      } else {
        this.usersData.class =
          this.selectedClasses.length > 0 ? JSON.stringify(this.selectedClasses) : JSON.stringify([]);
      }

      this.show_save_user_spinner = true;

      this.registrationApi
        .registerNewUser(this.usersData)
        .then(res => {
          this.show_save_user_spinner = false;
          const navigation: NavigationExtras = {
            state: { isUpdated: true }
          };
          this.zone.run(() => {
            // 🟢 [التعديل الجوهري الثاني]: العودة للمسار الديناميكي الذي تم التقاطه بدلاً من الثابت
            this.router.navigate([this.returnPath], navigation);
          });
          this.cdr.markForCheck();
        })
        .catch(e => {
          this.show_save_user_spinner = false;
          this.dataProvider.showToast(e);
          this.cdr.markForCheck();
        });
    }
  }

  // =====================================
  // 🟢 دالة التحقق المعدلة
  // =====================================
  validateForm() {
    let is_validate = true;

    this.email_validation = false;
    this.user_name_validation = false;
    this.password_validation = false;
    this.user_id_required = false;
    this.confirm_password_validation = false;
    this.submitted = true;

    // 1. الإيميل (اختياري)
    if (
      this.usersData.email_id &&
      this.usersData.email_id.trim() !== '' &&
      !this.usersData.email_id.match(this.validRegex)
    ) {
      this.dataProvider.showToast('صيغة البريد الإلكتروني غير صحيحة');
      this.email_validation = true;
      is_validate = false;
    }

    // 2. الاسم (إلزامي)
    if (!this.usersData.first_name || this.usersData.first_name == '') {
      this.dataProvider.showToast(this.lang.usename_required || 'الاسم مطلوب');
      this.user_name_validation = true;
      is_validate = false;
    }

    // 3. اسم المستخدم / User ID (إلزامي)
    if (!this.usersData.username || this.usersData.username == '') {
      this.dataProvider.showToast(this.lang.user_id_required || 'اسم المستخدم مطلوب');
      this.user_id_required = true;
      is_validate = false;
    }

    // 4. كلمة المرور (إلزامي)
    if (!this.usersData.password || this.usersData.password == '') {
      this.dataProvider.showToast('كلمة المرور مطلوبة');
      this.password_validation = true;
      is_validate = false;
    }

    // 5. تأكيد كلمة المرور (إلزامي ومتطابق)
    if (!this.usersData.confirm_password || this.usersData.confirm_password != this.usersData.password) {
      this.dataProvider.showToast('كلمات المرور غير متطابقة');
      this.confirm_password_validation = true;
      is_validate = false;
    }
    return is_validate;
  }
}
