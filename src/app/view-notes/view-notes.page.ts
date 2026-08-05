import { Component, OnInit, NgZone, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { DocumentService } from '../service/document/document.service';
// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { NotesApiService } from '../service/notes-api/notes-api.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';
import { UserType } from '../constants/user-type';

@Component({
  selector: 'app-view-notes',
  templateUrl: './view-notes.page.html',
  styleUrls: ['./view-notes.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewNotesPage implements OnInit {
  trackByIndex(index: number): number { return index; }
  readonly UserType = UserType;
  private destroyRef = inject(DestroyRef);
  data: any = [];
  state: any;
  lang: any;
  userDetails: any;
  userType: any;
  navData: any;
  notes: any;
  dataAll: any = [];

  showDeleteModal: boolean = false;
  noteToDelete: any = null;
  noteIndexToDelete: number = -1;

  constructor(public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    private documentService: DocumentService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private photoViewer: PhotoViewer,
    public zone: NgZone,
    private router: Router,
    public modalController: ModalController,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين الجديدة
    private notesApi: NotesApiService,
    private userManagementApi: UserManagementApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (this.router.getCurrentNavigation() && this.router.getCurrentNavigation().extras.state) {
        if (!this.router.getCurrentNavigation().extras.state['isUpdated']) {
          this.navData = this.router.getCurrentNavigation().extras.state['course'];
          this.state = this.router.getCurrentNavigation().extras.state;
        } else {
          // 🟢 3. استدعاء الدالة غير المتزامنة بشكل صحيح
          this.initializeData(false);
        }
      }
      this.cdr.markForCheck();
    });
  }

  // 🟢 4. تفريغ ngOnInit واستخدام دالة مساعدة لدعم async/await
  ngOnInit() {
     this.initializeData();
  }

  // 🟢 5. جلب بيانات المستخدم بشكل آمن (بدون localStorage)
  async initializeData(loader: boolean = true) {
    if (this.router.getCurrentNavigation()?.extras?.state) {
        this.navData = this.router.getCurrentNavigation().extras.state['course'];
    }

    let userLoggedIn = await this.storageSr.get("userloggedin"); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.getAllClassNotes(loader);
    } else {
      this.dataProvider.hideLoading();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  showPhoto(url) {
    console.log(url);
    this.photoViewer.show(url);
  }

  addNotes() {
    const navigation: NavigationExtras = {
      state: {
        state: this.state,
        data: this.data
      }
    };
    this.zone.run(() => {
      this.router.navigate(['add-notes'], navigation);
    });
  }

  openPdf(pdf) {
    window.open(pdf, '_system');
  }

  deleteNoteAlert(note, index) {
    this.noteToDelete = note;
    this.noteIndexToDelete = index;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.noteToDelete = null;
    this.noteIndexToDelete = -1;
  }

  confirmDelete() {
    this.showDeleteModal = false;
    if (this.noteToDelete) {
      let deleteData = {
        note_id: this.noteToDelete.notes_id
      };

      this.dataAll.splice(this.noteIndexToDelete, 1);
      this.data.splice(this.noteIndexToDelete, 1);

      this.dataProvider.run(() => this.userManagementApi.deleteNote(deleteData)).then((res: any) => {
        this.dataProvider.showToast(res.msg);
        console.log("delete note res::::", res);
        this.getAllClassNotes(false);
      }).catch(error => {
        console.log(error);
        this.cdr.markForCheck();
      });
    }
  }

  getAllClassNotes(loader: boolean = true) {
    let course = this.navData;
    if (!course) return;

    let studentData = {
      "user_no": this.userDetails.details.user_no,
      "session_id": this.userDetails.session_id,
      "course_id": course.cid,
      "school_id": this.userDetails.details.school_id,
    }
    this.dataAll = [];
    if (loader) this.dataProvider.showLoading();
    this.notesApi.getAllClassNotes(studentData).then(res => {
      if (loader) this.dataProvider.hideLoading();
      if (res) {
        this.data = res;
      }
      this.cdr.markForCheck();
    }).catch(error => {
      if (loader) this.dataProvider.hideLoading();
      this.cdr.markForCheck();
    });
  }

  openCalModal() {
    const navigation: NavigationExtras = {
      state: {
        note: this.data,
        state: this.navData
      }
    };
    this.router.navigate(['note-calendar'], navigation);
  }

}