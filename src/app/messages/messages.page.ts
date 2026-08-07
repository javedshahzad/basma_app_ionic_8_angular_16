import { Component, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { LoaderComponent } from '../components/loader/loader.component';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { NotificationsApiService } from '../service/notifications-api/notifications-api.service';
import { UserType } from '../constants/user-type';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.page.html',
    styleUrls: ['./messages.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, TranslatePipe]
})
export class MessagesPage {
  readonly UserType = UserType;
  private destroyRef = inject(DestroyRef);

  notifications: any = [];
  userType: any;
  userDetails: any = {};
  noRecordFound: string = '';
  lang: any = {};

  imageModal: boolean = false;
  imageUrl: string = '';
  popOver: any;

  // --- متغيرات نافذة الحذف ---
  showDeleteModal: boolean = false;
  notificationToDeleteId: any = null;
  notificationToDeleteIndex: number = -1;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public popoverController: PopoverController,
    public alertCtrl: AlertController,
    private router: Router,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private cdr: ChangeDetectorRef,
    private notificationsApi: NotificationsApiService
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.translate.get('alertmessages').subscribe(res => {
        this.lang = res;
        this.cdr.markForCheck();
      });
    });

    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.changeUser) {
        this.reloadData();
      }
    });
  }


  trackByNotification(index: number, notification: any): any {
    return notification?.ID ?? index;
  }

  // 🟢 1. دالة async للتعامل مع الذاكرة وجلب الرسائل بأمان
  async ionViewWillEnter() {
    await this.presentPopover();

    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;

      let data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id,
        session_id: this.userDetails.session_id
      };

      this.notificationsApi
        .getNotifications(data)
        .then(response => {
          this.dissmissPopOver();
          if (response.session) {
            this.notifications = response.data;
            if (this.notifications.length == 0) {
              this.noRecordFound = this.lang.no_private_msg || 'لا توجد رسائل حالياً.';
            }
          } else {
            this.authProvider.flushLocalStorage();
            this.router.navigate(['login'], { replaceUrl: true });
            this.dataProvider.errorALertMessage(response.message);
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          console.log(error);
          this.dissmissPopOver();
          this.cdr.markForCheck();
        });
    } else {
      this.dissmissPopOver();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  doRefresh(event) {
    this.reloadData();
    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  // 🟢 2. تأمين ظهور واختفاء شاشة التحميل لمنع التجمد (Freeze)
  async presentPopover() {
    if (this.popOver) {
      this.dissmissPopOver();
    }
    this.popOver = await this.popoverController.create({
      component: LoaderComponent,
      backdropDismiss: false, // يجب أن يكون false لمنع الإغلاق العشوائي
      translucent: false,
      cssClass: 'loaderStyle'
    });
    return this.popOver.present();
  }

  dissmissPopOver() {
    setTimeout(() => {
      if (this.popOver) {
        this.popOver.dismiss().catch(() => {});
        this.popOver = null;
      }
    }, 400); // تأخير بسيط لضمان اكتمال الأنيميشن
  }

  async reloadData() {
    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;

      let data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id,
        session_id: this.userDetails.session_id
      };

      this.notificationsApi
        .getNotifications(data)
        .then(response => {
          if (response.session) {
            this.notifications = response.data;
            if (this.notifications.length == 0) {
              this.noRecordFound = this.lang.no_private_msg || 'لا توجد رسائل حالياً.';
            }
          } else {
            this.authProvider.flushLocalStorage();
            this.router.navigate(['login'], { replaceUrl: true });
            this.dataProvider.errorALertMessage(response.message);
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          console.log(error);
          this.cdr.markForCheck();
        });
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  openComposer() {
    this.navCtrl.navigateForward('/sendmessage');
  }

  openDeleteModal(id: any, index: number) {
    this.notificationToDeleteId = id;
    this.notificationToDeleteIndex = index;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    setTimeout(() => {
      this.notificationToDeleteId = null;
      this.notificationToDeleteIndex = -1;
      this.cdr.markForCheck();
    }, 300);
  }

  confirmDelete() {
    if (this.notificationToDeleteId == null) return;

    this.presentPopover();
    let data = {
      user_no: this.userDetails.details.user_no,
      nid: this.notificationToDeleteId,
      session_id: this.userDetails.session_id
    };

    this.notificationsApi
      .deleteNotification(data)
      .then(response => {
        this.dissmissPopOver();
        if (response.session) {
          this.dataProvider.showToast(response.message);
          this.notifications.splice(this.notificationToDeleteIndex, 1);
          this.closeDeleteModal();
        } else {
          this.authProvider.flushLocalStorage();
          this.dataProvider.errorALertMessage(response.message);
          this.closeDeleteModal();
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.dissmissPopOver();
        this.dataProvider.errorALertMessage(error);
        this.closeDeleteModal();
        this.cdr.markForCheck();
      });
  }

  openImageContainer(url) {
    this.imageUrl = url;
    this.imageModal = true;
  }

  hideUserImageModal(event?: any) {
    this.imageModal = false;
    setTimeout(() => {
      this.imageUrl = '';
      this.cdr.markForCheck();
    }, 300);
  }

  downloadImage(imageUrl) {
    this.presentPopover();
    this.dataProvider
      .downloadImage(imageUrl)
      .then(res => {
        this.dissmissPopOver();
        this.dataProvider.showToast(this.lang.download_complete || 'تم التنزيل بنجاح');
      })
      .catch(error => {
        this.dissmissPopOver();
        this.dataProvider.errorALertMessage(error);
      });
  }
}
