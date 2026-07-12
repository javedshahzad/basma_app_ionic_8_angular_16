import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { NavController, Platform } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-playvideo',
  templateUrl: './playvideo.page.html',
  styleUrls: ['./playvideo.page.scss'],
})
export class PlayvideoPage implements OnInit {
  @ViewChild('videoPlayer', { static: false }) mVideoPlayer: ElementRef;

  material: any = {};
  flag: boolean = false;
  materialId: any;

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public platform: Platform,
    private route: ActivatedRoute,
    public socialSharing: SocialSharing,
    private router: Router,
    public zone: NgZone,
    public screen: ScreenOrientation,
    private storageSr: StorageService // 🟢 حقن خدمة التخزين
  ) {
    this.route.queryParams.subscribe(async params => {
      const nav = this.router.getCurrentNavigation();
      
      // 🟢 الحماية ضد التحديث (Refresh)
      if (nav && nav.extras && nav.extras.state) {
        this.materialId = nav.extras.state['materialId'];
        await this.storageSr.set('currentMaterialId', this.materialId);
      } else {
        this.materialId = await this.storageSr.get('currentMaterialId');
        if (!this.materialId) {
          this.navCtrl.back();
          return;
        }
      }
      this.loadVideo(this.materialId);
    });
  }

  ngOnInit() {}

  // 🟢 إعادة قفل الشاشة للوضع العمودي عند الخروج من الصفحة
  ionViewWillLeave() {
    if (this.platform.is("cordova") || this.platform.is("capacitor")) {
      this.screen.lock(this.screen.ORIENTATIONS.PORTRAIT).catch(() => {});
    }
  }

  // 🟢 تحميل الفيديو بشكل آمن ومنفصل
  loadVideo(id: any) {
    this.dataProvider.showLoading();
    this.dataProvider.getMaterialDetails(id).then((materialDetail) => {
      this.flag = true;
      this.dataProvider.hideLoading();
      this.material = materialDetail;
      
      // إعطاء المتصفح وقتاً لرسم الفيديو ثم إضافة الأحداث عليه
      setTimeout(() => {
        this.setupNativeVideoEvents();
      }, 500);

    }).catch((err) => {
      this.dataProvider.hideLoading();
      this.dataProvider.errorALertMessage(err);
    });
  }

  // 🟢 تشغيل مقطع ذو صلة
  playRelatedVideo(id: any) {
    this.flag = false; // لإخفاء المشغل القديم مؤقتاً
    this.materialId = id;
    this.storageSr.set('currentMaterialId', this.materialId);
    this.loadVideo(id);
  }

  // 🟢 فتح الشاشة بالعرض عند تشغيل الفيديو المحمل
  setupNativeVideoEvents() {
    if (this.mVideoPlayer && this.mVideoPlayer.nativeElement) {
      const video = this.mVideoPlayer.nativeElement;
      video.addEventListener("play", () => {
        if (this.platform.is("cordova") || this.platform.is("capacitor")) {
          this.screen.unlock();
        }
      });
      video.addEventListener("ended", () => {
        if (this.platform.is("cordova") || this.platform.is("capacitor")) {
          this.screen.lock(this.screen.ORIENTATIONS.PORTRAIT).catch(() => {});
        }
      });
    }
  }

  // 🟢 مشاركة الفيديو
  share(video: any) {
    let content = video.material_description || video.material_title;
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      let videoUrl = (video.material_video_file && video.material_video_file !== '') 
                     ? video.material_video_file 
                     : video.material_video_link;
                     
      this.socialSharing.share(content, video.material_title, null, videoUrl).catch((err) => {
        console.log(err);
      });
    }
  }
}