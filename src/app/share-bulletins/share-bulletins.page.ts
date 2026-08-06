import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

// 🟢 استيراد خدمة التخزين لحماية البيانات
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-share-bulletins',
  templateUrl: './share-bulletins.page.html',
  styleUrls: ['./share-bulletins.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ShareBulletinsPage implements OnInit {
  lang: any = {};
  bulletin: any = {};
  forward_user_no: any;
  school_id: any;
  navData: any = {};
  description: string = '';

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
    private storageSr: StorageService, // 🟢 حقن الخدمة
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });

    // 🟢 إصلاح لغم الـ Router: التقاط البيانات مع الحماية من undefined
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state;
      this.bulletin = this.navData.bulletin || {}; // استخدام or (||) للحماية
      this.forward_user_no = this.navData.forward_user_no || '';
      this.school_id = this.navData.school_id || '';
    }
  }

  // 🟢 حماية البيانات من الضياع عند الـ Refresh (إعادة تحميل الصفحة)
  async ngOnInit() {
    if (this.bulletin && Object.keys(this.bulletin).length > 0) {
      await this.storageSr.set('currentShareBulletin', {
        navData: this.navData,
        bulletin: this.bulletin,
        forward_user_no: this.forward_user_no,
        school_id: this.school_id
      });
    } else {
      let savedData = await this.storageSr.get('currentShareBulletin');
      if (savedData) {
        this.navData = savedData.navData;
        this.bulletin = savedData.bulletin;
        this.forward_user_no = savedData.forward_user_no;
        this.school_id = savedData.school_id;
      } else {
        // إذا لم يكن هناك أي بيانات، العودة للصفحة السابقة
        this.navCtrl.back();
      }
      this.cdr.markForCheck();
    }
  }

  share() {
    let data = {
      bulletinId: this.bulletin.bulletin_id || this.bulletin.id, // الحماية من تغيّر اسم الحقل
      forwardedby_user_no: this.forward_user_no,
      school_id: this.school_id,
      description: this.description
    };

    const navigation: NavigationExtras = {
      state: data
    };

    this.zone.run(() => {
      this.router.navigate(['bulletin-users'], navigation);
    });
  }
}
