import { Component, OnInit } from '@angular/core';
import { NavController, Platform, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';

import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

import { CameraResultType , Camera , ImageOptions, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-connect-new-message',
  templateUrl: './connect-new-message.page.html',
  styleUrls: ['./connect-new-message.page.scss'],
})
export class ConnectNewMessagePage implements OnInit {
  userDetails: any = {};
  message: any = {
    title: '',
    message: '',
    ticketImage: ''  
  };
  ticketImage: string = '';
  lang: any = {};
  
  constructor(public navCtrl: NavController, 
              public viewCtrl: ModalController,
              public dataProvider: DataService, 
              public authProvider: AuthService, 
              public translate: TranslateService, 
              public alertCtrl: AlertController,
              private router: Router) {
              
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
    });
  }

  ionViewWillEnter() {
    this.userDetails = JSON.parse(localStorage.getItem("userloggedin"));
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
  
  sendMessage() {
    // التأكد من عدم تجاوز الحد الأقصى
    if (this.message.title.length > 35) {
      this.dataProvider.showToast(this.lang.max_title);
    } else if (this.message.message.length > 140) {
      this.dataProvider.showToast(this.lang.max_body);
    } else {
      this.dataProvider.showLoading();
      let data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id,
        session_id: this.userDetails.session_id,
        message: this.message
      };
      
      this.dataProvider.createParentConnectChat(data).then((response) => {
        this.dataProvider.hideLoading();
        if (response.session) {
          this.dataProvider.showToast(response.message);
          this.viewCtrl.dismiss(true);
        } else {
          this.authProvider.flushLocalStorage();
          this.dataProvider.errorALertMessage(response.message);
          this.viewCtrl.dismiss(true);
          this.router.navigate(['login'], { replaceUrl: true });
        }
      }).catch(error => {
        this.dataProvider.hideLoading();
        this.dataProvider.errorALertMessage(error);
      });
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
      allowEditing: true,
    };

    Camera.getPhoto(options).then((imageData) => {
      if (imageData) {
        this.message.ticketImage = "data:image/png;base64," + imageData.base64String;
        this.ticketImage = "data:image/png;base64," + imageData.base64String;
      }
    }).catch(e => console.log('Camera Error', e));
  }

  openGallery() {
    const options: ImageOptions = {
      quality: 80,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 800,
      height: 800,
      allowEditing: true,
    };

    Camera.getPhoto(options).then((imageData) => {
      if (imageData) {
        this.message.ticketImage = "data:image/png;base64," + imageData.base64String;
        this.ticketImage = "data:image/png;base64," + imageData.base64String;
      }
    }).catch(e => console.log('Gallery Error', e));
  }

  // 🟢 دالة جديدة لحذف الصورة المرفقة إذا تراجع المستخدم
  removeImage() {
    this.message.ticketImage = '';
    this.ticketImage = '';
  }

  ngOnInit() {
  }
}