import {
  Component,
  OnInit,
  NgZone,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController, Platform, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { Browser } from '@capacitor/browser';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { NotesApiService } from '../service/notes-api/notes-api.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-student-notes',
    templateUrl: './student-notes.page.html',
    styleUrls: ['./student-notes.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, TranslatePipe]
})
export class StudentNotesPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  private destroyRef = inject(DestroyRef);
  lang: any;
  navData: any;
  category: any;
  userDetails: any;
  userType: any;
  notes: any;
  noData = false;

  // --- متغيرات عارض الصور المدمج ---
  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    public zone: NgZone,
    private router: Router,
    private platform: Platform, // 🟢 حقن Platform للتحقق من البيئة
    public modalCtrl: ModalController,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private notesApi: NotesApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.changeUser) {
        this.ionViewWillEnter();
      }
    });

    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(resq => {
      this.translate.get('alertmessages').subscribe(res => {
        this.lang = res;
        this.cdr.markForCheck();
      });
    });
  }

  ngOnInit() {}

  // 🟢 دوال عرض الصور
  showPhoto(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => {
      this.viewImageUrl = '';
    }, 300);
  }

  // 🟢 3. جعل الدالة async لاستخدام StorageService الآمن بدلاً من localStorage
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.navData = this.userDetails.details;
      this.userType = this.userDetails.details.user_type;
      this.getClassNotes();
    } else {
      this.dataProvider.hideLoading();
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  doRefresh(event) {
    this.getClassNotes();
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  getClassNotes() {
    let data = {
      student_id: this.userDetails.details.stu_id,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };
    this.notesApi
      .getClassNotes(data)
      .then(res => {
        this.notes = res;
        if (this.notes && this.notes.length > 0) {
          this.noData = false;
        } else {
          this.noData = true;
        }
        this.cdr.markForCheck();
      })
      .catch(Error => {
        console.log(Error);
        this.cdr.markForCheck();
      });
  }

  // 🟢 4. إصلاح فتح الـ PDF ليواكب تحديثات الأجهزة الحديثة و Capacitor
  async openPdf(pdf: string) {
    if (this.platform.is('capacitor') || this.platform.is('cordova')) {
      await Browser.open({ url: pdf });
    } else {
      window.open(pdf, '_system');
    }
  }

  openCalModal() {
    const navigation: NavigationExtras = {
      state: {
        note: this.notes,
        state: this.navData,
        page: 'student-note'
      }
    };
    this.router.navigate(['note-calendar'], navigation);
  }
}
