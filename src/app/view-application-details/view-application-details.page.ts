import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { NavController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-view-application-details',
  templateUrl: './view-application-details.page.html',
  styleUrls: ['./view-application-details.page.scss'],
})
export class ViewApplicationDetailsPage implements OnInit {
  AppData: any;
  formattedSeminars: string[] = [];

  // 🔴 متغيرات التحكم في نافذة عرض الصورة 
  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  constructor(public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    public network: Network,
    private route: ActivatedRoute,
    private router: Router,
    private storageSr: StorageService // 🟢 2. حقن خدمة التخزين
  ) { 
      // 🟢 3. قراءة البيانات بشكل آمن ومباشر من الـ Router خارج الـ subscribe لمنع خطأ الـ Null
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.AppData = navigation.extras.state['AppData'];
        this.processSeminars(); 
      }
    }

  // 🟢 4. استخدام التخزين الآمن لحماية الشاشة من الضياع عند عمل Refresh
  async ngOnInit() {
    if (this.AppData) {
      // حفظ البيانات مؤقتاً
      await this.storageSr.set('currentAppData', this.AppData);
    } else {
      // محاولة استرجاعها من الذاكرة إذا حدث تحديث للصفحة
      let savedData = await this.storageSr.get('currentAppData');
      if (savedData) {
        this.AppData = savedData;
        this.processSeminars();
      }
    }
  }

  processSeminars() {
    if (!this.AppData || !this.AppData.absent_seminars) return;
    
    let strVal = String(this.AppData.absent_seminars);
    let splitVals = strVal.split(',');
    this.formattedSeminars = [];

    splitVals.forEach(part => {
      let cleanPart = part.trim();

      if (cleanPart.toLowerCase().includes('sem')) {
        this.formattedSeminars.push(cleanPart.replace(/sem(inar)?\s*-\s*/ig, 'الحصة '));
      } 
      else if (!isNaN(Number(cleanPart)) && cleanPart !== '') {
        this.formattedSeminars.push('الحصة ' + cleanPart);
      } 
      else {
        this.formattedSeminars.push(cleanPart);
      }
    });
  }

  // 🔴 دوال فتح وإغلاق الصورة المكبرة
  openFullscreenImage(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => {
      this.viewImageUrl = '';
    }, 300); // تأخير بسيط لجمالية الإغلاق (Fade out)
  }

}