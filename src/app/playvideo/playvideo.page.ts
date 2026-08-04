import { Component, OnInit, ViewChild, ElementRef, NgZone, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { NavController, Platform } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { ElearningApiService } from '../service/elearning-api/elearning-api.service';

@Component({
  selector: 'app-playvideo',
  templateUrl: './playvideo.page.html',
  styleUrls: ['./playvideo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayvideoPage implements OnInit {
  trackByIndex(index: number): number { return index; }
  @ViewChild('videoPlayer', { static: false }) mVideoPlayer: ElementRef;

  material: any = {};
  flag: boolean = false;
  materialId: any;
  private destroyRef = inject(DestroyRef);

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public platform: Platform,
    private route: ActivatedRoute,
    public socialSharing: SocialSharing,
    private router: Router,
    public zone: NgZone,
    public screen: ScreenOrientation,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private elearningApi: ElearningApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async params => {
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
  async loadVideo(id: any) {
    try {
      const materialDetail = await this.dataProvider.run(() => this.elearningApi.getMaterialDetails(id));
      this.flag = true;
      this.material = materialDetail;
      this.cdr.markForCheck();

      // إعطاء المتصفح وقتاً لرسم الفيديو ثم إضافة الأحداث عليه
      setTimeout(() => {
        this.setupNativeVideoEvents();
      }, 500);

    } catch (err) {
      this.dataProvider.errorALertMessage(err);
      this.cdr.markForCheck();
    }
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