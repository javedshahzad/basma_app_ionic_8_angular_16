import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, Platform, IonicModule } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { BulletinsApiService } from '../service/bulletins-api/bulletins-api.service';
import { SearchApiService } from '../service/search-api/search-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select-bulletins-user',
  templateUrl: './select-bulletins-user.page.html',
  styleUrls: ['./select-bulletins-user.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, TranslatePipe]
})
export class SelectBulletinsUserPage {
  trackByIndex(index: number): number {
    return index;
  }
  private destroyRef = inject(DestroyRef);
  userdata: any;
  lang: any;
  allUsers: any = [];
  users: any = [];
  formData: any = {};
  userDetails: any = {};
  data: any;
  bulletinId: any;
  selectedUsers: any = [];
  type: any;

  // 🟢 متغيرات البحث الجديدة
  searchQuery: string = '';
  searchTimeout: any;
  show_loading: boolean = false;

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    public platform: Platform,
    private storageSr: StorageService, // 🟢 حقن الخدمة
    private bulletinsApi: BulletinsApiService,
    private searchApi: SearchApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {
    // 🟢 التقاط بيانات الـ Router متزامناً لمنع الضياع
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.formData = navigation.extras.state['formdata'];
      this.type = navigation.extras.state['type'];
      this.data = navigation.extras.state['data'];
      this.bulletinId = navigation.extras.state['bulletinId'];
    }

    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
  }

  // 🟢 استخدام async/await لجلب البيانات بأمان
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      // تأمين بيانات الـ Router في حال تحديث الصفحة (Refresh)
      if (this.data || this.bulletinId || this.formData) {
        await this.storageSr.set('bulletinShareContext', {
          data: this.data,
          bulletinId: this.bulletinId,
          type: this.type,
          formData: this.formData
        });
      } else {
        let savedData = await this.storageSr.get('bulletinShareContext');
        if (savedData) {
          this.data = savedData.data;
          this.bulletinId = savedData.bulletinId;
          this.type = savedData.type;
          this.formData = savedData.formData;
        } else {
          this.navCtrl.back();
          return;
        }
      }

      this.getUsers();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getUsers() {
    let data = { school_id: this.userDetails.details.school_id, session_id: this.userDetails.session_id };

    this.show_loading = true;
    this.schoolDirectoryApi
      .getSchoolUsers(data)
      .then(res => {
        this.show_loading = false;
        if (res && res.data) {
          // 🟢 إضافة متغير isChecked لربطه بالـ HTML بأمان لعدم استخدام id
          this.users = res.data.map(u => ({ ...u, isChecked: false }));
          if (this.users.length > 20) {
            this.allUsers = this.users.splice(0, 20);
          } else {
            this.allUsers = this.users;
          }
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.show_loading = false;
        this.dataProvider.showToast(error);
        this.cdr.markForCheck();
      });
  }

  // 🟢 دالة البحث المدرعة بـ Debounce لتخفيف الضغط
  filterList() {
    let input = this.searchQuery;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.show_loading = true;

    this.searchTimeout = setTimeout(() => {
      let data = {
        input: input.trim(),
        school_id: this.userDetails.details.school_id,
        session_id: this.userDetails.session_id
      };

      this.searchApi
        .searchUser(data)
        .then(resp => {
          this.show_loading = false;
          if (resp && resp.data) {
            this.users = resp.data.map(u => {
              // الحفاظ على حالة الاختيار عند البحث الجديد
              let isChecked = this.selectedUsers.includes(u.user_no);
              return { ...u, isChecked: isChecked };
            });

            if (this.users.length > 20) {
              this.allUsers = this.users.splice(0, 20);
            } else {
              this.allUsers = this.users;
            }
          }
          this.cdr.markForCheck();
        })
        .catch(err => {
          this.show_loading = false;
          console.log(err);
          this.cdr.markForCheck();
        });
    }, 500);
  }

  // 🟢 التخلص من الاعتماد على הـ DOM وتحديث الـ Array فقط
  selectUser(user: any, event: any) {
    // إيقاف الانتشار لعدم تفعيل النقر مرتين إذا تم الضغط على السطر بالكامل
    if (event.stopPropagation) event.stopPropagation();

    let isChecked = event.detail.checked;

    if (isChecked) {
      if (user.user_no !== this.userDetails.details.user_no) {
        if (!this.selectedUsers.includes(user.user_no)) {
          this.selectedUsers.push(user.user_no);
        }
      } else {
        this.dataProvider.showToast(this.lang.same_user || 'لا يمكنك إرسال النشرة لنفسك');
        // إلغاء الاختيار برمجياً دون الحاجة لـ document.getElementById
        setTimeout(() => {
          user.isChecked = false;
          this.cdr.markForCheck();
        }, 0);
      }
    } else {
      let index = this.selectedUsers.indexOf(user.user_no);
      if (index > -1) {
        this.selectedUsers.splice(index, 1);
      }
    }
  }

  uplaodBullentin(user: any = null) {
    if (this.bulletinId && this.type !== 'create') {
      if (this.selectedUsers.length === 0) {
        this.dataProvider.showToast('الرجاء اختيار مستخدم واحد على الأقل');
        return;
      }
      this.data.users = this.selectedUsers.join(','); // تحويل المصفوفة لنص مفصول بفواصل حسب المتطلبات الشائعة
      this.dataProvider
        .run(() => this.bulletinsApi.shareBulletins(this.data))
        .then(res => {
          this.dataProvider.showToast(res.message || '');
          this.router.navigate(['bulletins']);
        })
        .catch(err => {
          this.dataProvider.showToast(err.message || 'خطأ غير متوقع');
        });
    } else if (this.type === 'create') {
      if (user && user.user_no !== this.userDetails.details.user_no) {
        this.formData.append('users', user.user_no); // إرسال المستخدم مباشرة
        this.dataProvider.showLoading();
        this.bulletinsApi
          .createBulletins(this.formData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(
            () => {
              this.dataProvider.hideLoading();
              this.dataProvider.showToast('تمت المشاركة بنجاح');
              this.router.navigate(['bulletins']);
            },
            err => {
              this.dataProvider.hideLoading();
              this.dataProvider.showToast(err.message || 'خطأ غير متوقع');
            }
          );
      } else {
        this.dataProvider.showToast(this.lang.same_user || 'لا يمكنك الإرسال لنفسك');
      }
    }
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      if (this.users && this.users.length > 0) {
        this.allUsers = this.allUsers.concat(this.users.splice(0, 20));
      }
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 500);
  }
}
