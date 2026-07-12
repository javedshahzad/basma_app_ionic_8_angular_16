import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { LoaderComponent } from '../components/loader/loader.component';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
})
export class MessagesPage implements OnInit {

  notifications: any = [];
  userType: any;
  userDetails: any = {};
  noRecordFound: string = '';
  lang: any = {};
  
  imageModal: boolean = false;
  imageUrl: string = "";
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
    private storageSr: StorageService // 🟢 حقن خدمة التخزين
  ) {
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
    });

    this.dataProvider.language.subscribe(() => {
      this.translate.get("alertmessages").subscribe((res) => {
        this.lang = res;
      });
    });

    this.authProvider.event.subscribe((res) => {
      if (res.changeUser) {
        this.reloadData();
      }
    });
  }

  ngOnInit() {}

  // 🟢 1. دالة async للتعامل مع الذاكرة وجلب الرسائل بأمان
  async ionViewWillEnter() {
    await this.presentPopover();
    
    let userLoggedIn = await this.storageSr.get("userloggedin"); // 👈 القراءة الآمنة
    
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      
      let data = {
        "user_no": this.userDetails.details.user_no,
        "school_id": this.userDetails.details.school_id,
        "session_id": this.userDetails.session_id
      };
      
      this.dataProvider.getNotifications(data).then(response => {
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
      }).catch(error => {
        console.log(error);
        this.dissmissPopOver();
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
    let userLoggedIn = await this.storageSr.get("userloggedin");
    
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      
      let data = {
        "user_no": this.userDetails.details.user_no,
        "school_id": this.userDetails.details.school_id,
        "session_id": this.userDetails.session_id
      };
      
      this.dataProvider.getNotifications(data).then(response => {
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
      }).catch(error => {
        console.log(error);
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
    }, 300);
  }

  confirmDelete() {
    if (this.notificationToDeleteId == null) return;
    
    this.presentPopover();
    let data = {
      user_no: this.userDetails.details.user_no,
      nid: this.notificationToDeleteId,
      session_id: this.userDetails.session_id
    }
    
    this.dataProvider.deleteNotification(data).then((response) => {
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
    }).catch((error) => {
      this.dissmissPopOver();
      this.dataProvider.errorALertMessage(error);
      this.closeDeleteModal();
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
    }, 300);
  }

  downloadImage(imageUrl) {
    this.presentPopover();
    this.dataProvider.downloadImage(imageUrl).then((res) => {
      this.dissmissPopOver();
      this.dataProvider.showToast(this.lang.download_complete || 'تم التنزيل بنجاح');
    }).catch((error) => {
      this.dissmissPopOver();
      this.dataProvider.errorALertMessage(error);
    });
  }
}