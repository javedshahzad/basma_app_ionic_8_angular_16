import { Component, OnInit, NgZone, ViewChild, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController, ItemReorderEventDetail, Platform, ActionSheetController, PopoverController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { DatabaseService } from '../service/database/database.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { CreateClassPage } from '../create-class/create-class.page';
import { LoaderComponent } from '../components/loader/loader.component';
import { IonReorderGroup } from '@ionic/angular';

// 🟢 استبدال moment بـ dayjs واستدعاء إضافة الفترات الزمنية
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

import { ClasslistOptionsPopoverComponent } from '../components/classlist-options-popover/classlist-options-popover.component';
import { EditClassModalComponent } from '../components/edit-class-modal/edit-class-modal.component';
import { StorageService } from '../service/storage.service';
import { SyncService } from '../service/sync/sync.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';
import { UserType } from '../constants/user-type';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-classlist',
    templateUrl: './classlist.page.html',
    styleUrls: ['./classlist.page.scss'],
    imports: [IonicModule, NgIf, NgClass, NgFor, FormsModule, TranslatePipe]
})
export class ClasslistPage implements OnInit {
  readonly UserType = UserType;
  isLoading: boolean = true;
  private destroyRef = inject(DestroyRef);

  @ViewChild(IonReorderGroup) reorderGroup: IonReorderGroup;
  classes: any = [];
  noDataFound: string = '';
  userType: any;
  editMode: boolean = false;
  lang: any = {};
  lang1: any = {};
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
  reorderList: Array<any> = [];
  canReorder: boolean = true;
  showIcon: boolean = false;
  is_school_admin: any;
  deactivate_date: any;

  isPopoverOpen: boolean = false;
  popoverEvent: any;
  editingClass: any = {};

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
    public platform: Platform,
    private storageSr: StorageService,
    private syncService: SyncService,
    private userManagementApi: UserManagementApiService
  ) {
    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.changeUser) {
        this.ngOnInit();
      }
    });
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
    });
    this.translate.get('action_icons').subscribe(res => {
      this.lang1 = res;
    });
    this.category = 'list';
    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(resq => {
      this.translate.get('alertmessages').subscribe(res => {
        this.lang = res;
        this.ngOnInit(false);
      });
    });
  }

  toogleReorder() {
    if (!this.canReorder) {
      this.changeOrder();
    }
    this.canReorder = !this.canReorder;
  }

  doReorder(event: any) {
    this.prepareArray(event.detail.from, event.detail.to);
    const itemMove = this.classes.splice(event.detail.from, 1)[0];
    this.classes.splice(event.detail.to, 0, itemMove);
    event.detail.complete();
  }

  changeOrder() {
    let data = {
      list: this.reorderList,
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id
    };
    if (this.reorderList.length) {
      this.presentPopover();
      this.dataProvider
        .reorderClasses(data)
        .then(res => {
          this.dissmissPopOver();
          this.getCourse(false);
          this.dataProvider.showToast(this.lang.order_updated || 'تم حفظ الترتيب بنجاح');
        })
        .catch(err => {
          console.log(err);
          this.dissmissPopOver();
        });
    }
  }

  prepareArray(startfrom, endTo) {
    if (!this.reorderList.length) {
      this.classes.forEach((res, index) => {
        this.reorderList.push({ cid: res.cid, index: index });
      });
    }
    if (startfrom < endTo) {
      for (var i = startfrom; i <= endTo; i++) {
        this.reorderList[i].index--;
      }
      this.reorderList[startfrom].index = endTo;
    }
    if (startfrom > endTo) {
      for (var i = endTo; i <= startfrom; i++) {
        this.reorderList[i].index++;
      }
      this.reorderList[startfrom].index = endTo;
    }
    this.reorderList.sort(function (a, b) {
      var keyA = a.index,
        keyB = b.index;
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
  }

  toggleReorderGroup() {
    this.reorderGroup.disabled = !this.reorderGroup.disabled;
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

  dissmissPopOver() {
    setTimeout(() => {
      if (this.popOver) {
        this.popOver.dismiss().catch(err => console.log('Popover already dismissed'));
        this.popOver = null;
      }
      this.dataProvider.hideLoading();
    }, 2000);
  }

  doRefresh(event) {
    this.ngOnInit(false);
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  async ngOnInit(loader: boolean = true) {
    this.editMode = false;

    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = String(this.userDetails.details.user_type);
      this.is_school_admin = this.userDetails.details.is_school_admin;

      this.getCourse(loader);

      if (this.userType == UserType.Admin || this.userType == UserType.Moderator || this.userType == UserType.Viewer) {
        this.getTodayDeshboard(false);
      }
    } else {
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  ionViewWillEnter() {
    if (
      this.is_school_admin ||
      this.userType == UserType.Admin ||
      this.userType == UserType.Moderator ||
      this.userType == UserType.Viewer ||
      this.userType == UserType.Teacher
    ) {
      this.checkAndDeleteAccount();
    }
  }

  revertSchoolDeletion() {
    let data = {
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no
    };
    this.dataProvider
      .run(() => this.dataProvider.revertDeletedSchoolSettings(data))
      .then((response: any) => {
        this.dataProvider.errorALertMessage(response.msg);
        this.deactivate_date = '';
        this.dataProvider.deactivate_date = '';
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error.msg);
      });
  }

  segmentChanged(event) {
    if (this.canPresentPopover) {
      this.presentPopover();
      const intervel = setInterval(() => {
        if (!this.canPresentPopover) {
          this.dissmissPopOver();
          clearInterval(intervel);
        }
      }, 500);
    }
  }

  getCourse(loader: boolean = true) {
    if (loader) this.isLoading = true;

    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .getCourses(data)
      .then(response => {
        if (loader) this.isLoading = false;

        if (response.session) {
          this.syncService.syncOffileData();
          let courses = response.data;

          if (response.linkData != undefined) {
            this.authProvider.piblisEvenetActiveLink(response.linkData);
          }

          if (courses && courses.length > 0) {
            let i = 0;
            this.classes = courses;
            this.reorderList = [];
            this.classes.forEach(course => {
              course.backgroundColor = this.classBackgroundColor[i];
              i++;
              if (i == 9) i = 0;
            });
          } else {
            this.noDataFound = this.lang.no_class_found;
            this.classes = [];
            this.reorderList = [];
          }
        } else {
          this.authProvider.flushLocalStorage();
          this.router.navigate(['login'], { replaceUrl: true });
        }
      })
      .catch(error => {
        if (loader) this.isLoading = false;
      });
  }

  getTodayDeshboard(loader: boolean = true) {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .todayDashboard(data)
      .then(response => {
        if (response && response.session) {
          this.dashBoard = response.data.seminar;
        }
      })
      .catch(error => {
        console.error('Dashboard Error:', error);
      });
  }

  async openClassStudents(course: any) {
    if (this.editMode) {
      this.editingClass = JSON.parse(JSON.stringify(course));

      const modal = await this.modalCtrl.create({
        component: EditClassModalComponent,
        componentProps: {
          editingClass: this.editingClass,
          lang1: this.lang1
        },
        breakpoints: [0, 0.45, 0.7],
        initialBreakpoint: 0.45,
        handleBehavior: 'cycle',
        cssClass: 'lineone-bottom-sheet',
        mode: 'ios'
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();

      if (data) {
        if (data.action === 'save') {
          this.editingClass = data.data;
          this.confirmUpdateClass();
        } else if (data.action === 'delete') {
          this.deletClass({ cid: data.cid });
        }
      }
    } else {
      const navigation: NavigationExtras = {
        state: { course: course }
      };
      this.zone.run(() => {
        this.router.navigate(['list-student'], navigation);
      });
    }
  }

  confirmUpdateClass() {
    if (
      this.editingClass.desc &&
      this.editingClass.desc.trim() != '' &&
      this.editingClass.name &&
      this.editingClass.name.trim() != ''
    ) {
      let postData = {
        cid: this.editingClass.cid,
        user_no: this.userDetails.details.user_no,
        session_id: this.userDetails.session_id,
        course: {
          name: this.editingClass.name,
          desc: this.editingClass.desc
        }
      };

      this.dataProvider
        .run(() => this.dataProvider.updateCourseDesc(postData))
        .then(response => {
          if (response.session) {
            this.getCourse(false);
            this.editingClass = {};
            this.dataProvider.showToast('تم تحديث بيانات الصف بنجاح');
          } else {
            this.authProvider.flushLocalStorage();
            this.router.navigate(['login'], { replaceUrl: true });
          }
        })
        .catch(error => {
          this.dataProvider.errorALertMessage(error);
        });
    } else {
      this.dataProvider.showToast(this.lang.can_not_empty);
    }
  }

  openSeminar(seminar) {
    const navigation: NavigationExtras = {
      state: { seminar: seminar }
    };
    this.zone.run(() => {
      this.router.navigate(['seminar-list'], navigation);
    });
  }

  deletClass(course) {
    let data = {
      class_id: course.cid,
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no
    };

    this.dataProvider
      .run(() => this.dataProvider.deleteClass(data))
      .then(res => {
        if (res && (res.session || res.response)) {
          this.dataProvider.showToast(res.data || 'تم حذف الصف بنجاح');
          this.getCourse(false);
        } else {
          this.dataProvider.showToast(res.message || 'فشل في حذف الصف');
        }
      })
      .catch(error => {
        console.error('Delete Error:', error);
        this.dataProvider.errorALertMessage('حدث خطأ في الاتصال بالسيرفر، يرجى المحاولة لاحقاً.');
      });
  }

  openSearchPage() {
    const navigation: NavigationExtras = {
      state: { userDetails: this.userDetails.details }
    };
    this.zone.run(() => {
      this.router.navigate(['search-student'], navigation);
    });
  }

  enableEditMode() {
    this.editMode = !this.editMode;
  }

  async createClass() {
    const modal = await this.modalCtrl.create({
      component: CreateClassPage,
      cssClass: 'my-custom-class',
      componentProps: {
        classes: this.classes
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data === true) {
      this.getCourse();
    }
  }

  async openMenu(event: any) {
    this.translate.get('action_icons').subscribe(res => {
      this.lang1 = res;
    });

    if (this.platform.width() >= 768) {
      const popover = await this.popoverController.create({
        component: ClasslistOptionsPopoverComponent,
        event: event,
        componentProps: {
          userType: this.userType,
          editMode: this.editMode,
          canReorder: this.canReorder,
          lang1: this.lang1
        },
        mode: 'ios',
        cssClass: 'custom-popover'
      });

      await popover.present();

      const { data } = await popover.onDidDismiss();
      this.zone.run(() => {
        if (data && data.selectedAction) {
          this.popoverAction(data.selectedAction);
        }
      });
    } else {
      let buttons = [];
      if (this.userType == UserType.Admin || this.userType == UserType.Moderator || this.userType == UserType.Viewer) {
        buttons.push({
          text: this.lang1.search || 'بحث',
          icon: 'search',
          cssClass: 'text-slate-700 font-bold',
          handler: () => {
            this.openSearchPage();
          }
        });
      }
      if (this.userType == UserType.Admin) {
        buttons.push({
          text: this.lang1.create_class || 'إضافة صف جديد',
          icon: 'add-circle-outline',
          cssClass: 'text-indigo-600 font-bold',
          handler: () => {
            this.createClass();
          }
        });
      }
      if (this.userType == UserType.Admin && !this.editMode) {
        buttons.push({
          text: this.lang1.edit_class || 'تعديل الصف',
          icon: 'pencil-sharp',
          cssClass: 'text-indigo-600 font-bold',
          handler: () => {
            this.enableEditMode();
          }
        });
      }
      if (this.canReorder) {
        buttons.push({
          text: this.lang1.reorder_class || 'إعادة ترتيب الفصول',
          icon: 'swap-vertical-outline',
          cssClass: 'text-slate-700 font-bold',
          handler: () => {
            this.toogleReorder();
          }
        });
      }
      buttons.push({
        text: this.lang1.cancel || 'إلغاء',
        icon: 'close',
        role: 'cancel',
        cssClass: 'text-rose-500 font-bold border-t border-slate-100'
      });

      const actionSheet = await this.actionSheet.create({
        header: 'خيارات',
        cssClass: 'custom-action-sheet',
        buttons: buttons
      });
      await actionSheet.present();
    }
  }

  popoverAction(action: string) {
    this.isPopoverOpen = false;
    if (action === 'edit') this.enableEditMode();
    else if (action === 'create') this.createClass();
    else if (action === 'search') this.openSearchPage();
    else if (action === 'reorder') this.toogleReorder();
  }

  async checkAndDeleteAccount() {
    let data = {
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no
    };
    try {
      const response: any = await this.userManagementApi.deleteSchoolPermanentlyRequest(data);
      // 🟢 الخدمة الأصلية كانت تتجاهل الاستجابة بالكامل عندما response.response غير صحيحة
      if (!response.response) {
        return;
      }

      var responseData = response;
      this.dataProvider.hideLoading();

      if (responseData.success) {
        this.dataProvider.showToast(response.msg);

        let userDetail = await this.storageSr.get('userloggedin');

        if (userDetail) {
          let logoutData = {
            user_no: userDetail.details.user_no,
            session_id: userDetail.session_id
          };
          this.authProvider
            .doLogout(logoutData)
            .then(resp => {
              this.dataProvider.hideLoading();
              this.router.navigate(['login'], { replaceUrl: true });
            })
            .catch(error => {
              this.dataProvider.hideLoading();
            });
        }
      }
      if (!responseData.success) {
        this.deactivate_date = responseData.response.deactivate_date;
        this.dataProvider.deactivate_date = responseData.response.deactivate_date;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // 🟢 استبدال moment بـ dayjs (بطريقة آمنة وصحيحة)
  trackByCourse(index: number, course: any): any {
    return course?.cid ?? index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getDeactivateTime() {
    let myDayjs = dayjs(this.dataProvider.deactivate_date, 'YYYY-MM-DD HH:mm:ss');
    let now = dayjs();

    // الفرق بالميللي ثانية
    var total = myDayjs.diff(now);

    // إضافة 72 ساعة (72 * 60 * 60 * 1000)
    var t = total + 72 * 60 * 60 * 1000;

    var seconds = Math.floor((t / 1000) % 60);
    var minutes = Math.floor((t / 1000 / 60) % 60);
    var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
    var days = Math.floor(t / (1000 * 60 * 60 * 24));

    return {
      total: t,
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds
    };
  }
}
