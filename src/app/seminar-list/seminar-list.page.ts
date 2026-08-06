import { Component, OnInit, NgZone, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Router, ActivatedRoute } from '@angular/router';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';
import domtoimage from 'dom-to-image';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { HolidaysApiService } from '../service/holidays-api/holidays-api.service';

@Component({
  selector: 'app-seminar-list',
  templateUrl: './seminar-list.page.html',
  styleUrls: ['./seminar-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class SeminarListPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  navData: any;
  lang: any;
  userDetails: any;
  userType: any;
  holidayString: any = '';
  currentEvents = <any>[];
  isHoliday: boolean = false;
  seminarList = <any>[];

  // 🌟 متغيرات التقويم
  calendarDate: string = '';
  dateSelected: any;
  showCalenderModal: boolean = false;

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    public network: Network,
    private printer: Printer,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    public platform: Platform,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين الجديدة
    private holidaysApi: HolidaysApiService,
    private cdr: ChangeDetectorRef
  ) {
    // 🟢 3. استخراج البيانات من الـ Router بشكل متزامن قبل ضياعها
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.navData = navigation.extras.state['seminar'];
      console.log(this.navData);
    }

    this.dateSelected = new Date();
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
  }

  // 🟢 4. جعل الدالة async للتخلص من localStorage واستخدام القراءة الآمنة
  async ngOnInit() {
    // 🌟 توليد التاريخ المحلي الصافي YYYY-MM-DD لمنع قفز الأشهر
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    this.calendarDate = `${year}-${month}-${day}`;
    this.dateSelected = new Date(this.calendarDate);

    // 🟢 حماية بيانات الـ Router من الضياع عند الـ Refresh
    if (this.navData) {
      await this.storageSr.set('currentSeminarData', this.navData);
    } else {
      let savedData = await this.storageSr.get('currentSeminarData');
      if (savedData) {
        this.navData = savedData;
      }
    }

    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;

      let data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id,
        session_id: this.userDetails.session_id
      };

      this.holidaysApi
        .getHolidays(data)
        .then(response => {
          if (response) {
            this.holidayString = response.holiday_string || '';

            const year = this.dateSelected.getFullYear();
            const month = String(this.dateSelected.getMonth() + 1).padStart(2, '0');
            const day = String(this.dateSelected.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            this.isHoliday = this.holidayString.includes(formattedDate);
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.hideLoading();
          console.error('API Error:', error);
          this.dataProvider.errorALertMessage(error);
          this.cdr.markForCheck();
        });

      this.getClasses();
    } else {
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  getClasses(loader: boolean = true) {
    if (loader) this.dataProvider.showLoading();

    let studentData = {
      date: this.dataProvider.getFormatedDate(this.dateSelected),
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      seminar_no: this.navData,
      school_id: this.userDetails.details.school_id
    };

    this.dataProvider
      .getSeminarClassList(studentData)
      .then(res => {
        if (loader) this.dataProvider.hideLoading();

        if (res?.session) {
          console.log('seminar class', res.data);
          this.seminarList = res.data;
        } else {
          this.seminarList = [];
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        if (loader) this.dataProvider.hideLoading();
        console.error('API Error:', error);
        this.cdr.markForCheck();
      });
  }

  onDaySelect(event: any) {
    if (event && event.detail && event.detail.value) {
      let selectedIsoDate = event.detail.value;
      let dateString = selectedIsoDate.split('T')[0];
      let dateObj = new Date(selectedIsoDate);
      let currentDate = new Date();

      dateObj.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      if (this.holidayString && this.holidayString.indexOf(dateString) > -1) {
        this.dataProvider.showToast(this.lang.holiday || 'هذا اليوم عطلة');
        return;
      }

      if (dateObj.getTime() <= currentDate.getTime()) {
        this.calendarDate = dateString;
        this.dateSelected = dateObj;

        this.hideCalenderModal();
        this.getClasses();
      } else {
        this.dataProvider.showToast(this.lang.future_date || 'لا يمكن اختيار تاريخ مستقبلي');
      }
    }
  }

  openCalenderModal() {
    this.showCalenderModal = true;
  }

  hideCalenderModal() {
    this.showCalenderModal = false;
  }

  // 🟢 5. تأمين دالة الطباعة ودعم المتصفح
  printReport() {
    const printSection = document.getElementById('printSection');

    if (!printSection) {
      this.dataProvider.showToast('تعذر العثور على محتوى للطباعة');
      return;
    }

    this.dataProvider
      .run<string>(() => domtoimage.toPng(printSection))
      .then(dataUrl => {
        if (this.platform.is('cordova') || this.platform.is('capacitor')) {
          let printUrl = dataUrl.replace('data:image/png;base64,', 'base64://');
          let options: PrintOptions = { orientation: 'portrait' };

          this.printer.print(printUrl.replace(/(\r\n|\n|\r)/gm, ''), options).then(
            (onSuccess: any) => console.log('printer.print', onSuccess),
            (e: any) => {
              console.log('printer.print error', e);
              this.dataProvider.showToast('تعذرت الطباعة من الجهاز');
            }
          );
        } else {
          // دعم طباعة المتصفح
          let printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
            <html>
              <head>
                <title>طباعة التقرير</title>
                <style>
                  body { margin: 0; padding: 20px; text-align: center; }
                  img { max-width: 100%; height: auto; }
                </style>
              </head>
              <body>
                <img src="${dataUrl}" />
              </body>
            </html>
          `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
          } else {
            this.dataProvider.showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة');
          }
        }
      })
      .catch(error => {
        console.error('oops, something went wrong!', error);
        this.dataProvider.showToast('تعذر إنشاء صورة للطباعة');
      });
  }

  checkDateSelected = (date: Date) => date.toDateString() === this.dateSelected.toDateString();
  checkCurrentDate = (date: Date) => date.toDateString() === new Date().toDateString();
}
