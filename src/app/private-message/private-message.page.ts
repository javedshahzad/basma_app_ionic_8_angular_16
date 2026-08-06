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
import { NavController, AlertController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-private-message',
  templateUrl: './private-message.page.html',
  styleUrls: ['./private-message.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class PrivateMessagePage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  private destroyRef = inject(DestroyRef);
  notifications: any = [];
  noRecordFound: string = '';
  lang: any = {};
  userDetails: any = {};

  // 🟢 متغيرات عارض الصور الحديث
  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  constructor(
    public navCtrl: NavController,
    public authProvider: AuthService,
    public dataProvider: DataService,
    public translate: TranslateService,
    private router: Router,
    public zone: NgZone,
    public alertCtrl: AlertController,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.changeUser) {
        this.reloadData();
      }
    });
  }

  ngOnInit() {}

  // 🟢 جعل الدالة async للتعامل الآمن مع الذاكرة
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      let data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id,
        session_id: this.userDetails.session_id
      };

      this.dataProvider
        .run(() => this.dataProvider.getNotifications(data))
        .then(response => {
          if (response.session) {
            this.dataProvider.private_message = false;
            this.notifications = response.data;
            if (this.notifications.length == 0) {
              this.noRecordFound = this.lang.no_private_msg || 'لا توجد رسائل خاصة';
            }
          } else {
            this.authProvider.flushLocalStorage();
            this.dataProvider.errorALertMessage(response.message);
            this.router.navigate(['login'], { replaceUrl: true });
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.cdr.markForCheck();
        });
    } else {
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  doRefresh(event) {
    this.reloadData();
    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  async reloadData() {
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      let data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id,
        session_id: this.userDetails.session_id
      };

      this.dataProvider
        .getNotifications(data)
        .then(response => {
          if (response.session) {
            this.notifications = response.data;
            if (this.notifications.length == 0) {
              this.noRecordFound = this.lang.no_private_msg || 'لا توجد رسائل خاصة';
            }
          } else {
            this.authProvider.flushLocalStorage();
            this.dataProvider.errorALertMessage(response.message);
            this.router.navigate(['login'], { replaceUrl: true });
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.cdr.markForCheck();
        });
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  async deleteNotification(notificationId, index) {
    const alert = await this.alertCtrl.create({
      message: this.lang.want_to_delete || 'هل أنت متأكد من الحذف؟',
      backdropDismiss: false,
      mode: 'ios',
      buttons: [
        { text: this.lang.no || 'إلغاء', role: 'cancel' },
        {
          text: this.lang.yes || 'نعم، احذف',
          cssClass: 'text-rose-500 font-bold',
          handler: () => {
            let data = {
              user_no: this.userDetails.details.user_no,
              nid: notificationId,
              session_id: this.userDetails.session_id
            };
            this.dataProvider
              .run(() => this.dataProvider.deleteNotification(data))
              .then(response => {
                if (response.session) {
                  this.dataProvider.showToast(response.message);
                  this.notifications.splice(index, 1);
                } else {
                  this.authProvider.flushLocalStorage();
                  this.dataProvider.errorALertMessage(response.message);
                  this.router.navigate(['login'], { replaceUrl: true });
                }
                this.cdr.markForCheck();
              })
              .catch(error => {
                this.dataProvider.errorALertMessage(error);
                this.cdr.markForCheck();
              });
          }
        }
      ]
    });
    await alert.present();
  }

  // 🟢 دوال عرض الصور المحدثة لتتوافق مع تصميم النظام
  openImageContainer(url) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => {
      this.viewImageUrl = '';
    }, 300);
  }

  downloadImage(imageUrl) {
    this.dataProvider
      .run(() => this.dataProvider.downloadImage(imageUrl))
      .then(res => {
        this.dataProvider.showToast(this.lang.download_complete || 'تم التحميل بنجاح');
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error);
      });
  }
}
