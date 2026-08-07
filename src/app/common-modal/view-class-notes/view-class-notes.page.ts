import { Component, OnInit, Input, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../../service/auth/auth.service';
import { DataService } from '../../service/data/data.service';
import { DatabaseService } from '../../service/database/database.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { CreateClassPage } from '../../create-class/create-class.page';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { DocumentService } from '../../service/document/document.service';
import { NotesApiService } from '../../service/notes-api/notes-api.service';
import { StorageService } from '../../service/storage.service';
import { NgIf, NgFor } from '@angular/common';
import { DateFormatPipe } from '../../pipes/date-format/date-format.pipe';
@Component({
    selector: 'app-view-class-notes',
    templateUrl: './view-class-notes.page.html',
    styleUrls: ['./view-class-notes.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, DateFormatPipe, TranslatePipe]
})
export class ViewClassNotesPage implements OnInit {
  private destroyRef = inject(DestroyRef);

  trackByIndex(index: number): number {
    return index;
  }
  @Input() data;
  @Input() state;
  lang: any;
  userDetails: any;
  userType: any;
  navData: any;
  notes: any;

  constructor(
    public navCtrl: NavController,
    // public app: App,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    //public events: Events,
    private documentService: DocumentService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private photoViewer: PhotoViewer,
    public zone: NgZone,
    private router: Router,
    public modalController: ModalController,
    private notesApi: NotesApiService,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.navData = navigation.extras.state['course'];
        console.log(this.navData);
      }
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    console.log('moda', this.data);
  }
  cloeModal() {
    this.modalController.dismiss();
  }
  showPhoto(url) {
    console.log(url);
    this.photoViewer.show(url);
  }
  async ionViewWillEnter() {
    const userData = await this.storageSr.get('userloggedin');
    if (userData) {
      this.userDetails = userData;
      this.userType = this.userDetails.details.user_type;
    }
    this.cdr.markForCheck();
  }

  addNotes() {
    this.cloeModal();
    const navigation: NavigationExtras = {
      state: {
        state: this.state,
        data: this.data
      }
    };
    //console.log(navigation);
    this.zone.run(() => {
      this.router.navigate(['add-notes'], navigation);
    });
    //this.router.navigate(['add-notes']);
  }

  openPdf(pdf) {
    //  window.open(pdf,'_blank')
    // this.documentService.openPdf(pdf,true);
    window.open(pdf, '_system');
  }
  async deleteNote(note) {
    const alert = await this.alertCtrl.create({
      header: this.lang.delete_note,
      backdropDismiss: true,
      mode: 'ios',
      buttons: [
        {
          text: this.lang.delete,
          handler: () => {
            console.log(note);
            let data = {
              note_id: note.notes_id
            };
            this.authProvider.deleteNote(data);
            this.cloeModal();
          }
        },
        {
          text: this.lang.alert_btn_cancel_text,
          handler: () => {}
        }
      ]
    });
    await alert.present();
  }

  getAllClassNotes() {
    let course = this.navData;
    let studentData = {
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      course_id: course.cid,
      school_id: this.userDetails.details.school_id
    };
    this.notesApi
      .getAllClassNotes(studentData)
      .then(res => {
        console.log(res);
        if (res) {
          // this.dataProvider.viewNotes(res);
          this.notes = res;
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        console.log(error);
        this.cdr.markForCheck();
      });
  }
}
