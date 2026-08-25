import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, AlertController, IonicModule } from '@ionic/angular';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-view-application-details',
  templateUrl: './view-application-details.page.html',
  styleUrls: ['./view-application-details.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, NgClass, TranslatePipe]
})
export class ViewApplicationDetailsPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  AppData: any;
  formattedSeminars: string[] = [];

  // 🔴 متغيرات التحكم في نافذة عرض الصورة
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
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private cdr: ChangeDetectorRef
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
        this.cdr.markForCheck();
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
        this.formattedSeminars.push(cleanPart.replace(/sem(inar)?\s*-\s*/gi, 'الحصة '));
      } else if (!isNaN(Number(cleanPart)) && cleanPart !== '') {
        this.formattedSeminars.push('الحصة ' + cleanPart);
      } else {
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
