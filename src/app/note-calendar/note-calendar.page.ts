import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';
import { ModalController, Platform, IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { NgIf, NgFor, DatePipe } from '@angular/common';

@Component({
    selector: 'app-note-calendar',
    templateUrl: './note-calendar.page.html',
    styleUrls: ['./note-calendar.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, DatePipe]
})
export class NoteCalendarPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  userDetails: any = {};
  note: any = [];
  lang: any;
  state: any;
  fromPage: any;
  stateCids: any = [];

  // المتغيرات الخاصة بالتقويم
  highlightedDates: any[] = [];
  dates: any[] = []; // مصفوفة لتواريخ الطباعة

  // المتغير لعرض الملاحظات في الواجهة
  selectedNotes: any[] = [];

  viewTitle: string = 'تقويم الامتحانات';

  constructor(
    private modalctrl: ModalController,
    private router: Router,
    private route: ActivatedRoute,
    public dataProvider: DataService,
    private printer: Printer,
    private translate: TranslateService,
    public platform: Platform,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private cdr: ChangeDetectorRef
  ) {
    // 🟢 التقاط البيانات متزامناً
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.note = navigation.extras.state['note'] || [];
      this.state = navigation.extras.state['state'];
      this.fromPage = navigation.extras.state['page'];
    }

    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  // 🟢 تأمين البيانات من الضياع وجلب المستخدم بأمان
  async ngOnInit() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      // تأمين بيانات التقويم في حال تم عمل Refresh
      if (this.note && this.note.length > 0) {
        await this.storageSr.set('calendarContext', {
          note: this.note,
          state: this.state,
          fromPage: this.fromPage
        });
      } else {
        let savedData = await this.storageSr.get('calendarContext');
        if (savedData) {
          this.note = savedData.note;
          this.state = savedData.state;
          this.fromPage = savedData.fromPage;
        }
      }

      this.setupHighlightedDates();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  // تلوين الأيام التي تحتوي على ملاحظات امتحانات
  setupHighlightedDates() {
    let highlights: any[] = [];
    if (this.note && this.note.length > 0) {
      this.note.forEach(element => {
        if (element.send_to == 'exam' && element.examNoteDate) {
          let d = new Date(element.examNoteDate);

          // تأمين من التواريخ الخاطئة Invalid Date
          if (!isNaN(d.getTime())) {
            let dateString = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

            highlights.push({
              date: dateString,
              textColor: '#ffffff',
              backgroundColor: '#ff7043' // 🟢 تم تغيير اللون ليتوافق مع نسق Lineone (Indigo)
            });
          }
        }
      });
    }
    this.highlightedDates = highlights;
  }

  // الدالة المحدثة: تقوم بتحديث تواريخ الطباعة + جلب ملاحظات الأيام المحددة
  onDateChange(event: any) {
    let val = event.detail.value;

    // تصفير المصفوفات عند كل تغيير
    this.dates = [];
    this.selectedNotes = [];
    let selectedIsoDates: string[] = []; // مصفوفة مساعدة للمقارنة

    if (Array.isArray(val)) {
      val.forEach(isoDate => {
        this.dates.push(new Date(isoDate).toDateString());
        selectedIsoDates.push(isoDate.split('T')[0]); // استخراج (YYYY-MM-DD)
      });
    } else if (val) {
      this.dates.push(new Date(val).toDateString());
      selectedIsoDates.push(val.split('T')[0]);
    }

    // فلترة وعرض الملاحظات التي تتطابق تواريخها مع الأيام المحددة
    if (this.note && this.note.length > 0) {
      this.selectedNotes = this.note.filter((n: any) => {
        if (n.examNoteDate) {
          let d = new Date(n.examNoteDate);
          if (!isNaN(d.getTime())) {
            let dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
            return selectedIsoDates.includes(dateStr);
          }
        }
        return false;
      });
    }
  }

  // ================= دالة الطباعة ================
  printReport() {
    if (!this.dates || this.dates.length === 0) {
      this.dataProvider.showToast(this.lang?.select_date || 'الرجاء تحديد تاريخ للطباعة');
      return;
    }

    this.stateCids = [];
    if (this.fromPage == 'student-note') {
      if (this.note && this.note.length > 0 && this.note[0].cid) {
        this.stateCids.push(this.note[0].cid);
      }
    } else {
      if (this.state && this.state.cid) {
        this.stateCids = this.state.cid;
      } else if (this.state && Array.isArray(this.state)) {
        this.state.forEach(st => {
          if (st.cid) this.stateCids.push(st.cid);
        });
      }
    }

    let data = {
      course_id: Array.isArray(this.stateCids) ? JSON.stringify(this.stateCids) : JSON.stringify([this.stateCids]),
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      title: this.viewTitle,
      dates: JSON.stringify(this.dates),
      is_multi: Array.isArray(this.stateCids) && this.stateCids.length > 1 ? true : false
    };

    this.dataProvider
      .run(() => this.dataProvider.printAllClassNotes(data))
      .then(res => {
        if (res && res.data) {
          let printContent = res.data.replace(/(\r\n|\n|\r)/gm, '');
          if (this.platform.is('cordova') || this.platform.is('capacitor')) {
            let options: PrintOptions = { orientation: 'portrait' };
            this.printer.print(printContent, options).then(
              (onSuccess: any) => {},
              (e: any) => {
                this.dataProvider.showToast('تعذرت الطباعة من الجهاز');
              }
            );
          } else {
            let printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(printContent);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => printWindow.print(), 500);
            } else {
              this.dataProvider.showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة');
            }
          }
        }
      })
      .catch(er => {
        this.dataProvider.showToast(er);
      });
  }
}
