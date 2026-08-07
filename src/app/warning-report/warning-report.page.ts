import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, ModalController, Platform, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { ReportsApiService } from '../service/reports-api/reports-api.service';
import { NgClass, NgIf, NgFor, DatePipe } from '@angular/common';

@Component({
    selector: 'app-warning-report',
    templateUrl: './warning-report.page.html',
    styleUrls: ['./warning-report.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgClass, NgIf, NgFor, DatePipe, TranslatePipe]
})
export class WarningReportPage {
  trackByIndex(index: number): number {
    return index;
  }
  userDetails: any = {};
  reportData: any = [];
  reportType: any = 'callOfParentAndPledges';

  callOfStudentsReport: any = [];
  AllStudentPledgesReports: any = [];

  show_loading: boolean = false;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    public zone: NgZone,
    private router: Router,
    private printer: Printer,
    private platform: Platform, // 🟢 حقن المنصة للتحقق من بيئة العمل
    public modalCtrl: ModalController,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين الجديدة
    private reportsApi: ReportsApiService,
    private cdr: ChangeDetectorRef
  ) {}


  // 🟢 3. التخلص من localStorage واستخدام async/await
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.getAllWarning();
      this.getStudentCallOfReports();
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  doRefresh(event) {
    this.getAllWarning(false);
    this.getStudentCallOfReports();
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  // 🟢 جلب الإنذارات
  getAllWarning(loader: boolean = true) {
    let data = {
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      school_id: this.userDetails.details.school_id
    };

    if (loader) {
      this.show_loading = true;
    }

    this.reportsApi
      .getAllWarning(data)
      .then(res => {
        this.show_loading = false;
        if (res) {
          this.reportData = res;
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.show_loading = false;
        console.log(error);
        this.cdr.markForCheck();
      });
  }

  // 🟢 4. تحديث دالة الطباعة لتتوافق مع Capacitor/متصفح
  async printReport(i) {
    let data = {
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      school_id: this.userDetails.details.school_id,
      report_number: i + 1
    };

    try {
      const res = await this.dataProvider.run(() => this.reportsApi.printWarning(data));
      if (res && res.url) {
        let htmlContent = res.url.replace(/(\r\n|\n|\r)/gm, '');

        if (this.platform.is('cordova') || this.platform.is('capacitor')) {
          let options: PrintOptions = { orientation: 'portrait' };
          this.printer.print(htmlContent, options).then(
            (onSuccess: any) => {
              console.log('تم فتح نافذة الطباعة بنجاح', onSuccess);
            },
            (e: any) => {
              console.log('تعذرت الطباعة، سيتم الفتح في المتصفح', e);
              this.openHtmlInBrowser(htmlContent);
            }
          );
        } else {
          this.openHtmlInBrowser(htmlContent);
        }
      } else {
        this.dataProvider.showToast('تعذر جلب التقرير من السيرفر');
      }
    } catch (error) {
      this.dataProvider.showToast('حدث خطأ في الاتصال أثناء جلب التقرير');
      console.log(error);
    }
  }

  // 🟢 دالة مساعدة لطباعة التقرير في المتصفح كـ Fallback آمن
  openHtmlInBrowser(htmlContent: string) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 1000);
    } else {
      this.dataProvider.showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) لعرض التقرير');
    }
  }

  // 🟢 جلب الاستدعاءات
  getStudentCallOfReports() {
    let data = {
      user_no: this.userDetails.details.user_no,
      student_id: this.userDetails.details.stu_id,
      school_id: this.userDetails.details.school_id
    };
    this.reportsApi
      .GetAllCallOfStudentReport(data)
      .then(res => {
        this.callOfStudentsReport = res.data;
        this.cdr.markForCheck();
      })
      .catch(error => {
        console.log(error);
        this.cdr.markForCheck();
      });
    this.GetStudentPledgesReport();
  }

  // 🟢 جلب التعهدات
  GetStudentPledgesReport() {
    let data = {
      user_no: this.userDetails.details.user_no,
      student_id: this.userDetails.details.stu_id,
      school_id: this.userDetails.details.school_id
    };
    this.reportsApi
      .GetStudentPledgesReport(data)
      .then(res => {
        this.AllStudentPledgesReports = res.data;
        this.cdr.markForCheck();
      })
      .catch(error => {
        console.log(error);
        this.cdr.markForCheck();
      });
  }
}
