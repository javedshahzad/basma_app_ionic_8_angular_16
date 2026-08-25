import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, Platform, ModalController, IonicModule } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { GeoServiceProvider } from '../service/geo-service/geo-service';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { ElearningApiService, ElearningCategory } from '../service/elearning-api/elearning-api.service';
import { School } from '../service/school-directory-api/school-directory-api.service';
import { NgClass } from '@angular/common';

type ElearningCategoryWithUiState = ElearningCategory & { isOpen: boolean };

@Component({
  selector: 'app-elearning-school-video',
  templateUrl: './elearning-school-video.page.html',
  styleUrls: ['./elearning-school-video.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, NgClass, TranslatePipe]
})
export class ElearningSchoolVideoPage {
  private destroyRef = inject(DestroyRef);

  trackByIndex(index: number): number {
    return index;
  }
  categories: ElearningCategoryWithUiState[] = [];
  school: School = {};
  country_code: string;
  location_lang: Record<string, string>;
  country: unknown;
  selected_country = {
    code: '',
    name: 'Worldwide'
  };
  show_loading: boolean = true;

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    private route: ActivatedRoute,
    private alertController: AlertController,
    public translate: TranslateService,
    private geo: GeoServiceProvider,
    private router: Router,
    public zone: NgZone,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private elearningApi: ElearningApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('location').subscribe(res => {
      this.location_lang = res;
      this.cdr.markForCheck();
    });

    // 🟢 التقاط البيانات بأمان لمنع الانهيار
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.school = navigation.extras.state['schoolInfo'];
        this.country_code = navigation.extras.state['country_code'];

        // حفظ البيانات مؤقتاً لتجنب ضياعها عند تحديث الصفحة
        await this.storageSr.set('currentElearningSchool', {
          schoolInfo: this.school,
          country_code: this.country_code
        });
      } else {
        // استعادة البيانات إذا ضاعت
        let savedData = await this.storageSr.get('currentElearningSchool');
        if (savedData) {
          this.school = savedData.schoolInfo;
          this.country_code = savedData.country_code;
        } else {
          this.navCtrl.back();
          return;
        }
      }

      this.country = this.geo.getAllCountries();
      this.getElerningMaterials(null);
      this.cdr.markForCheck();
    });
  }

  getElerningMaterials(c_dode: string | null) {
    this.show_loading = true;
    this.elearningApi
      .getElearningMaterials(this.school.id!, c_dode || undefined)
      .then(materialList => {
        this.show_loading = false;
        // 🟢 إضافة متغير 'isOpen' للتحكم بفتح وإغلاق القوائم بطريقة Angular صحيحة بدلاً من DOM
        this.categories = materialList.map(cat => {
          return { ...cat, isOpen: false };
        });
        this.cdr.markForCheck();
      })
      .catch(err => {
        this.show_loading = false;
        this.dataProvider.errorALertMessage(err);
        this.cdr.markForCheck();
      });
  }

  // 🟢 دالة Angular الصافية للتحكم بالـ Accordion (فتح وإغلاق القوائم)
  toggleCategory(index: number) {
    this.categories[index].isOpen = !this.categories[index].isOpen;
  }

  portChange(event: { value: { code?: string } }) {
    if (event.value.code) {
      this.getElerningMaterials(event.value.code);
    } else {
      this.getElerningMaterials(null);
    }
  }

  async selectNewsCountry() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: this.location_lang.select_country,
      message: this.location_lang.select_country_subheading,
      mode: 'ios',
      buttons: [
        {
          text: this.location_lang.local,
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.getElerningMaterials(this.country_code);
          }
        },
        {
          text: this.location_lang.international,
          handler: () => {
            this.getElerningMaterials(null);
          }
        }
      ]
    });

    await alert.present();
  }

  playvideo(materialId: string | number) {
    const navigation: NavigationExtras = {
      state: { materialId: materialId }
    };
    this.zone.run(() => {
      this.router.navigate(['playvideo'], navigation);
    });
  }
}
