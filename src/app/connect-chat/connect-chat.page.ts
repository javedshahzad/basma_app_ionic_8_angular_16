import { Component, NgZone, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, IonContent, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { Location, NgClass } from '@angular/common';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { CameraResultType, Camera, ImageOptions, CameraSource } from '@capacitor/camera';

// 🟢 1. استيراد خدمة التخزين الآمنة
import { StorageService } from '../service/storage.service';
import {
  ParentConnectApiService,
  ParentConnectChat,
  ChatMessage
} from '../service/parent-connect-api/parent-connect-api.service';
import { UserType } from '../constants/user-type';
import { FormsModule } from '@angular/forms';
import { LinkyPipe } from '../pipes/linky.pipe';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';

@Component({
  selector: 'app-connect-chat',
  templateUrl: './connect-chat.page.html',
  styleUrls: ['./connect-chat.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, NgClass, FormsModule, LinkyPipe, TranslatePipe]
})
export class ConnectChatPage implements OnDestroy {
  @ViewChild('contentArea') private contentArea: IonContent; // 🟢 تعريف صحيح للمحتوى

  userDetails: LoggedInUser = { details: {} };
  chat: ParentConnectChat = {};
  message: string = '';
  messages: ChatMessage[] = [];
  // Windowed rendering: `messages` stays the full authoritative history (used
  // for last-id tracking and de-dup checks below), but the template only
  // renders `visibleMessages` — the most recent `visibleMessageCount` — so a
  // long-running conversation doesn't grow the DOM unbounded. "Load older"
  // widens the window; kept as a real field (not a template method call) so
  // it's a stable reference across change-detection cycles.
  visibleMessages: ChatMessage[] = [];
  visibleMessageCount: number = 50;
  lastMessageId: number = 0;
  chatInterval: ReturnType<typeof setInterval>;
  attachment: string = '';
  lang: Record<string, string> = {};
  image: string = '';
  navData: ParentConnectChat;

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after
  // ionViewWillEnter()'s `if (userLoggedIn && userLoggedIn.details)` guard
  // has already populated it — the non-null assertion documents that
  // invariant once instead of at every access site.
  get userInfo(): UserDetails {
    return this.userDetails.details!;
  }

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public alertCtrl: AlertController,
    private _location: Location,
    private photoViewer: PhotoViewer,
    private router: Router,
    private route: ActivatedRoute,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private parentConnectApi: ParentConnectApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });

    // 🟢 3. صيد بيانات المحادثة القادمة من الصفحة السابقة فوراً
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state;
      this.storageSr.set('connectChatContext', this.navData);
    }
  }

  // 🟢 4. دورة الحياة المتزامنة الآمنة
  async ionViewWillEnter() {
    this.messages = []; // تصفير الرسائل لتجنب التكرار
    this.visibleMessageCount = 50;

    // استعادة بيانات المحادثة في حال عمل Refresh
    if (!this.navData) {
      this.navData = await this.storageSr.get('connectChatContext');
    }

    if (this.navData) {
      this.chat = this.navData;
    }

    // جلب بيانات المستخدم بالطريقة الآمنة بدلاً من localStorage
    let userLoggedIn = await this.storageSr.get('userloggedin');

    if (userLoggedIn && userLoggedIn.details) {
      this.userDetails = userLoggedIn;

      if (this.chat && this.chat.id) {
        // إضافة الرسالة الأولى (تذكرة الدعم) للمحادثة
        this.messages.push({
          datetime: this.chat.created,
          message: this.chat.message,
          receiver: this.userInfo.user_type == UserType.Admin ? 'true' : 'false',
          msg_from: this.chat.parent_user_no,
          msg_to: this.chat.school_id,
          attachment_url: this.chat.message_image,
          id: 0
        });
        this.syncVisibleMessages();

        this.getInitialChat();

        // 🟢 تنظيف المؤقت القديم إن وجد، ثم تشغيل الجديد (كل 5 ثوانٍ)
        if (this.chatInterval) clearInterval(this.chatInterval);

        this.chatInterval = setInterval(() => {
          this.getChats(this.lastMessageId);
        }, 5000);
      }
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  // 🟢 5. إيقاف مؤقت الرسائل عند الخروج من الصفحة (لمنع تسريب الذاكرة)
  ionViewWillLeave() {
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
    }
  }

  ngOnDestroy() {
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
    }
  }

  trackByMessage(index: number, message: ChatMessage): string | number {
    return message?.id ?? index;
  }

  private syncVisibleMessages() {
    this.visibleMessages =
      this.messages.length > this.visibleMessageCount ? this.messages.slice(-this.visibleMessageCount) : this.messages;
  }

  loadOlderMessages() {
    this.visibleMessageCount += 50;
    this.syncVisibleMessages();
    this.cdr.markForCheck();
  }

  showPhoto(url: string) {
    this.photoViewer.show(url);
  }

  getInitialChat() {
    let data = {
      user_no: this.userInfo.user_no!,
      school_id: this.userInfo.school_id!,
      user_type: this.userInfo.user_type || '',
      session_id: this.userDetails.session_id!,
      chat_id: this.chat.id!,
      last_msg_id: 0
    };

    this.dataProvider
      .run(() => this.parentConnectApi.getParentConnectChatMessages(data))
      .then(response => {
        if (response.session) {
          let chat = response.chat || [];
          let length = chat.length;
          if (length > 0) {
            chat.forEach(message => {
              this.messages.push(message);
            });
            this.syncVisibleMessages();
            this.lastMessageId = chat[length - 1].id as number;
            this.scrollToBottom();
          }
          this.cdr.markForCheck();
        } else {
          this.dataProvider.errorALertMessage(response.message || '');
          this.router.navigate(['login'], { replaceUrl: true });
        }
      })
      .catch(error => {});
  }

  getChats(lastMessageId: number) {
    let data = {
      user_no: this.userInfo.user_no!,
      school_id: this.userInfo.school_id!,
      user_type: this.userInfo.user_type || '',
      session_id: this.userDetails.session_id!,
      chat_id: this.chat.id!,
      last_msg_id: lastMessageId
    };

    this.parentConnectApi
      .getParentConnectChatMessages(data)
      .then(response => {
        if (response.session) {
          let chat = response.chat || [];
          let length = chat.length;
          if (length > 0) {
            let msgLength = this.messages.length;
            chat.forEach(message => {
              if (msgLength > 0 && (message.id ?? 0) < (this.messages[msgLength - 1].id ?? 0)) {
                this.messages.push(message);
              } else {
                let msg = this.messages.filter(oldMsg => oldMsg.id == message.id);
                if (msg.length == 0) {
                  this.messages.push(message);
                }
              }
            });
            this.syncVisibleMessages();
            this.lastMessageId = chat[length - 1].id as number;
            this.scrollToBottom();
          }
          this.cdr.markForCheck();
        } else {
          this.dataProvider.errorALertMessage(response.message || '');
          if (this.chatInterval) clearInterval(this.chatInterval);
          this.router.navigate(['login'], { replaceUrl: true });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  // 🟢 دالة مساعدة للتمرير لأسفل المحادثة بسلاسة
  scrollToBottom() {
    setTimeout(() => {
      if (this.contentArea && this.contentArea.scrollToBottom) {
        this.contentArea.scrollToBottom(300);
      }
    }, 100);
  }

  dismiss() {
    if (this.chatInterval) clearInterval(this.chatInterval);
    this._location.back();
  }

  sendMessage() {
    if ((this.message && this.message.trim() != '') || this.attachment != '') {
      if (this.message.length > 140) {
        this.dataProvider.showToast(this.lang.max_body || 'النص طويل جداً');
      } else {
        this.image = '';

        let data: Record<string, unknown> = {};
        if (this.userInfo.user_type == UserType.Parent || this.userInfo.user_type == UserType.Student) {
          data = {
            session_id: this.userDetails.session_id,
            user_no: this.userInfo.user_no,
            user_type: this.userInfo.user_type,
            chat_msg: {
              connect_id: this.chat.id,
              msg_from: this.userInfo.user_no,
              msg_to: this.userInfo.school_id,
              message: this.message,
              attachment_url: this.attachment
            }
          };
        } else if (this.userInfo.user_type == UserType.Admin) {
          data = {
            session_id: this.userDetails.session_id,
            user_no: this.userInfo.user_no,
            user_type: this.userInfo.user_type,
            chat_msg: {
              connect_id: this.chat.id,
              msg_from: this.userInfo.school_id,
              msg_to: this.chat.parent_user_no,
              admin_user_no: this.userInfo.user_no,
              message: this.message,
              attachment_url: this.attachment
            }
          };
        }

        this.dataProvider
          .run(() =>
            this.parentConnectApi.sendParentConnectChatMsg(
              data as {
                session_id: string;
                user_no: string | number;
                user_type: string;
                chat_msg: Record<string, string | number>;
              }
            )
          )
          .then(response => {
            if (response.session) {
              this.dataProvider.showToast(response.message || '');
              if (this.lastMessageId < Number(response.msg_id)) {
                if (response.attachment_url) {
                  this.messages.push({
                    receiver: 'false',
                    message: this.message,
                    id: response.msg_id,
                    attachment_url: response.attachment_url
                  });
                } else {
                  this.messages.push({
                    receiver: 'false',
                    message: this.message,
                    id: response.msg_id
                  });
                }
                this.syncVisibleMessages();
                this.scrollToBottom();
              }
              this.message = '';
              this.attachment = '';
            } else {
              this.dataProvider.errorALertMessage(response.message || '');
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
  }

  async takePicture() {
    const alert = await this.alertCtrl.create({
      header: this.lang.image_option || 'اختر',
      buttons: [
        {
          text: this.lang.camera || 'الكاميرا',
          handler: () => {
            this.openCamera();
          }
        },
        {
          text: this.lang.gallery || 'المعرض',
          handler: () => {
            this.openGallery();
          }
        }
      ]
    });
    await alert.present();
  }

  openCamera() {
    const options: ImageOptions = {
      quality: 100,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 500,
      height: 500,
      allowEditing: true
    };

    Camera.getPhoto(options).then(imageData => {
      if (imageData && imageData.base64String) {
        this.attachment = 'data:image/png;base64,' + imageData.base64String;
        this.image = 'data:image/jpeg;base64,' + imageData.base64String;
      }
      this.cdr.markForCheck();
    });
  }

  openGallery() {
    const options: ImageOptions = {
      quality: 100,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 500,
      height: 500,
      allowEditing: true
    };

    Camera.getPhoto(options).then(imageData => {
      if (imageData && imageData.base64String) {
        this.attachment = 'data:image/png;base64,' + imageData.base64String;
        this.image = 'data:image/jpeg;base64,' + imageData.base64String;
      }
      this.cdr.markForCheck();
    });
  }

  downloadImage(imageUrl: string) {
    this.dataProvider
      .run(() => this.dataProvider.downloadImage(imageUrl))
      .then(res => {
        this.dataProvider.showToast(this.lang.download_complete || 'تم التنزيل');
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error);
      });
  }
}
