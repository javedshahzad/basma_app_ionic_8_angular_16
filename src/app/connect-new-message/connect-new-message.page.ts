import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, Platform, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';

import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

import { CameraResultType, Camera, ImageOptions, CameraSource } from '@capacitor/camera';
import { ParentConnectApiService } from '../service/parent-connect-api/parent-connect-api.service';
import { StorageService } from '../service/storage.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { LoggedInUser } from '../model/logged-in-user.model';

@Component({
    selector: 'app-connect-new-message',
    templateUrl: './connect-new-message.page.html',
    styleUrls: ['./connect-new-message.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, NgIf, TranslatePipe]
})
export class ConnectNewMessagePage {
  userDetails: LoggedInUser = {};
  message: Record<string, string> = {
    title: '',
    message: '',
    ticketImage: ''
  };
  ticketImage: string = '';
  lang: Record<string, string> = {};

  constructor(
    public navCtrl: NavController,
    public viewCtrl: ModalController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private router: Router,
    private parentConnectApi: ParentConnectApiService,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  async ionViewWillEnter() {
    this.userDetails = await this.storageSr.get('userloggedin');
    this.cdr.markForCheck();
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  async sendMessage() {
    // التأكد من عدم تجاوز الحد الأقصى
    if (this.message.title.length > 35) {
      this.dataProvider.showToast(this.lang.max_title);
    } else if (this.message.message.length > 140) {
      this.dataProvider.showToast(this.lang.max_body);
    } else {
      let data = {
        user_no: this.userDetails.details!.user_no!,
        school_id: this.userDetails.details!.school_id!,
        session_id: this.userDetails.session_id!,
        message: this.message
      };

      try {
        const response = await this.dataProvider.run(() => this.parentConnectApi.createParentConnectChat(data));
        if (response.session) {
          this.dataProvider.showToast(response.message || '');
          this.viewCtrl.dismiss(true);
        } else {
          this.authProvider.flushLocalStorage();
          this.dataProvider.errorALertMessage(response.message || '');
          this.viewCtrl.dismiss(true);
          this.router.navigate(['login'], { replaceUrl: true });
        }
      } catch (error) {
        this.dataProvider.errorALertMessage(error instanceof Error ? error.message : String(error));
      }
    }
  }

  async takePicture() {
    const alert = await this.alertCtrl.create({
      header: this.lang.image_option || 'إرفاق صورة',
      mode: 'ios',
      buttons: [
        {
          text: this.lang.camera || 'الكاميرا',
          handler: () => {
            this.openCamera();
          }
        },
        {
          text: this.lang.gallery || 'معرض الصور',
          handler: () => {
            this.openGallery();
          }
        },
        {
          text: this.lang.alert_btn_cancel_text || 'إلغاء',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  openCamera() {
    const options: ImageOptions = {
      quality: 80,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 800,
      height: 800,
      allowEditing: true
    };

    Camera.getPhoto(options)
      .then(imageData => {
        if (imageData) {
          this.message.ticketImage = 'data:image/png;base64,' + imageData.base64String;
          this.ticketImage = 'data:image/png;base64,' + imageData.base64String;
        }
        this.cdr.markForCheck();
      })
      .catch(e => console.log('Camera Error', e));
  }

  openGallery() {
    const options: ImageOptions = {
      quality: 80,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 800,
      height: 800,
      allowEditing: true
    };

    Camera.getPhoto(options)
      .then(imageData => {
        if (imageData) {
          this.message.ticketImage = 'data:image/png;base64,' + imageData.base64String;
          this.ticketImage = 'data:image/png;base64,' + imageData.base64String;
        }
        this.cdr.markForCheck();
      })
      .catch(e => console.log('Gallery Error', e));
  }

  // 🟢 دالة جديدة لحذف الصورة المرفقة إذا تراجع المستخدم
  removeImage() {
    this.message.ticketImage = '';
    this.ticketImage = '';
  }

}
