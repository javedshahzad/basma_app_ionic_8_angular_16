import { Component, NgZone, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, Platform, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { isNetworkConnected } from '../service/network-status';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ConnectNewMessagePage } from '../connect-new-message/connect-new-message.page';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { ParentConnectApiService, ParentConnectChat } from '../service/parent-connect-api/parent-connect-api.service';
import { UserType } from '../constants/user-type';
import { NgClass } from '@angular/common';
import { DateFormatPipe } from '../pipes/date-format/date-format.pipe';
import { HasRoleDirective } from '../directives/has-role.directive';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';

@Component({
  selector: 'app-parentconnect',
  templateUrl: './parentconnect.page.html',
  styleUrls: ['./parentconnect.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, NgClass, DateFormatPipe, TranslatePipe, HasRoleDirective]
})
export class ParentconnectPage {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;
  lang: Record<string, string> = {};
  chats: ParentConnectChat[] = [];
  noDataFound: string = '';
  userType: string;
  userDetails: LoggedInUser = {};

  imageUrl: string = '';
  imageModal: boolean = false;
  showWarningModal: boolean = false;
  backHref: string = '/tabs/classlist';

  private destroyRef = inject(DestroyRef);
  private isInitialLoadDone = false;

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after
  // ionViewWillEnter()/reloadData()'s `if (userLoggedIn && userLoggedIn.
  // details)` guard has already populated it — the non-null assertion
  // documents that invariant once instead of at every access site.
  get userInfo(): UserDetails {
    return this.userDetails.details!;
  }

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
    public platform: Platform,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private parentConnectApi: ParentConnectApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(resq => {
      this.translate.get('alertmessages').subscribe(res => {
        this.lang = res;
        this.cdr.markForCheck();
      });
    });

    // 🟢 الاشتراك بحدث تبديل المستخدم لتحديث الصفحة (يُفعل فقط إذا لم يكن هذا هو الدخول الأول)
    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res && res.changeUser && this.isInitialLoadDone) {
        this.reloadData();
      }
    });
  }

  // 🟢 جلب البيانات عند دخول الصفحة بشكل آمن وسريع
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;
      this.userType = this.userInfo.user_type || '';

      // 🟢 تحديد مسار العودة الصحيح بناءً على نوع المستخدم
      if (this.userType == UserType.Admin) {
        this.backHref = '/tabs/classlist';
      } else if (this.userType == UserType.Student) {
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
    this.cdr.markForCheck();
  }

  async reloadData() {
    // 🟢 هذه الدالة تستخدم فقط عند تبديل الحساب لتحديث المحتوى بهدوء
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;
      this.userType = this.userInfo.user_type || '';
      this.getAllChats(false); // تحديث صامت
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getAllChats(showLoader: boolean = true) {
    let data = {
      user_no: this.userInfo.user_no,
      school_id: this.userInfo.school_id,
      session_id: this.userDetails.session_id,
      user_type: this.userInfo.user_type
    };

    if (showLoader) {
      this.dataProvider.showLoading();
    }

    this.parentConnectApi
      .getConnectChatList(data)
      .then(response => {
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
          this.dataProvider.errorALertMessage(response.message || '');
          this.router.navigate(['login'], { replaceUrl: true });
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        if (showLoader) {
          this.dataProvider.hideLoading();
        }
        this.cdr.markForCheck();
      });
  }

  async createChatMessage() {
    let isOffline = false;
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      isOffline = !(await isNetworkConnected());
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
      component: ConnectNewMessagePage
    });
    await modal.present();
    modal.onDidDismiss().then(refresh => {
      if (refresh && refresh.data) {
        this.getAllChats(true); // جلب البيانات بعد إضافة رسالة جديدة
      }
    });
  }

  async openChat(chat: ParentConnectChat) {
    let isOffline = false;
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      isOffline = !(await isNetworkConnected());
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

  async closeTicket(chat: ParentConnectChat) {
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
              user_no: this.userInfo.user_no!,
              chat_list_id: chat.id!,
              session_id: this.userDetails.session_id!
            };
            this.dataProvider
              .run(() => this.parentConnectApi.closeParentConnectChat(data))
              .then(response => {
                if (response.session) {
                  chat.ticket_status = '1';
                  this.dataProvider.showToast(response.message || '');
                } else {
                  this.dataProvider.errorALertMessage(response.message || '');
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

  async reopenTicket(chat: ParentConnectChat) {
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
              user_no: this.userInfo.user_no!,
              chat_list_id: chat.id!,
              session_id: this.userDetails.session_id!
            };
            this.dataProvider
              .run(() => this.parentConnectApi.reopenParentConnectChat(data))
              .then(response => {
                if (response.session) {
                  chat.ticket_status = '0';
                  this.dataProvider.showToast(response.message || '');
                } else {
                  this.dataProvider.errorALertMessage(response.message || '');
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

  openImageContainer(url: string) {
    this.imageUrl = url;
    this.imageModal = true;
  }

  closeImageModal() {
    this.imageModal = false;
    setTimeout(() => {
      this.imageUrl = '';
      this.cdr.markForCheck();
    }, 300);
  }

  downloadImage(imageUrl: string) {
    this.dataProvider
      .run(() => this.dataProvider.downloadImage(imageUrl))
      .then(res => {
        this.dataProvider.showToast(this.lang.download_complete || 'تم التنزيل بنجاح');
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error);
      });
  }
}
