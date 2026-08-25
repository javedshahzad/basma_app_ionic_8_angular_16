import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, PopoverController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Router, NavigationExtras } from '@angular/router';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { BulletinsApiService } from '../service/bulletins-api/bulletins-api.service';
import { UserType } from '../constants/user-type';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { DateFormatPipe } from '../pipes/date-format/date-format.pipe';
import { HasRoleDirective } from '../directives/has-role.directive';

@Component({
    selector: 'app-bulletins',
    templateUrl: './bulletins.page.html',
    styleUrls: ['./bulletins.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, NgClass, DateFormatPipe, TranslatePipe, HasRoleDirective]
})
export class BulletinsPage {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;
  lang: any;
  userDetails: any;
  userType: any;
  bulletins: any = [];
  allBullentins: any = [];
  user_no: any;
  isLoading: boolean = true; // 🟢 متغير التحميل الوهمي السلس

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private photoViewer: PhotoViewer,
    private router: Router,
    public zone: NgZone,
    public platform: Platform,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private bulletinsApi: BulletinsApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
  }


  async ionViewWillEnter() {
    this.isLoading = true;
    this.allBullentins = [];

    // 🟢 استخدام StorageService الآمن
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.user_no = this.userDetails.details.user_no;
      this.getBulletins();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getBulletins() {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id
    };

    this.bulletinsApi
      .getBulletins(data)
      .then(res => {
        this.isLoading = false; // إخفاء التحميل
        if (res) {
          this.bulletins = res.data;
          if (this.bulletins) {
            if (this.bulletins.length > 1) {
              this.allBullentins = this.bulletins.splice(0, 20);
            } else {
              this.allBullentins = this.bulletins;
            }
          }
        }
        this.cdr.markForCheck();
      })
      .catch(e => {
        this.isLoading = false;
        console.log(e);
        this.cdr.markForCheck();
      });
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      if (this.bulletins && this.bulletins.length > 0) {
        this.allBullentins = this.allBullentins.concat(this.bulletins.splice(0, 20));
      }
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 500);
  }

  addBulletin(base64Image: string) {
    let objToSend: NavigationExtras = {
      queryParams: { base64Image: base64Image }
    };
    this.router.navigate(['follow-bulletins'], { state: { cameraImage: objToSend } });
  }

  openImage(image: string) {
    this.photoViewer.show(image);
  }

  opendoc(pdf: string) {
    let link = 'https://docs.google.com/viewer?url=' + pdf;
    window.open(link, '_system');
  }

  openPdf(pdf: string) {
    window.open(pdf, '_system');
  }

  openPdfs(pdf: string) {
    window.open(pdf + '.pdf', '_system');
  }

  openBulletin(bullet: any) {
    const navigation: NavigationExtras = { state: bullet };
    this.zone.run(() => {
      this.router.navigate(['view-bulletin'], navigation);
    });
  }

  async openCamera() {
    try {
      const image = await Camera.getPhoto({
        quality: 100,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      if (image && image.base64String) {
        let base64Image = 'data:image/jpeg;base64,' + image.base64String;
        this.addBulletin(base64Image);
      }
    } catch (e) {
      console.log('Camera Error: ', e);
    }
  }
}
