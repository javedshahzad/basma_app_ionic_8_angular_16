import { Component, OnInit, NgZone, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from "@angular/forms";
import { Filesystem } from '@capacitor/filesystem';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { SearchApiService } from '../service/search-api/search-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';

@Component({
  selector: 'app-follow-bulletins',
  templateUrl: './follow-bulletins.page.html',
  styleUrls: ['./follow-bulletins.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FollowBulletinsPage implements OnInit {
  trackByIndex(index: number): number { return index; }
  private destroyRef = inject(DestroyRef);
  lang: any;
  allUsers: any = [];
  users: any;
  tital: string = '';
  selectedUsers: any = [];
  userDetails: any = {};
  selectedDocument: any = [];
  
  inputText = true;
  inputUser = false;
  uploadStaus: any;
  cameraImage64: any = '';
  
  searchQuery: string = '';
  searchTimeout: any;
  show_loading: boolean = false;

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    public network: Network,
    private route: ActivatedRoute,
    private router: Router,
    public formBuilder: FormBuilder,
    public zone: NgZone,
    public platform: Platform,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private searchApi: SearchApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {

    this.translate.get("alertmessages").subscribe((response) => {
      this.lang = response;
      this.cdr.markForCheck();
    });

    this.dataProvider.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.uploadStaus = res;
      this.cdr.markForCheck();
    });

    // 🟢 تأمين التقاط بيانات الكاميرا لمنع الانهيار
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state && navigation.extras.state['cameraImage']) {
      this.cameraImage64 = navigation.extras.state['cameraImage'].queryParams.base64Image;
      
      if (this.cameraImage64) {
        this.getImageToFile(this.cameraImage64).then((inputFile: any) => {
          const fileName = inputFile.fileObj.name || "UNKNOWN.PNG";
          const file = inputFile.fileObj || {};
          file['extention'] = fileName.split(".").pop();
          file['auto_created'] = true;
          file['name'] = fileName;
          file['imgBlob'] = inputFile.imgBlob;
          file['currentImgSrc'] = (<any>window).Ionic.WebView.convertFileSrc(this.cameraImage64);
          this.selectedDocument.push(file);
          this.cdr.markForCheck();
        }).catch((e: any) => {
          console.log('getImageToFile ERROR', e);
          this.cdr.markForCheck();
        });
      }
    }
  }

  ngOnInit() {}

  // 🟢 استبدال localStorage وجعل الدالة آمنة
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get("userloggedin");
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.getUsers();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  async openImgPreview(image) {
    const imgSrc = (<any>window).Ionic.WebView.convertFileSrc(image);
    const alert = await this.alertCtrl.create({
      header: 'معاينة الصورة',
      cssClass: 'previewImg',
      mode: 'ios',
      message: '<img src="' + imgSrc + '" class="w-full rounded-xl shadow-sm">',
      buttons: [
        {
          text: 'إغلاق',
          role: 'cancel',
          cssClass: 'text-rose-500 font-bold'
        }
      ]
    });
    await alert.present();
  }

  async getImageToFile(cropImageSrc: string) {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. قراءة الملف من المسار باستخدام كاباسيتور (يرجع Base64 مباشرة وبشكل سليم)
        const contents = await Filesystem.readFile({
          path: cropImageSrc
        });

        // هذا هو نص الـ Base64 الصافي والحقيقي للصورة
        const base64Data = contents.data as string;

        // 2. تحويل الـ Base64 إلى Blob باستخدام دالتك الموجودة مسبقاً
        const imgBlob = this.dataProvider.dataURItoBlob('data:image/jpeg;base64,' + base64Data);

        // 3. إنشاء كائن File قياسي لتعويض fileObj القديم (لكي لا تتعطل أي دوال أخرى تعتمد عليه)
        const fileName = cropImageSrc.split('/').pop() || 'image.jpg';
        const fileObj = new File([imgBlob], fileName, { type: 'image/jpeg' });

        // 4. إرجاع النتيجة تماماً كما كانت تتوقعها الصفحة وبشكل صحي 100%
        resolve({ fileObj: fileObj, imgBlob: imgBlob });

      } catch (error) {
        console.error('Error reading file:', error);
        reject(error);
      }
    });
  }

  openUser() {
    if (this.checkForm()) {
      this.inputText = false;
      this.inputUser = true;
    }
  }

  onSelectFiles(ev: any) {
    let files = ev && ev.target && ev.target.files ? ev.target.files : [];

    for (let i = 0; i < files.length; i++) {
      let file: any = ev.target.files[i] ? ev.target.files[i] : <any>{};
      
      if (file) {
        let ext = file.name.split(".").reverse()[0].toLowerCase();
        
        const reader = new FileReader();
        reader.onloadend = (e) => {
          file['currentImgSrc'] = reader.result;
          this.cdr.markForCheck();
        }
        reader.readAsDataURL(file);
        
        if (['jpg', 'png', 'doc', 'docx', 'pdf', 'jpeg'].includes(ext)) {
          file.extention = ext;
          this.selectedDocument.push(file);
        } else {
          this.dataProvider.showToast(this.lang.file_format_error || 'صيغة الملف غير مدعومة');
        }
      }
    }
  }

  getUsers() {
    let data = {
      'school_id': this.userDetails.details.school_id
    }
    this.show_loading = true;
    this.schoolDirectoryApi.getSchoolUsers(data).then(res => {
      this.show_loading = false;
      if (res.data) {
        this.users = res.data;
        if (this.users.length > 20) {
          this.allUsers = this.users.splice(0, 20);
        } else {
          this.allUsers = this.users;
        }
      }
      this.cdr.markForCheck();
    }).catch(error => {
      this.show_loading = false;
      this.dataProvider.showToast(error);
      this.cdr.markForCheck();
    })
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      if (this.users && this.users.length > 0) {
         this.allUsers = this.allUsers.concat(this.users.splice(0, 20));
      }
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 500);
  }

  // 🟢 دالة البحث المدرعة (Debounce + ngModel)
  filterList() {
    let input = this.searchQuery;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.show_loading = true;

    this.searchTimeout = setTimeout(() => {
      let data = {
        input: input.trim(),
        school_id: this.userDetails.details.school_id
      }
      
      this.searchApi.searchUser(data).then(resp => {
        this.show_loading = false;
        if (resp.data) {
          this.users = resp.data;
          if (this.users.length > 20) {
            this.allUsers = this.users.splice(0, 20);
          } else {
            this.allUsers = this.users;
          }
        }
        this.cdr.markForCheck();
      }).catch(err => {
        this.show_loading = false;
        this.cdr.markForCheck();
      })
    }, 500); // تأخير نصف ثانية لحماية السيرفر
  }

  scanDocument() {
    document.getElementById('myFileInput').click();
  }

  removeImage(i) {
    this.selectedDocument.splice(i, 1);
  }

  submit() {
    // إعادة تهيئة FormData لتجنب تكرار البيانات في حال فشل الطلب السابق
    let formdata = new FormData();
    
    formdata.append('school_id', this.userDetails.details.school_id);
    formdata.append('sended_by', this.userDetails.details.user_no);
    formdata.append('sended_to', this.selectedUsers.join(',')); // إرسال كمصفوفة مفصولة بفواصل
    formdata.append('tital', this.tital);
    
    for (let k in this.selectedDocument) {
      const fileEle = this.selectedDocument[k];
      if (fileEle.hasOwnProperty('auto_created') && fileEle.hasOwnProperty('imgBlob')) {
        formdata.append('files[]', fileEle['imgBlob'], fileEle['name']);
      } else {
        formdata.append('files[]', fileEle);
      }
    }
    
    this.dataProvider.showLoading();
    this.dataProvider.createBulletins(formdata).subscribe(res => {
      this.dataProvider.hideLoading();
      this.dataProvider.showToast('تم الإرسال بنجاح');
      this.router.navigate(['bulletins']);
    }, e => {
      this.dataProvider.hideLoading();
      this.dataProvider.showToast('حدث خطأ أثناء الإرسال');
    });
  }

  checkForm() {
    if (!this.selectedDocument || this.selectedDocument.length < 1) {
      this.dataProvider.showToast(this.lang.doc_error || 'الرجاء اختيار ملف واحد على الأقل');
      return false;
    }
    else if (!this.tital || this.tital.trim() == '') {
      this.dataProvider.showToast(this.lang.title_error || 'الرجاء إدخال عنوان للنشرة');
      return false;
    }
    return true;
  }

  selectUser(user, eve) {    
    if(eve.detail.checked == true){
      if(!this.selectedUsers.includes(user.user_no)){
        this.selectedUsers.push(user.user_no);
      }
    }else{
      let iof = this.selectedUsers.indexOf(user.user_no);
      if(iof >= 0){
        this.selectedUsers.splice(iof, 1);
      }
    }
  }
}