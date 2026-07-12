import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-add-notes',
  templateUrl: './add-notes.page.html',
  styleUrls: ['./add-notes.page.scss'],
  standalone: true, 
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule, 
    TranslateModule, 
    IonicSelectableComponent,
    PipesModule
  ]
})
export class AddNotesPage implements OnInit {
  notes: any = {
    sendTo: '',
    description: '',
    studentIds: [],
    ticketImage: '',
    pdf: '',
    user_no: '',
    school_id: '',
    classId: '',
    type: '',
    examNoteDate:'',
    semno: ''
  };
  
  lang: any = {};
  userDetails: any = {};
  ticketImage: string = ''; // سنخزن هنا الـ Base64 الصافي
  class_id: any;
  students: any;
  mediaType: any;
  state: any;
  data: any;
  selectedStudent: any;
  formdata: any = new FormData();
  uploadStaus: any;
  studentsId: any = [];
  status = '';
  seminir_no: any = '';

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    private route: ActivatedRoute,
    private router: Router,
    public alertCtrl: AlertController
  ) {
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
    });

    this.route.queryParams.subscribe(params => {
      if (this.router.getCurrentNavigation()?.extras?.state) {
        this.class_id = this.router.getCurrentNavigation().extras.state.state.course_id;
        this.students = this.router.getCurrentNavigation().extras.state.state.students;
        this.state = this.router.getCurrentNavigation().extras.state.state;
        this.data = this.router.getCurrentNavigation().extras.state.data;
      }
    });

    this.dataProvider.events.subscribe(res => {
      this.uploadStaus = res;
    });

    this.notes.examNoteDate = dayjs(new Date()).toISOString();
  }

  getSeminars(){
    return Array(parseInt(localStorage.getItem('class_total_sem') || '0'));
  }

  ionViewWillEnter() {
    let userData = localStorage.getItem("userloggedin");
    if(userData) {
      this.userDetails = JSON.parse(userData);
    }
  }

  sendNotes() {
    if (!this.notes.sendTo) {
      this.dataProvider.showToast(this.lang.select_type);
    } else {
      if(this.notes.sendTo === 'exam'){
        if(!this.notes.seminir_no) return;
        if(this.notes.examNoteDate === '') return;
      }
      
      this.notes.classId = this.class_id;
      this.notes.user_no = this.userDetails.details.user_no;
      this.notes.school_id = this.userDetails.details.school_id;
      
      let media: any;
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
        { text: this.lang.camera, handler: () => { this.openCamera(CameraSource.Camera); } },
        { text: this.lang.gallery, handler: () => { this.openCamera(CameraSource.Photos); } },
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
    } catch (error) {
      console.log('User cancelled or error', error);
    }
  }

  async uploadPdf() {
    document.getElementById('myFileInput')?.click();
  }

  portChange(event) {
    this.notes.studentIds = [];
    this.studentsId = [];
    this.selectedStudent.forEach(res => {
      this.notes.studentIds.push(res.sid);
      this.studentsId.push(res.sid);
    });
  }

  onSelectFiles(ev: any) {
    let files: any = ev && ev.target && ev.target.files ? ev.target.files : <any>{};
    if(files.length === 0) return;
    
    let ext = files[0].name.split(".").reverse()[0];
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
  uploadPdfToServer(imgBlob?: any, fileName?: any) {
    this.formdata = new FormData(); // تصفير الـ FormData لتجنب تكرار البيانات
    this.formdata.append('sendTo', this.notes.sendTo);
    this.formdata.append('description', this.notes.description);
    this.formdata.append('studentIds', (this.notes.studentIds || []).join('#'));
    
    if(this.notes.ticketImage) {
        this.formdata.append('ticketImage', this.notes.ticketImage);
    }
    
    this.formdata.append('user_no', this.userDetails.details.user_no);
    this.formdata.append('classId', this.class_id);
    this.formdata.append('school_id', this.userDetails.details.school_id);
    this.formdata.append('type', this.mediaType);
    this.formdata.append('examNoteDate', this.notes.examNoteDate);
    this.formdata.append('seminir_no', this.notes.seminir_no);
    
    if (imgBlob) {
      this.formdata.append('file', imgBlob, fileName);
    } else if (this.notes.pdf) {
      this.formdata.append('file', this.notes.pdf);
    }
    
    this.dataProvider.showLoading();
    this.dataProvider.createclassNotes(this.formdata).subscribe(res => {
      this.dataProvider.hideLoading();
      this.dataProvider.showToast(this.lang.note_created);
      const navigation: NavigationExtras = {
        state: { isUpdated: true, course: { cid: this.class_id } }
      };
      this.router.navigate(['view-notes'], navigation);
    }, e => {
      this.dataProvider.hideLoading();
      this.dataProvider.showToast(this.lang.usnexpectedError);
      this.uploadStaus = false;
    });
  }

  startUpload(imgBase64) {
    if (imgBase64 && imgBase64 !== '') {
      this.readFile(imgBase64);
    } else {
      this.uploadPdfToServer();
    }
  }

  readFile(fileBase64: any) {
    const blob = this.dataProvider.dataURItoBlob('data:image/jpeg;base64,' + fileBase64);
    this.uploadPdfToServer(blob, this.dataProvider.generateRandomFileName('jpg'));
  }
 
  ngOnInit() {}
}