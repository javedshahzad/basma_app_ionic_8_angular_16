import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { NavController, AlertController, Platform, ModalController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ConnectNewMessagePage } from '../connect-new-message/connect-new-message.page';
import { Subscription } from 'rxjs';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-parentconnect',
  templateUrl: './parentconnect.page.html',
  styleUrls: ['./parentconnect.page.scss'],
})
export class ParentconnectPage implements OnInit, OnDestroy {
  lang: any = {};
  chats: any = [];
  noDataFound: string = '';
  userType: any;
  userDetails: any = {};
  
  imageUrl: string = '';
  imageModal: boolean = false;
  showWarningModal: boolean = false; 
  backHref: string = '/tabs/classlist'; 
  
  // 🟢 التحكم بالاشتراكات لتجنب التكرار وتسريب الذاكرة
  private authSubscription: Subscription;
  private isInitialLoadDone = false; 

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public dataProvider: DataService,
    public modalCtrl: ModalController,
    public translate: TranslateService,
    public authProvider: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    public network: Network,
    public platform: Platform,
    private storageSr: StorageService // 🟢 حقن خدمة التخزين
  ) {
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
    });
    this.dataProvider.language.subscribe((resq) => {
      this.translate.get("alertmessages").subscribe((res) => {
        this.lang = res;
      });
    });

    // 🟢 الاشتراك بحدث تبديل المستخدم لتحديث الصفحة (يُفعل فقط إذا لم يكن هذا هو الدخول الأول)
    this.authSubscription = this.authProvider.event.subscribe((res) => {
      if (res && res.changeUser && this.isInitialLoadDone) {
        this.reloadData();
      }
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // 🟢 جلب البيانات عند دخول الصفحة بشكل آمن وسريع
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get("userloggedin"); 
    
    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      
      // 🟢 تحديد مسار العودة الصحيح بناءً على نوع المستخدم
      if (this.userType == '1') {
        this.backHref = '/tabs/classlist'; 
      } else if (this.userType == '8') {
        this.backHref = '/tabs/student-titles'; 
      } else {
        this.backHref = '/tabs/children'; 
      }

      // 🟢 إذا لم تكن البيانات قد جُلبت مسبقاً، نقوم بجلبها الآن
      if (this.chats.length === 0) {
        this.getAllChats(true);
      } else {
         // تحديث صامت في الخلفية بدون Loader مزعج
        this.getAllChats(false);
      }
      this.isInitialLoadDone = true;

    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  async reloadData() {
    // 🟢 هذه الدالة تستخدم فقط عند تبديل الحساب لتحديث المحتوى بهدوء
    let userLoggedIn = await this.storageSr.get("userloggedin");
    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.getAllChats(false); // تحديث صامت
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  getAllChats(showLoader: boolean = true) {
    let data = {
      "user_no": this.userDetails.details.user_no,
      "school_id": this.userDetails.details.school_id,
      "session_id": this.userDetails.session_id,
      "user_type": this.userDetails.details.user_type
    };
    
    if (showLoader) {
      this.dataProvider.showLoading();
    }
    
    this.dataProvider.getConnectChatList(data).then((response: any) => {
      if (showLoader) {
        this.dataProvider.hideLoading();
      }
      if (response.session) {
        if (response.chatList && response.chatList.length > 0) {
          this.chats = response.chatList;
        } else {
          this.chats = []; // تصفير المصفوفة
          this.noDataFound = this.lang.no_connect_msg || 'لا توجد محادثات';
        }
      } else {
        this.dataProvider.errorALertMessage(response.message);
        this.router.navigate(['login'], { replaceUrl: true });
      }
    }).catch(error => {
      if (showLoader) {
        this.dataProvider.hideLoading();
      }
    });
  }

  createChatMessage() {
    let isOffline = false;
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      isOffline = (this.network.type === this.network.Connection.NONE || this.network.type === this.network.Connection.UNKNOWN);
    } else {
      isOffline = !navigator.onLine; 
    }

    if (!isOffline) {
      this.showWarningModal = true;
    } else {
      this.dataProvider.showToast(this.lang?.no_internet || 'لا يوجد اتصال بالإنترنت');
    }
  }

  closeWarningModal() {
    this.showWarningModal = false;
  }

  acceptWarningAndCreate() {
    this.showWarningModal = false;
    setTimeout(() => {
      this.createModal();
    }, 200); 
  }

  async createModal() {
    const modal = await this.modalCtrl.create({
      component: ConnectNewMessagePage,
    });
    await modal.present();
    modal.onDidDismiss().then((refresh) => {
      if (refresh && refresh.data) {
        this.getAllChats(true); // جلب البيانات بعد إضافة رسالة جديدة
      }
    });
  }

  openChat(chat: any) {
    let isOffline = false;
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      isOffline = (this.network.type === this.network.Connection.NONE || this.network.type === this.network.Connection.UNKNOWN);
    } else {
      isOffline = !navigator.onLine; 
    }

    if (!isOffline) {
      const navigation: NavigationExtras = {
        state: chat
      };
      this.zone.run(() => {
        this.router.navigate(['connect-chat'], navigation);
      });
    } else {
      this.dataProvider.showToast(this.lang?.no_internet || 'لا يوجد اتصال بالإنترنت');
    }
  }

  async closeTicket(chat: any) {
    const alert = await this.alertCtrl.create({
      header: this.lang.alert || 'تنبيه',
      message: this.lang.want_to_close || 'هل أنت متأكد من إغلاق التذكرة؟',
      mode: 'ios',
      buttons: [
        { text: this.lang.no || 'إلغاء', role: 'cancel' },
        {
          text: this.lang.yes || 'تأكيد',
          cssClass: 'text-emerald-600 font-bold',
          handler: () => {
            let data = {
              user_no: this.userDetails.details.user_no,
              chat_list_id: chat.id,
              session_id: this.userDetails.session_id
            };
            this.dataProvider.showLoading();
            this.dataProvider.closeParentConnectChat(data).then((response: any) => {
              this.dataProvider.hideLoading();
              if (response.session) {
                chat.ticket_status = '1';
                this.dataProvider.showToast(response.message);
              } else {
                this.dataProvider.errorALertMessage(response.message);
              }
            }).catch(error => {
              this.dataProvider.hideLoading();
              this.dataProvider.errorALertMessage(error);
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async reopenTicket(chat: any) {
    const alert = await this.alertCtrl.create({
      header: this.lang.alert || 'تنبيه',
      message: this.lang.want_to_reopen || 'هل تود إعادة فتح التذكرة؟',
      mode: 'ios',
      buttons: [
        { text: this.lang.no || 'إلغاء', role: 'cancel' },
        {
          text: this.lang.yes || 'تأكيد',
          cssClass: 'text-indigo-600 font-bold',
          handler: () => {
            let data = {
              user_no: this.userDetails.details.user_no,
              chat_list_id: chat.id,
              session_id: this.userDetails.session_id
            };
            this.dataProvider.showLoading();
            this.dataProvider.reopenParentConnectChat(data).then((response: any) => {
              this.dataProvider.hideLoading();
              if (response.session) {
                chat.ticket_status = '0';
                this.dataProvider.showToast(response.message);
              } else {
                this.dataProvider.errorALertMessage(response.message);
              }
            }).catch(error => {
              this.dataProvider.hideLoading();
              this.dataProvider.errorALertMessage(error);
            });
          }
        }
      ]
    });
    await alert.present();
  }

  openImageContainer(url: string) {
    this.imageUrl = url;
    this.imageModal = true;
  }

  closeImageModal() {
    this.imageModal = false;
    setTimeout(() => {
      this.imageUrl = '';
    }, 300);
  }

  downloadImage(imageUrl: string) {
    this.dataProvider.showLoading();
    this.dataProvider.downloadImage(imageUrl).then((res) => {
      this.dataProvider.hideLoading();
      this.dataProvider.showToast(this.lang.download_complete || 'تم التنزيل بنجاح');
    }).catch((error) => {
      this.dataProvider.hideLoading();
      this.dataProvider.errorALertMessage(error);
    });
  }
}