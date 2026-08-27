import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';
import { ModalController, Platform, IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';
import { NotesApiService } from '../service/notes-api/notes-api.service';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-note-calendar',
  templateUrl: './note-calendar.page.html',
  styleUrls: ['./note-calendar.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, DatePipe]
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

  // 🟢 اختيار متعدد للأيام يُدار يدوياً (وليس عبر multiple الخاصة بـ ion-datetime):
  // خاصية multiple في ion-datetime لديها خلل معروف وغير مخطط لإصلاحه في
  // Ionic (github.com/ionic-team/ionic-framework/issues/28859) يجعل التقويم
  // يقفز لشهر مختلف عند اختيار يوم في شهر غير الشهر الأول المختار. الحل هنا
  // هو استخدام ion-datetime بوضع اختيار مفرد (بدون multiple) وربط كل نقرة
  // بتبديل حالة اليوم في هذه المجموعة بدلاً من الاعتماد على قيمتها الداخلية.
  private selectedDates = new Set<string>(); // YYYY-MM-DD
  private noteHighlights: any[] = []; // أيام الملاحظات المحفوظة (برتقالي)

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
    private cdr: ChangeDetectorRef,
    private notesApi: NotesApiService
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

  private toIsoDate(d: Date): string {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  // تلوين الأيام التي تحتوي على ملاحظات امتحانات
  setupHighlightedDates() {
    let highlights: any[] = [];
    if (this.note && this.note.length > 0) {
      this.note.forEach((element: any) => {
        if (element.send_to == 'exam' && element.examNoteDate) {
          let d = new Date(element.examNoteDate);

          // تأمين من التواريخ الخاطئة Invalid Date
          if (!isNaN(d.getTime())) {
            highlights.push({
              date: this.toIsoDate(d),
              textColor: '#ffffff',
              backgroundColor: '#ff7043'
            });
          }
        }
      });
    }
    this.noteHighlights = highlights;
    this.updateHighlightedDates();
  }

  // 🟢 دمج تلوين أيام الملاحظات المحفوظة (برتقالي) مع الأيام المختارة حالياً
  // (نيلي/indigo) -- الأيام المختارة تأخذ الأولوية البصرية عند التطابق.
  private updateHighlightedDates() {
    const selectedHighlights = Array.from(this.selectedDates).map(iso => ({
      date: iso,
      textColor: '#ffffff',
      backgroundColor: '#4f46e5'
    }));
    const noteHighlightsExcludingSelected = this.noteHighlights.filter(h => !this.selectedDates.has(h.date));
    this.highlightedDates = [...noteHighlightsExcludingSelected, ...selectedHighlights];
    this.cdr.markForCheck();
  }

  // الدالة المحدثة: تبديل حالة اليوم المنقور عليه (اختيار/إلغاء اختيار)
  // ثم تحديث تواريخ الطباعة وملاحظات الأيام المحددة
  onDateChange(event: any) {
    let val = event.detail.value;
    if (!val) return;

    let clickedDate = new Date(val);
    if (isNaN(clickedDate.getTime())) return;

    let iso = this.toIsoDate(clickedDate);
    if (this.selectedDates.has(iso)) {
      this.selectedDates.delete(iso);
    } else {
      this.selectedDates.add(iso);
    }

    this.dates = Array.from(this.selectedDates).map(d => new Date(d).toDateString());

    // فلترة وعرض الملاحظات التي تتطابق تواريخها مع الأيام المحددة
    this.selectedNotes =
      this.note && this.note.length > 0
        ? this.note.filter((n: any) => {
            if (n.examNoteDate) {
              let d = new Date(n.examNoteDate);
              if (!isNaN(d.getTime())) {
                return this.selectedDates.has(this.toIsoDate(d));
              }
            }
            return false;
          })
        : [];

    this.updateHighlightedDates();
  }

  // 🟢 دفاعي: التقويم يُبقي عدة حاويات شهر في الـ DOM لدعم السحب بين الأشهر،
  // ويُخفي غير الظاهر منها عبر aria-hidden. إذا احتفظ زر يوم بالتركيز (focus)
  // لحظة إخفاء حاويته، يصدر المتصفح تحذير "Blocked aria-hidden on an element
  // because its descendant retained focus". إفراغ التركيز بعد أي تفاعل مع
  // التقويم يمنع هذا التحذير بغض النظر عن أي عنصر بالضبط تسبب فيه.
  onCalendarInteraction() {
    setTimeout(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body) {
        active.blur();
      }
    });
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
      is_multi: Array.isArray(this.stateCids) && this.stateCids.length > 1 ? true : false,
      session_id: this.userDetails.session_id
    };

    this.dataProvider
      .run(() => this.notesApi.printAllClassNotes(data))
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
