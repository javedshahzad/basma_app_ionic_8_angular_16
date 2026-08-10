import {
  Component,
  ViewChild,
  ElementRef,
  NgZone,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { NavController, Platform, IonicModule } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Share } from '@capacitor/share';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { ElearningApiService, ElearningMaterial } from '../service/elearning-api/elearning-api.service';
import { NgIf, NgFor } from '@angular/common';
import { SafePipe } from '../pipes/safe/safe.pipe';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-playvideo',
    templateUrl: './playvideo.page.html',
    styleUrls: ['./playvideo.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgFor, SafePipe, TranslatePipe]
})
export class PlayvideoPage {
  trackByIndex(index: number): number {
    return index;
  }
  @ViewChild('videoPlayer', { static: false }) mVideoPlayer: ElementRef;

  material: ElearningMaterial = {};
  flag: boolean = false;
  materialId: string | number;
  private destroyRef = inject(DestroyRef);

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public platform: Platform,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
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


  // 🟢 إعادة قفل الشاشة للوضع العمودي عند الخروج من الصفحة
  ionViewWillLeave() {
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
    }
  }

  // 🟢 تحميل الفيديو بشكل آمن ومنفصل
  async loadVideo(id: string | number) {
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
  playRelatedVideo(id: string | number) {
    this.flag = false; // لإخفاء المشغل القديم مؤقتاً
    this.materialId = id;
    this.storageSr.set('currentMaterialId', this.materialId);
    this.loadVideo(id);
  }

  // 🟢 فتح الشاشة بالعرض عند تشغيل الفيديو المحمل
  setupNativeVideoEvents() {
    if (this.mVideoPlayer && this.mVideoPlayer.nativeElement) {
      const video = this.mVideoPlayer.nativeElement;
      video.addEventListener('play', () => {
        if (this.platform.is('cordova') || this.platform.is('capacitor')) {
          ScreenOrientation.unlock();
        }
      });
      video.addEventListener('ended', () => {
        if (this.platform.is('cordova') || this.platform.is('capacitor')) {
          ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
        }
      });
    }
  }

  // 🟢 مشاركة الفيديو
  share(video: ElearningMaterial) {
    let content = video.material_description || video.material_title;
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      let videoUrl =
        video.material_video_file && video.material_video_file !== ''
          ? video.material_video_file
          : video.material_video_link;

      Share.share({ text: content, title: video.material_title, url: videoUrl }).catch(err => {
        console.log(err);
      });
    }
  }
}
