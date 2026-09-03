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
import { NgClass } from '@angular/common';
import { IonicSelectableComponent } from 'ionic-selectable';

@Component({
  selector: 'app-school-registration',
  templateUrl: './school-registration.page.html',
  styleUrls: ['./school-registration.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, IonicSelectableComponent, NgClass, TranslatePipe]
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
  detectingCountry = false;

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
    await this.autoDetectCountry();
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

  /** Smart country detection, most-to-least reliable, never blocking manual
   * selection: (1) IP geolocation via GeoServiceProvider.getMyLocation() —
   * already built (ipinfo.io) but never wired to any screen before this.
   * (2) If that fails (no network, API down, ipinfoToken exhausted), the
   * browser's own locale region subtag (`navigator.language`, e.g.
   * "ar-KW" -> "KW") — instant, no network, no extra dependency. (3) If
   * neither resolves to one of our known countries, `selected_country`
   * simply stays empty ('') exactly as it always has, and the existing
   * `ionic-selectable` dropdown is right there for the user to pick
   * manually — registerSchool() already blocks submission with a clear
   * message until a country is chosen, so nothing new is needed there. */
  async autoDetectCountry() {
    if (this.selected_country?.code) return; // already set (e.g. by a prior detection re-entry)

    this.detectingCountry = true;
    this.cdr.markForCheck();

    let code = await this.detectCountryByIp();
    if (!code) {
      code = this.detectCountryByLocale();
    }

    if (code && this.applyDetectedCountry(code)) {
      // Left silent on failure (network/API issues are routine, not worth
      // surfacing) — only confirm the happy path, matching this app's
      // existing toast-on-success/silent-on-best-effort-failure pattern.
      this.dataProvider.showToast(
        this.translate.instant('reg_school.country_auto_detected', { country: this.selected_country.name })
      );
    }

    this.detectingCountry = false;
    this.cdr.markForCheck();
  }

  private async detectCountryByIp(): Promise<string> {
    try {
      const location = await this.geo.getMyLocation();
      return location && location.countryCode ? String(location.countryCode).toUpperCase() : '';
    } catch {
      return '';
    }
  }

  private detectCountryByLocale(): string {
    try {
      const locale = navigator?.language || (navigator as any)?.userLanguage || '';
      // "ar-KW" / "en-US" -> region subtag after the hyphen/underscore.
      const match = /[-_]([A-Za-z]{2})$/.exec(locale);
      return match ? match[1].toUpperCase() : '';
    } catch {
      return '';
    }
  }

  /** @returns true if `code` matched a known country and was applied. */
  private applyDetectedCountry(code: string): boolean {
    const match = this.countries.find(c => String(c.code).toUpperCase() === code);
    if (!match) return false;
    this.selected_country = match;
    this.assignCountry();
    return true;
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
