import { Component, NgZone, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, IonicModule } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, NavigationExtras } from '@angular/router';
import { GeoServiceProvider } from '../service/geo-service/geo-service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-elearning-schools',
    templateUrl: './elearning-schools.page.html',
    styleUrls: ['./elearning-schools.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, FormsModule, NgClass, TranslatePipe]
})
export class ElearningSchoolsPage {
  trackByIndex(index: number): number {
    return index;
  }
  public language: EventEmitter<any> = new EventEmitter();

  schools: any = [];
  noDataFound: string = '';
  lang: any = {};
  location_lang: any = {};

  // 🟢 متغيرات نافذة الدول (مطابقة لصفحة الأخبار)
  country_code: any;
  country: any = null; // الدولة المحددة حالياً ككائن
  countries: any[] = []; // جميع الدول
  filteredCountries: any[] = []; // الدول بعد البحث
  isCountryModalOpen: boolean = false;
  countrySearchQuery: string = '';

  userDetails: any;
  show_loading: boolean = true;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    private router: Router,
    public alertController: AlertController,
    private geo: GeoServiceProvider,
    public zone: NgZone,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private schoolDirectoryApi: SchoolDirectoryApiService
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.translate.get('location').subscribe(res => {
      this.location_lang = res;
      this.cdr.markForCheck();
    });
  }


  async ionViewWillEnter() {
    this.show_loading = true;
    this.schools = [];

    // 🟢 قراءة اللغة الحالية وجلب مصفوفة الدول
    const currentLang = this.translate.currentLang || this.translate.getDefaultLang();
    this.countries = currentLang === 'ar' ? this.geo.getAllCountries() : this.geo.getEnCountries();
    this.filteredCountries = [...this.countries];

    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      // 🟢 إذا كان للمستخدم دولة افتراضية، قم بتحديدها
      if (this.userDetails.details && this.userDetails.details.country_code) {
        this.country_code = this.userDetails.details.country_code;
        this.country = this.countries.find(c => c.code === this.country_code);
        this.getSchool(this.country_code);
      } else {
        this.country = null;
        this.country_code = null;
        this.getSchool(null);
      }
    } else {
      this.show_loading = false;
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getSchool(location) {
    this.schoolDirectoryApi
      .getSchool(location)
      .then(schoolList => {
        this.show_loading = false;
        this.schools = schoolList || [];
        if (this.schools.length === 0) {
          this.noDataFound = this.lang.no_schools_found || 'لا توجد مدارس متاحة حالياً.';
        }
        this.cdr.markForCheck();
      })
      .catch(err => {
        this.show_loading = false;
        this.noDataFound = this.lang.no_schools_found || 'حدث خطأ في جلب البيانات.';
        console.log(err);
        this.cdr.markForCheck();
      });
  }

  // 🟢 دوال التحكم بالنافذة المنبثقة والفلترة (من صفحة الأخبار)
  openCountryModal() {
    this.filteredCountries = [...this.countries];
    this.countrySearchQuery = '';
    this.isCountryModalOpen = true;
  }

  filterCountries() {
    if (!this.countrySearchQuery || this.countrySearchQuery.trim() === '') {
      this.filteredCountries = [...this.countries];
    } else {
      const query = this.countrySearchQuery.toLowerCase();
      this.filteredCountries = this.countries.filter(
        c => (c.ar_name && c.ar_name.toLowerCase().includes(query)) || (c.name && c.name.toLowerCase().includes(query))
      );
    }
  }

  selectCountry(selected: any) {
    this.isCountryModalOpen = false;
    if (this.country?.code === selected.code) return;

    this.country = selected;
    this.country_code = selected.code;

    this.schools = [];
    this.show_loading = true;
    this.getSchool(this.country_code);
  }

  clearCountryFilter(event: Event) {
    event.stopPropagation();
    if (!this.country) return;

    this.country = null;
    this.country_code = null;

    this.schools = [];
    this.show_loading = true;
    this.getSchool(null);
  }

  openschool(school: any) {
    const navigation: NavigationExtras = {
      state: { schoolInfo: school, country_code: this.country_code }
    };
    this.zone.run(() => {
      this.router.navigate(['elearning-school-video'], navigation);
    });
  }
}
