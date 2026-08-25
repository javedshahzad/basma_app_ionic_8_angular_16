import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, Platform, AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { CameraResultType, Camera, ImageOptions, CameraSource } from '@capacitor/camera';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { GeoServiceProvider } from '../service/geo-service/geo-service';
// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass } from '@angular/common';
import { IonicSelectableComponent } from 'ionic-selectable';

@Component({
    selector: 'app-school-registration',
    templateUrl: './school-registration.page.html',
    styleUrls: ['./school-registration.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, NgIf, IonicSelectableComponent, NgClass, TranslatePipe]
})
export class SchoolRegistrationPage implements OnInit {
  school: any = {
    school_name: '',
    email_id: '',
    phone_no: '',
    username: '',
    password: '',
    school_logo: '',
    school_image: '',
    country_code: ''
  };

  school_logo: any = './assets/imgs/logo.png';
  school_image: any = '';
  lang: any = {};
  selected_country = { code: '', name: '' };
  countries: any[] = [];
  countryDetails: any = {};
  AgreeOnTosPP = true;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public translate: TranslateService,
    private geo: GeoServiceProvider,
    public dataProvider: DataService,
    public authProvider: AuthService,
    private router: Router,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين الجديدة
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  async ngOnInit() {
    await this.getCountry();
  }

  // 🟢 جلب اللغة والدولة بشكل آمن
  async getCountry() {
    let currentLang = (await this.storageSr.get('language')) || 'ar';
    if (currentLang === 'en') {
      this.countries = this.geo.getEnCountries();
    } else {
      this.countries = this.geo.getArCountries();
    }
    this.cdr.markForCheck();
  }

  assignCountry() {
    if (this.selected_country && this.selected_country.code) {
      this.countryDetails = this.geo.getCountryDetails(this.selected_country.code);
    }
  }

  // 🟢 إضافة الدالة الناقصة التي يبحث عنها ملف الـ HTML
  countryChange(event: any) {
    this.selected_country = event.value;
    this.assignCountry();
  }

  openUrl(url: string) {
    window.open(url, '_system');
  }

  // 🟢 عملية التسجيل المحدثة
  async registerSchool() {
    if (!this.selected_country || this.selected_country.name === '') {
      this.presentAlert(this.lang.select_country || 'الرجاء اختيار الدولة', false);
      return;
    }

    if (this.AgreeOnTosPP === false) {
      this.presentAlert(this.lang.agree_terms_error || 'الرجاء الموافقة على الشروط والأحكام', false);
      return;
    }

    this.school.country_code = this.selected_country.code;

    try {
      const response = await this.dataProvider.run(() => this.authProvider.registerSchool(this.school));
      this.presentAlert(response, true);
      // التوجيه لصفحة تسجيل الدخول بعد النجاح
      setTimeout(() => {
        this.router.navigate(['login']);
      }, 2000);
    } catch (err) {
      this.dataProvider.errorALertMessage(err instanceof Error ? err.message : String(err));
    }
  }

  async presentAlert(response: string, pop = true) {
    const alert = await this.alertCtrl.create({
      header: 'تنبيه',
      message: response,
      buttons: ['موافق'],
      mode: 'ios'
    });
    await alert.present();
  }

  // 🟢 إصلاح منطق التقاط الصور (الآن يدعم التفريق بين اللوجو وصورة المدرسة)
  async takePicture(type: string) {
    const alert = await this.alertCtrl.create({
      header: this.lang.image_option || 'خيارات الصورة',
      buttons: [
        {
          text: this.lang.camera || 'الكاميرا',
          handler: () => {
            this.openCamera(type);
          }
        },
        {
          text: this.lang.gallery || 'المعرض',
          handler: () => {
            this.openGallery(type);
          }
        }
      ]
    });
    await alert.present();
  }

  async openCamera(type: string) {
    const options: ImageOptions = {
      quality: 100,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    };
    const image = await Camera.getPhoto(options);
    if (image) {
      this.handleImageData(image.base64String || '', type);
    }
  }

  async openGallery(type: string) {
    const options: ImageOptions = {
      quality: 79,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos
    };
    const image = await Camera.getPhoto(options);
    if (image) {
      this.handleImageData(image.base64String || '', type);
    }
  }

  handleImageData(base64: string, type: string) {
    let finalImage = 'data:image/png;base64,' + base64;
    if (type === 'schoollogo') {
      this.school.school_logo = finalImage;
      this.school_logo = finalImage;
    } else {
      this.school.school_image = finalImage;
      this.school_image = finalImage;
    }
    this.cdr.markForCheck();
  }
}
