import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { NavController, Platform, AlertController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { FileUploadService } from '../service/file-upload/file-upload.service';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

// 🟢 استيراد خدمة التخزين الموحدة وملف الإعدادات
import { StorageService } from '../service/storage.service';
import { environment } from '../../environments/environment';

// 🟢 استيراد كاميرا كاباسيتور الحديثة
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-post-news',
  templateUrl: './post-news.page.html',
  styleUrls: ['./post-news.page.scss'],
})
export class PostNewsPage implements OnInit {
  
  news = {
    'title': '',
    'news_description': '',
    'user_no': '',
    'user_type': '',
    'type': '',
    'school_id': '',
    'countryCode': ''
  };
  
  media: any = ''; // تم التعديل لتقبل (نص Base64 أو ملف حقيقي)
  mediaName: string = '';
  mediaKey: string = '';
  mediaType: string = '';
  safeUrl: any = false;
  
  lang: any = {};
  userDetails: any = {};
  location_lang: any;
  edit = false;
  passed_news: any;
  AvailablePlan: any;

  // نافذة عرض الصور
  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    private router: Router,
    private fileUpload: FileUploadService, 
    public alertCtrl: AlertController,
    private sanitizer: DomSanitizer, 
    private route: ActivatedRoute,
    public zone: NgZone,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef
  ) {
                
    this.route.queryParams.subscribe(async (res: any) => {
      if (res && res.edit && res.news) {
        try {
          this.processIncomingNews(JSON.parse(res.news));
        } catch (e) { console.error("Error parsing news queryParams", e); }
      }
    });

    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      let passedNews = navigation.extras.state['news'];
      if (passedNews) {
        this.processIncomingNews(passedNews);
      }
    }

    this.translate.get("alertmessages").subscribe((res) => { this.lang = res; });
    this.translate.get("location").subscribe((res) => { this.location_lang = res; });
  }

  processIncomingNews(passedNewsData: any) {
    this.zone.run(() => {
      this.edit = true;
      this.passed_news = passedNewsData;
      
      try {
        let rawContent = this.passed_news.content || this.passed_news.news_description || '';
        
        if (typeof rawContent === 'object' && rawContent['changingThisBreaksApplicationSecurity']) {
           rawContent = rawContent['changingThisBreaksApplicationSecurity'];
        }

        let cleanText = rawContent.replace(/<[^>]*>?/gm, ''); 

        if (cleanText === 'undefined' || cleanText === 'null') {
            cleanText = '';
        }

        this.news.news_description = cleanText;

        let titleText = this.passed_news.title;
        this.news.title = (titleText === 'undefined' || titleText === 'null' || !titleText) ? '' : titleText;

        let mediaUrl = '';
        if (this.passed_news.news_image && this.passed_news.news_image !== 'null' && this.passed_news.news_image !== '') {
            mediaUrl = this.passed_news.news_image;
            this.mediaKey = 'image';
        } else if (this.passed_news.video_url && this.passed_news.video_url !== 'null' && this.passed_news.video_url !== '') {
            mediaUrl = this.passed_news.video_url;
            this.mediaKey = 'video';
        }

        if (mediaUrl) {
          if (!mediaUrl.startsWith('http') && !mediaUrl.startsWith('data:')) {
            let serverUrl = environment.serverURL.endsWith('/') ? environment.serverURL : environment.serverURL + '/';
            mediaUrl = serverUrl + mediaUrl;
          }
          this.safeUrl = mediaUrl; 
        }

        this.cdr.detectChanges();

      } catch (e) {
        console.error("Error parsing news data", e);
      }
    });
  }

  ngOnInit() {}

  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get("userloggedin"); 
    this.AvailablePlan = await this.storageSr.get('availablePlan');
    
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.news.user_no = this.userDetails.details.user_no;
      this.news.user_type = this.userDetails.details.user_type;
      this.news.school_id = this.userDetails.details.school_id;
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  moveBack() {
     this.navCtrl.back();
  }

  viewAttachment() {
    let url = '';
    
    if (this.media && typeof this.media === 'string' && this.media !== '') {
        url = this.media; 
    } else if (this.safeUrl && typeof this.safeUrl === 'string') {
        url = this.safeUrl;
    }

    if (url) {
      if (this.mediaKey === 'video') {
        window.open(url, '_system');
      } else {
        this.viewImageUrl = url;
        this.showImageViewer = true;
      }
    }
  }

  // 🟢 الدالة التي كانت مفقودة لحل خطأ الـ HTML
  openFullscreenImage() {
    this.viewAttachment();
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => { this.viewImageUrl = ''; }, 300);
  }

  sendNews() {
    if (this.AvailablePlan?.isExpire) {
      this.dataProvider.showToast("This feature is part of subscription plan. Please subscribe plan!");
      return;
    }
    
    if (this.news.news_description === '' || this.news.news_description.length > 300) {
      this.dataProvider.showToast(this.lang.max_body || 'نص الخبر يجب أن يكون أقل من 300 حرف');
      return;
    }

    if(this.media !== '') {
       this.news.type = this.mediaType.includes('video') ? 'video' : 'image';
    } else {
       this.news.type = this.mediaKey || 'text'; 
    }

    let newsData: any; 
    let apiEndpoint = 'postNews'; 
    
    if (this.edit) {
      newsData = { 
          ...this.news, 
          id: this.passed_news.id || this.passed_news.news_id, 
          news_id: this.passed_news.id || this.passed_news.news_id,
          old_image: this.passed_news.news_image,
          old_video: this.passed_news.video_url
      };
      apiEndpoint = 'editNews'; 
    } else {
      newsData = this.news;
    }

    this.dataProvider.showLoading();

    this.fileUpload.uploadfile(this.media, newsData, apiEndpoint, (res: any) => {
      this.dataProvider.hideLoading();
      
      if (res) {
        if (this.dataProvider.newsUpdated) {
          this.dataProvider.newsUpdated.next({ ...newsData, id: newsData.news_id });
        }
        
        this.dataProvider.showToast(this.lang.news_posted || 'تمت العملية بنجاح');
        this.resetForm();
        this.navCtrl.navigateBack(['/tabs/news']);
      } else {
        this.dataProvider.showToast(this.lang.usnexpectedError || 'حدث خطأ غير متوقع');
      }
    });
  }

  resetForm() {
    this.news = {
      'title': '', 'news_description': '', 'user_no': this.userDetails?.details?.user_no,
      'type': '', 'user_type': this.userDetails?.details?.user_type, 
      'school_id': this.userDetails?.details?.school_id, 'countryCode': ''
    };
    this.media = '';
    this.safeUrl = false;
    this.mediaKey = '';
    this.edit = false;
    this.passed_news = null;
  }

  async takePicture() {
    const alert = await this.alertCtrl.create({
      header: this.lang.image_option || 'اختيار صورة',
      mode: 'md',
      buttons: [
        { text: this.lang.camera || 'الكاميرا', handler: () => { this.captureImage(CameraSource.Camera); } },
        { text: this.lang.gallery || 'المعرض', handler: () => { this.captureImage(CameraSource.Photos); } },
        { text: this.lang.alert_btn_cancel_text || 'إلغاء', role: 'cancel', cssClass: 'text-rose-500 font-bold' }
      ]
    });
    await alert.present();
  }

  // 🟢 دالة التقاط الصور باستخدام كاباسيتور
  async captureImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        resultType: CameraResultType.Base64,
        source: source,
        correctOrientation: true
      });

      if (image && image.base64String) {
        this.media = 'data:image/jpeg;base64,' + image.base64String;
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.media);
        this.mediaKey = 'image';
        this.mediaType = 'image/jpeg';
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.log('User cancelled or camera error', error);
    }
  }

  // 🟢 دالة الفيديو العبقرية (تستخدم قدرات المتصفح الأصلية لتجاوز تعقيدات الإضافات)
  async takeVideo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.media = file; // تخزين الملف الحقيقي
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
        this.mediaKey = 'video';
        this.mediaType = file.type || 'video/mp4';
        this.cdr.detectChanges();
      }
    };
    
    // محاكاة النقر لفتح المعرض/الكاميرا بشكل آمن
    input.click();
  }

  removeImage() {
    this.media = '';
    this.safeUrl = false;
    this.mediaKey = '';
    if (this.edit && this.passed_news) {
        this.passed_news.news_image = null;
        this.passed_news.video_url = null;
    }
  }
}