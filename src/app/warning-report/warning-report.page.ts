import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, AlertController, ModalController, Platform } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-warning-report',
  templateUrl: './warning-report.page.html',
  styleUrls: ['./warning-report.page.scss'],
})
export class WarningReportPage implements OnInit {
  userDetails: any = {};
  reportData: any = [];
  reportType: any = 'callOfParentAndPledges';
  
  callOfStudentsReport: any = [];
  AllStudentPledgesReports: any = [];
  
  show_loading: boolean = false;

  constructor(public navCtrl: NavController,
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
              private storageSr: StorageService // 🟢 2. حقن خدمة التخزين الجديدة
             ) {
  }

  ngOnInit() {}

  // 🟢 3. التخلص من localStorage واستخدام async/await
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get("userloggedin"); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.getAllWarning();
      this.getStudentCallOfReports();
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
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
      "user_no": this.userDetails.details.user_no,
      "session_id": this.userDetails.session_id,
      "school_id": this.userDetails.details.school_id,
    };
    
    if (loader) {
      this.show_loading = true;
    }
    
    this.dataProvider.getAllWarning(data).then(res => { 
      this.show_loading = false;
      if (res) {
        this.reportData = res;
      }
    }).catch(error => {
      this.show_loading = false;
      console.log(error);
    });
  }

  // 🟢 4. تحديث دالة الطباعة لتتوافق مع Capacitor/متصفح
  printReport(i) {
    let data = {
      "user_no": this.userDetails.details.user_no,
      "session_id": this.userDetails.session_id,
      "school_id": this.userDetails.details.school_id,
      "report_number": i + 1
    };
    
    this.dataProvider.showLoading();
    
    this.dataProvider.printWarning(data).then(res => {
      this.dataProvider.hideLoading();
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
    }).catch(error => {
      this.dataProvider.hideLoading();
      this.dataProvider.showToast('حدث خطأ في الاتصال أثناء جلب التقرير');
      console.log(error);
    });
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
      "user_no": this.userDetails.details.user_no,
      "student_id": this.userDetails.details.stu_id,
      "school_id": this.userDetails.details.school_id
    };
    this.dataProvider.GetAllCallOfStudentReport(data).then(res => {
      this.callOfStudentsReport = res.data;
    }).catch(error => {
      console.log(error);
    });
    this.GetStudentPledgesReport();
  }

  // 🟢 جلب التعهدات
  GetStudentPledgesReport() {
    let data = {
      "user_no": this.userDetails.details.user_no,
      "student_id": this.userDetails.details.stu_id,
      "school_id": this.userDetails.details.school_id
    };
    this.dataProvider.GetStudentPledgesReport(data).then(res => {
      this.AllStudentPledgesReports = res.data;
    }).catch(error => {
      console.log(error);
    });
  }
}