import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, ModalController } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { GeoServiceProvider } from '../service/geo-service/geo-service';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { ElearningApiService } from '../service/elearning-api/elearning-api.service';

@Component({
  selector: 'app-elearning-school-video',
  templateUrl: './elearning-school-video.page.html',
  styleUrls: ['./elearning-school-video.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElearningSchoolVideoPage implements OnInit {

  trackByIndex(index: number): number { return index; }
  categories: any = [];
  school: any = {};
  country_code: any;
  location_lang: any;
  country: any;
  selected_country = {
    code: "",
    name: "Worldwide"
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
    this.translate.get("location").subscribe((res) => {
      this.location_lang = res;
      this.cdr.markForCheck();
    });

    // 🟢 التقاط البيانات بأمان لمنع الانهيار
    this.route.queryParams.subscribe(async params => {
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

  ngOnInit() {}

  getElerningMaterials(c_dode) {
    this.show_loading = true;
    this.elearningApi.getElearningMaterials(this.school.id, c_dode).then((materialList) => {
      this.show_loading = false;
      // 🟢 إضافة متغير 'isOpen' للتحكم بفتح وإغلاق القوائم بطريقة Angular صحيحة بدلاً من DOM
      this.categories = materialList.map((cat: any) => {
        return { ...cat, isOpen: false };
      });
      this.cdr.markForCheck();
    }).catch((err) => {
      this.show_loading = false;
      this.dataProvider.errorALertMessage(err);
      this.cdr.markForCheck();
    });
  }

  // 🟢 دالة Angular الصافية للتحكم بالـ Accordion (فتح وإغلاق القوائم)
  toggleCategory(index: number) {
    this.categories[index].isOpen = !this.categories[index].isOpen;
  }

  portChange(event) {
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
        }, {
          text: this.location_lang.international,
          handler: () => {
            this.getElerningMaterials(null);
          }
        }
      ]
    });

    await alert.present();
  }

  playvideo(materialId: any) {
    const navigation: NavigationExtras = {
      state: { materialId: materialId }
    };
    this.zone.run(() => {
      this.router.navigate(['playvideo'], navigation);
    });
  }
}