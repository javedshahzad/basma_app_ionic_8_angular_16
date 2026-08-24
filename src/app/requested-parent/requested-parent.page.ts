import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { ParentManagementApiService } from '../service/parent-management-api/parent-management-api.service';
import { SearchApiService } from '../service/search-api/search-api.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';
import { RegistrationApiService } from '../service/registration-api/registration-api.service';
import { UserType } from '../constants/user-type';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { HasRoleDirective } from '../directives/has-role.directive';

@Component({
    selector: 'app-requested-parent',
    templateUrl: './requested-parent.page.html',
    styleUrls: ['./requested-parent.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, RouterLink, NgClass, NgFor, TranslatePipe, HasRoleDirective]
})
export class RequestedParentPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;
  lang: any;
  lang1: any;
  userDetails: any;
  userType: string;
  parentList: any = [];
  noParants = false;
  category = 'parents';
  allParentList: any = [];
  allParentFilter: any = [];
  searchTimeout: any; // 🟢 لحماية السيرفر من ضغط البحث

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
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private parentManagementApi: ParentManagementApiService,
    private searchApi: SearchApiService,
    private userManagementApi: UserManagementApiService,
    private registrationApi: RegistrationApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.translate.get('reg_new_parent').subscribe(res => {
      this.lang1 = res;
      this.cdr.markForCheck();
    });

    // 🟢 3. التقاط إشارة التحديث بشكل متزامن
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      let isUpdated = navigation.extras.state['isUpdated'];
      if (isUpdated) {
        this.refreshData(); // دالة مساعدة لتحديث البيانات بأمان
      }
    }
  }

  // 🟢 4. جعل الدالة async للتعامل مع الذاكرة بشكل آمن
  async ngOnInit() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;

      this.getRequestedParentList();
      this.getAllParents();
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  // دالة مساعدة لتحديث البيانات بعد تعديلات من صفحات أخرى
  async refreshData() {
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.getRequestedParentList();
      this.getAllParents();
    }
    this.cdr.markForCheck();
  }

  getRequestedParentList() {
    let data = { school_id: this.userDetails.details.school_id };

    this.parentManagementApi.getRequestedParents(data).then(
      res => {
        if (res.data && res.data.length > 0) {
          // 🟢 تهيئة الخاصية isChecked لتنظيم الـ Toggle دون الاعتماد على getElementById
          this.parentList = res.data.map(parent => ({ ...parent, isChecked: false }));
          this.noParants = false;
        } else {
          this.parentList = [];
          this.noParants = true;
        }
        this.cdr.markForCheck();
      },
      error => {
        console.log(error);
      }
    );
  }

  getAllParents() {
    let data = { school_id: this.userDetails.details.school_id };

    this.parentManagementApi.getAllParents(data).then(
      res => {
        if (res.data && res.data.length > 0) {
          this.allParentList = res.data;
          if (this.allParentList.length > 1) {
            this.allParentFilter = this.allParentList.splice(0, 20);
          } else {
            this.allParentFilter = this.allParentList;
          }
          this.noParants = false;
        } else {
          this.allParentList = [];
          this.allParentFilter = [];
          this.noParants = true;
        }
        this.cdr.markForCheck();
      },
      error => {
        console.log(error);
      }
    );
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      if (this.allParentList && this.allParentList.length > 0) {
        this.allParentFilter = this.allParentFilter.concat(this.allParentList.splice(0, 20));
      }
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 500);
  }

  toggleAccessMode(list) {
    list.access_mode = list.access_mode == '1' ? '0' : '1';
  }

  // 🟢 5. قبول الطلب بالاعتماد على الـ Model وليس الـ DOM
  acceptRequest(list) {
    let is_permitted = list.isChecked ? true : false;
    let data = {
      user_no: list.user_no,
      is_permitted: is_permitted,
      school_id: this.userDetails.details.school_id
    };

    this.dataProvider
      .run(() => this.parentManagementApi.acceptRequestedParents(data))
      .then(
        res => {
          if (res.session) {
            this.getRequestedParentList();
            this.dataProvider.showToast(this.lang.request_accepted);
          } else {
            this.dataProvider.showToast(this.lang.request_not_accepted);
          }
        },
        error => {
          this.dataProvider.showToast(error);
        }
      );
  }

  changeStatus(list) {
    let is_permitted = list.access_mode == '1' ? 1 : 2;
    let data = {
      user_no: list.user_no,
      is_permitted: is_permitted,
      school_id: this.userDetails.details.school_id
    };

    this.dataProvider
      .run(() => this.parentManagementApi.changeParentStatus(data))
      .then(
        res => {
          if (res.session) {
            this.dataProvider.showToast('تم حفظ التعديلات لولي الأمر بنجاح');
          } else {
            this.dataProvider.showToast(res.msg || 'حدث خطأ أثناء حفظ التعديلات');
          }
        },
        error => {
          this.dataProvider.showToast('حدث خطأ في الاتصال بالسيرفر');
        }
      );
  }

  deleteRequest(list) {
    let data = {
      user_no: list.user_no,
      school_id: this.userDetails.details.school_id
    };

    this.dataProvider
      .run(() => this.parentManagementApi.deleteRequestedParents(data))
      .then(
        res => {
          if (res.session) {
            this.getRequestedParentList();
            this.dataProvider.showToast(this.lang.request_deleted);
          } else {
            this.dataProvider.showToast(this.lang.request_not_deleted);
          }
        },
        error => {
          this.dataProvider.showToast(error);
        }
      );
  }

  async deleteParent(list) {
    const alert = await this.alertCtrl.create({
      header: this.lang.delete_parent || 'تأكيد الحذف',
      backdropDismiss: true,
      mode: 'ios',
      buttons: [
        {
          text: this.lang.alert_btn_cancel_text || 'إلغاء',
          role: 'cancel'
        },
        {
          text: this.lang.delete || 'حذف',
          cssClass: 'text-rose-600 font-bold',
          handler: () => {
            let deleteData = {
              parent_user_no: list.user_no,
              user_no: this.userDetails.details.user_no,
              school_id: this.userDetails.details.school_id,
              session_id: this.userDetails.session_id
            };
            this.dataProvider
              .run(() => this.userManagementApi.deleteParent(deleteData))
              .then((res: any) => {
                this.dataProvider.showToast(res.msg);
                this.getAllParents();
                this.dataProvider.showToast('تم الحذف بنجاح');
              })
              .catch(error => {
                console.log(error);
              });
          }
        }
      ]
    });
    await alert.present();
  }

  // 🟢 6. استخدام الـ Debounce في البحث لتخفيف الضغط
  filterList(event: any) {
    let input = event.target.value;

    if (!input || input.trim() === '') {
      this.getAllParents();
      return;
    }

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      let data = {
        school_id: this.userDetails.details.school_id,
        search_str: input.trim()
      };

      this.searchApi
        .serachParent(data)
        .then(res => {
          if (res && res.data) {
            this.allParentList = res.data;
            if (this.allParentList.length > 1) {
              this.allParentFilter = this.allParentList.splice(0, 20);
            } else {
              this.allParentFilter = this.allParentList;
            }
            this.noParants = false;
          } else {
            this.allParentList = [];
            this.allParentFilter = [];
            this.noParants = true;
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.showToast(error);
          this.cdr.markForCheck();
        });
    }, 500);
  }

  async presentAlert() {
    const alert = await this.alertCtrl.create({
      header: this.lang1.pagetitle,
      inputs: [
        { name: 'parentName', type: 'text', placeholder: this.lang1.parentname },
        { name: 'email', type: 'email', placeholder: this.lang1.email },
        { name: 'parentId', type: 'number', placeholder: this.lang1.parentid },
        { name: 'password', type: 'password', placeholder: this.lang1.password },
        { name: 'c_pass', type: 'password', placeholder: this.lang1.c_pass },
        { name: 'address', type: 'text', placeholder: this.lang1.address },
        { name: 'personalNote', type: 'text', placeholder: this.lang1.personal_note }
      ],
      buttons: [
        { text: 'cancel', role: 'cancel' },
        {
          text: this.lang1.reg_btn,
          handler: data => {
            if (this.parentDataValidate(data) == false) {
              return false;
            } else {
              data.parentId = parseInt(data.parentId);
              if (Number.isInteger(data.parentId)) {
                data.user_no = this.userDetails.details.user_no;
                data.school_id = this.userDetails.details.school_id;
                this.dataProvider
                  .run(() => this.registrationApi.registerNewParent(data))
                  .then(res => {
                    this.dataProvider.showToast(res);
                  })
                  .catch(err => {
                    this.dataProvider.errorALertMessage(err);
                  });
              } else {
                this.dataProvider.showToast(this.lang.user_id_required);
                return false;
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  parentDataValidate(data) {
    let isValid = true;
    var pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
    if (data.parentName == '' || data.parentName.trim() == '') {
      isValid = false;
      this.dataProvider.showToast(this.lang.usename_required);
    }
    if (data.parentId == '' || data.parentId == 0) {
      isValid = false;
      this.dataProvider.showToast(this.lang.user_id_required);
    }
    if (data.email.length > 0 && !data.email.match(pattern)) {
      isValid = false;
      this.dataProvider.showToast(this.lang.email_valid);
    }
    if (data.password == '') {
      isValid = false;
      this.dataProvider.showToast(this.lang.password_required);
    }
    if (data.c_pass != data.password) {
      isValid = false;
      this.dataProvider.showToast(this.lang.confirm_password_required);
    }
    return isValid;
  }
}
