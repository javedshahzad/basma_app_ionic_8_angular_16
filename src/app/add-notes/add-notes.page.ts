import { Component, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { DataService } from '../service/data/data.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; // 🟢 استخدام مكتبة كاباسيتور الحديثة والآمنة
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PipesModule } from '../pipes/pipes.module';
import { environment } from '../../environments/environment';
import { IonicSelectableComponent } from 'ionic-selectable';
import dayjs from 'dayjs';
import { StorageService } from '../service/storage.service';
import { NotesApiService } from '../service/notes-api/notes-api.service';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';
import { Student } from '../model/student.model';

interface NoteFormData {
  sendTo: string;
  description: string;
  studentIds: (string | number)[];
  ticketImage: string;
  pdf: string | File;
  user_no: string | number;
  school_id: string | number;
  classId: string | number;
  type: string;
  examNoteDate: string;
  semno: string | number;
  seminir_no?: string | number;
}

@Component({
  selector: 'app-add-notes',
  templateUrl: './add-notes.page.html',
  styleUrls: ['./add-notes.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule, IonicSelectableComponent, PipesModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddNotesPage {
  trackByIndex(index: number): number {
    return index;
  }
  private destroyRef = inject(DestroyRef);
  notes: NoteFormData = {
    sendTo: '',
    description: '',
    studentIds: [],
    ticketImage: '',
    pdf: '',
    user_no: '',
    school_id: '',
    classId: '',
    type: '',
    examNoteDate: '',
    semno: ''
  };

  lang: Record<string, string> = {};
  userDetails: LoggedInUser = {};
  ticketImage: string = ''; // سنخزن هنا الـ Base64 الصافي
  class_id: string | number;
  students: Student[];
  mediaType: string;
  state: unknown;
  data: unknown;
  selectedStudent: Student[];
  formdata: FormData = new FormData();
  uploadStaus: number | false;
  studentsId: (string | number)[] = [];
  status = '';
  seminir_no: string | number = '';

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after
  // ionViewWillEnter()'s `if (userData)` guard has already populated it —
  // the non-null assertion documents that invariant once instead of at
  // every access site.
  get userInfo(): UserDetails {
    return this.userDetails.details!;
  }

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    private route: ActivatedRoute,
    private router: Router,
    public alertCtrl: AlertController,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private notesApi: NotesApiService
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const navigationState = this.router.getCurrentNavigation()?.extras?.state;
      if (navigationState) {
        this.class_id = navigationState.state.course_id;
        this.students = navigationState.state.students;
        this.state = navigationState.state;
        this.data = navigationState.data;
      }
      this.cdr.markForCheck();
    });

    this.dataProvider.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      // events also carries non-numeric payloads (see DataService.events);
      // this page only cares about upload-progress percentages.
      if (typeof res === 'number') {
        this.uploadStaus = res;
      }
      this.cdr.markForCheck();
    });

    this.notes.examNoteDate = dayjs(new Date()).toISOString();
  }

  getSeminars() {
    return Array(parseInt(localStorage.getItem('class_total_sem') || '0'));
  }

  async ionViewWillEnter() {
    let userData = await this.storageSr.get('userloggedin');
    if (userData) {
      this.userDetails = userData;
    }
    this.cdr.markForCheck();
  }

  sendNotes() {
    if (!this.notes.sendTo) {
      this.dataProvider.showToast(this.lang.select_type);
    } else {
      if (this.notes.sendTo === 'exam') {
        if (!this.notes.seminir_no) return;
        if (this.notes.examNoteDate === '') return;
      }

      this.notes.classId = this.class_id;
      this.notes.user_no = this.userInfo.user_no!;
      this.notes.school_id = this.userInfo.school_id!;

      let media: string | File;
      if (this.notes.ticketImage && this.notes.ticketImage != '') {
        media = this.notes.ticketImage;
      } else {
        media = this.notes.pdf;
      }

      if (!media) {
        this.startUpload(this.ticketImage);
      } else {
        this.startUpload(this.ticketImage);
      }
    }
  }

  async takePicture() {
    const alert = await this.alertCtrl.create({
      header: this.lang.image_option,
      buttons: [
        {
          text: this.lang.camera,
          handler: () => {
            this.openCamera(CameraSource.Camera);
          }
        },
        {
          text: this.lang.gallery,
          handler: () => {
            this.openCamera(CameraSource.Photos);
          }
        },
        { text: this.lang.cancel || 'إلغاء', role: 'cancel', cssClass: 'text-rose-500 font-bold' }
      ]
    });
    await alert.present();
  }

  // 🟢 استبدال الكاميرا القديمة بالمكتبة الحديثة
  async openCamera(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        resultType: CameraResultType.Base64,
        source: source,
        correctOrientation: true
      });

      if (image && image.base64String) {
        this.notes.pdf = '';
        this.notes.ticketImage = 'data:image/jpeg;base64,' + image.base64String;
        this.ticketImage = image.base64String;
        this.mediaType = 'image/jpeg';
      }
      this.cdr.markForCheck();
    } catch (error) {
      console.log('User cancelled or error', error);
      this.cdr.markForCheck();
    }
  }

  async uploadPdf() {
    document.getElementById('myFileInput')?.click();
  }

  portChange(event: any) {
    this.notes.studentIds = [];
    this.studentsId = [];
    this.selectedStudent.forEach(res => {
      this.notes.studentIds.push(res.sid!);
      this.studentsId.push(res.sid!);
    });
  }

  onSelectFiles(ev: Event) {
    const target = ev?.target as HTMLInputElement | undefined;
    const files = target?.files;
    if (!files || files.length === 0) return;

    let ext = files[0].name.split('.').reverse()[0];
    if (ext == 'pdf' || ext == 'PDF') {
      this.notes.pdf = files[0];
      this.mediaType = 'application/pdf';
      this.notes.ticketImage = '';
      this.ticketImage = '';
    } else {
      this.dataProvider.showToast(this.lang.file_format_error);
    }
  }

  // 🟢 رفع الملفات عبر FormData بشكل آمن وتوحيد الطريقة للـ PDF والصور
  uploadPdfToServer(imgBlob?: Blob, fileName?: string) {
    this.formdata = new FormData(); // تصفير الـ FormData لتجنب تكرار البيانات
    this.formdata.append('sendTo', this.notes.sendTo);
    this.formdata.append('description', this.notes.description);
    this.formdata.append('studentIds', (this.notes.studentIds || []).join('#'));

    if (this.notes.ticketImage) {
      this.formdata.append('ticketImage', this.notes.ticketImage);
    }

    this.formdata.append('user_no', String(this.userInfo.user_no));
    this.formdata.append('classId', String(this.class_id));
    this.formdata.append('school_id', String(this.userInfo.school_id));
    this.formdata.append('type', this.mediaType);
    this.formdata.append('examNoteDate', this.notes.examNoteDate);
    this.formdata.append('seminir_no', String(this.notes.seminir_no));

    if (imgBlob) {
      this.formdata.append('file', imgBlob, fileName);
    } else if (this.notes.pdf) {
      this.formdata.append('file', this.notes.pdf);
    }

    this.dataProvider.showLoading();
    this.notesApi.createclassNotes(this.formdata).subscribe(
      res => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(this.lang.note_created);
        const navigation: NavigationExtras = {
          state: { isUpdated: true, course: { cid: this.class_id } }
        };
        this.router.navigate(['view-notes'], navigation);
      },
      e => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(this.lang.usnexpectedError);
        this.uploadStaus = false;
        this.cdr.markForCheck();
      }
    );
  }

  startUpload(imgBase64: string) {
    if (imgBase64 && imgBase64 !== '') {
      this.readFile(imgBase64);
    } else {
      this.uploadPdfToServer();
    }
  }

  readFile(fileBase64: string) {
    const blob = this.dataProvider.dataURItoBlob('data:image/jpeg;base64,' + fileBase64);
    this.uploadPdfToServer(blob, this.dataProvider.generateRandomFileName('jpg'));
  }

}
