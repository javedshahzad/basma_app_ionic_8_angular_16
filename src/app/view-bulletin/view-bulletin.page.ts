import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Browser } from '@capacitor/browser';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-view-bulletin',
  templateUrl: './view-bulletin.page.html',
  styleUrls: ['./view-bulletin.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewBulletinPage implements OnInit {
  trackByIndex(index: number): number { return index; }
  lang: any = {};
  bulletin: any = {};
  userDetails: any = {};
  navData: any;
  
  // متغيرات عارض الصور
  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    public platform: Platform,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    // 🟢 التقاط بيانات الـ Router متزامناً مع الحماية من undefined
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state;
      this.bulletin = this.navData.bulletin || this.navData;
    }
  }

  ngOnInit() {}

  // 🟢 جلب المستخدم وتأمين البيانات من الضياع عند الـ Refresh
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get("userloggedin");
    
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      if (this.bulletin && (this.bulletin.id || this.bulletin.bulletin_id)) {
        await this.storageSr.set('currentViewBulletin', this.bulletin);
      } else {
        let savedBulletin = await this.storageSr.get('currentViewBulletin');
        if (savedBulletin) {
          this.bulletin = savedBulletin;
        } else {
          this.navCtrl.back();
        }
      }
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  // 🟢 دالة ذكية لفتح الملفات حسب نوعها
  async viewFile(file: any) {
    const url = file.file_url;
    const ext = file.file_name.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      // إذا كانت صورة، نفتح العارض المدمج الخاص بك
      this.openFullscreenImage(url);
    } else if (ext === 'pdf') {
      // إذا كان PDF، نوجهه لصفحة عارض الـ PDF
      const navigation: NavigationExtras = {
        state: { pdfUrl: url, title: file.file_name }
      };
      this.router.navigate(['pdfviewer'], navigation);
    } else {
      // لأي ملف آخر (مثل Word أو Excel)، نستخدم متصفح كاباسيتور الحديث
      if (url) {
        try {
          await Browser.open({ url: url });
        } catch (e) {
          console.error('Error opening file URL', e);
          window.open(url, '_blank');
        }
      }
    }
  }

  openFullscreenImage(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => { this.viewImageUrl = ''; }, 300);
  }

  forwardBulletin() {
    const navigation: NavigationExtras = {
      state: {
        bulletin: this.bulletin,
        forward_user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id
      }
    };
    this.zone.run(() => {
      this.router.navigate(['share-bulletins'], navigation);
    });
  }
}