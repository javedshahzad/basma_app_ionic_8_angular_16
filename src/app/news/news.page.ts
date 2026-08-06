import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  NgZone,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Platform, AlertController } from '@ionic/angular';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from '../service/data/data.service';
import { Browser } from '@capacitor/browser';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../service/auth/auth.service';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { Router } from '@angular/router';
import { GeoServiceProvider } from '../service/geo-service/geo-service';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { NewsApiService } from '../service/news-api/news-api.service';
import { UserType } from '../constants/user-type';

@Component({
  selector: 'app-news',
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class NewsPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;
  @ViewChild('videoPlayer') mVideoPlayer: ElementRef;
  private destroyRef = inject(DestroyRef);

  allNews: any = [];
  originalNews: any = [];
  userDetails: any = {};
  noDataFound: string = '';
  lang: any = {};
  location_lang: any = {};
  country_code: any;
  country: any;
  countries: any[] = [];
  selected_country = { code: '', name: 'Worldwide' };
  show_loading: boolean = false;
  message: any = {};

  showDeleteModal: boolean = false;
  newsToDelete: any = null;
  newsToDeleteIndex: number = -1;

  filteredCountries: any[] = [];
  isCountryModalOpen: boolean = false;
  countrySearchQuery: string = '';

  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  constructor(
    public dataProvider: DataService,
    public platform: Platform,
    private geo: GeoServiceProvider,
    public authProvider: AuthService,
    public translate: TranslateService,
    public socialSharing: SocialSharing,
    private router: Router,
    public alertController: AlertController,
    public screen: ScreenOrientation,
    public sanitizer: DomSanitizer,
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private zone: NgZone,
    private newsApi: NewsApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.translate.get('location').subscribe(res => {
      this.location_lang = res;
      this.cdr.markForCheck();
    });

    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.translate.get('alertmessages').subscribe(res => {
        this.lang = res;
        this.cdr.markForCheck();
      });
      this.translate.get('location').subscribe(res => {
        this.location_lang = res;
        this.cdr.markForCheck();
      });
    });

    this.authProvider.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.changeUser) {
        this.loadDataSafely(false);
      }
    });

    // رادار التحديث المباشر للأخبار
    if (this.dataProvider.newsUpdated) {
      this.dataProvider.newsUpdated.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updatedNews: any) => {
        if (this.allNews && this.allNews.length > 0) {
          let index = this.allNews.findIndex(news => news.id === updatedNews.id || news.id === updatedNews.news_id);

          if (index !== -1) {
            this.allNews[index].title = updatedNews.title;
            if (updatedNews.news_description) {
              this.allNews[index].content = this.urlify(updatedNews.news_description);
            }
          } else {
            this.getNews(0, 0, this.country_code, false);
          }
          this.cdr.markForCheck();
        }
      });
    }
  }

  ngOnInit() {
    this.loadDataSafely(true);
  }

  ionViewWillEnter() {
    this.loadDataSafely(false);
  }

  ionViewWillLeave() {
    if (this.platform.is('cordova')) {
      this.screen.lock(this.screen.ORIENTATIONS.PORTRAIT).catch(err => console.log(err));
    }
  }

  // 🟢 دالة آمنة لتحميل البيانات والاعتماد على الـ StorageService
  async loadDataSafely(showSkeleton: boolean) {
    if (showSkeleton) this.show_loading = true;

    // جلب اللغة والدول بأمان
    let appLang = (await this.storageSr.get('language')) || 'ar';
    this.countries = appLang === 'en' ? this.geo.getEnCountries() : this.geo.getAllCountries();
    this.filteredCountries = [...this.countries];

    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;

      // إعداد الدولة بناءً على بيانات المستخدم (إذا كان لديه دولة)
      if (this.userDetails?.details?.country_code && this.userDetails.details.country_code != '') {
        this.country_code = this.userDetails.details.country_code;
        this.country = this.countries.find(c => c.code === this.country_code);
        this.selected_country = {
          code: this.country_code,
          name: this.geo.get_country_name(this.country_code)
        };
      }

      this.getNews(0, 0, this.country_code, showSkeleton);
    } else {
      this.show_loading = false;
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  viewPhoto(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => {
      this.viewImageUrl = '';
      this.cdr.markForCheck();
    }, 300);
  }

  addNews() {
    this.router.navigate(['post-news']);
  }

  urlify(text) {
    if (!text) return text;

    // 🔒 تعقيم النص بالكامل أولاً حتى لا يتحول أي HTML/سكريبت داخل الخبر
    // (المُدخل من مستخدم آخر) إلى عناصر حقيقية بعد bypassSecurityTrustHtml
    const escaped = this.escapeHtml(text);

    var urlRegex = /(https?:\/\/[^\s]+)/g;
    let parsedText = escaped.replace(urlRegex, function (url: string) {
      return `<a href="${url}" class="text-indigo-600 font-bold hover:text-indigo-800 underline transition-colors">${url}</a>`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(parsedText);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getNews(start: number, newsPerPage: number, countryCode: any, loading: boolean = true): Promise<any> {
    return new Promise(resolve => {
      this.newsApi
        .getNewsJoin(start, newsPerPage, this.userDetails.details, countryCode)
        .then(totalNews => {
          this.dataProvider.unread = false;
          this.show_loading = false;
          this.allNews = [];

          if (totalNews && totalNews.length > 0) {
            this.originalNews = JSON.parse(JSON.stringify(totalNews));
            this.originalNews.forEach(news => {
              news.content = this.urlify(news.content);
              let date = news.ago.split(' ');
              if (date.length > 20) {
                news.ago = date[2] + ' ' + date[1] + ' ' + date[0];
              }
            });

            if (this.originalNews.length > 1) {
              this.allNews = this.originalNews.splice(0, 20);
            } else {
              this.allNews = this.originalNews;
            }

            // فتح الشاشة في حالة تشغيل فيديو
            for (let i = 0; i < this.allNews.length; i++) {
              if (this.allNews[i].video_url != '') {
                if (this.platform.is('cordova')) this.screen.unlock();
                break;
              }
            }
          } else {
            this.noDataFound = this.lang.no_news || 'لا توجد أخبار';
          }
          this.cdr.markForCheck();
          resolve(true);
        })
        .catch(err => {
          this.show_loading = false;
          this.dataProvider.errorALertMessage(err);
          this.cdr.markForCheck();
          resolve(false);
        });
    });
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      if (this.originalNews && this.originalNews.length > 0) {
        this.allNews = this.allNews.concat(this.originalNews.splice(0, 20));
      }
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 500);
  }

  doRefresh(refresher) {
    this.show_loading = true;
    this.getNews(0, 0, this.country_code, true).then(() => {
      refresher.target.complete();
    });
  }

  // 🟢 إصلاح دالة فتح الروابط من داخل النص
  async openUrl(event: any) {
    if (event.target && (event.target.tagName === 'A' || event.target.tagName === 'a')) {
      event.preventDefault();
      let url = event.target.getAttribute('href');

      if (url) {
        try {
          // استخدام متصفح كاباسيتور الحديث والآمن (يعمل على أندرويد، آيفون، والويب تلقائياً)
          await Browser.open({ url: url });
        } catch (e) {
          console.error('Error opening URL', e);
          // خط دفاع أخير في حال فشل المتصفح
          window.open(url, '_blank');
        }
      }
    }
  }

  // 🟢 دالة التحقق من الصلاحيات (تم تدريعها لتصبح أكثر دقة)
  check_access(news) {
    if (!this.userDetails || !this.userDetails.details || !news) return false;

    let currentUser = this.userDetails.details;

    let isSuperAdmin = currentUser.user_type == UserType.Admin || currentUser.is_school_admin == '1';
    let isSameSchool = news.school_id == currentUser.school_id || news.user_id == currentUser.user_no;
    let isCreator = news.user_no == currentUser.user_no || news.created_by == currentUser.user_no;

    return (isSuperAdmin && isSameSchool) || isCreator;
  }

  async changeLike(news: any) {
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      if (news.already_like == 'true' || news.already_like == true) {
        this.newsApi
          .dislikeNewsPost({
            session_id: this.userDetails.session_id,
            news_id: news.id,
            user_no: this.userDetails?.details?.user_no
          })
          .then(response => {
            if (response.session) {
              news.already_like = 'false';
              news.total_likes = parseInt(news.total_likes) - 1;
            }
            this.cdr.markForCheck();
          });
      } else {
        this.newsApi
          .likeNewsPost({
            session_id: this.userDetails.session_id,
            news_id: news.id,
            user_no: this.userDetails.details.user_no
          })
          .then(response => {
            if (response.session) {
              news.already_like = 'true';
              news.total_likes = parseInt(news.total_likes) + 1;
            }
            this.cdr.markForCheck();
          });
      }
    } else {
      this.dataProvider.showToast('الرجاء تسجيل الدخول أولاً');
    }
  }

  editNews(news) {
    this.router.navigate(['post-news'], {
      state: {
        news: news
      }
    });
  }

  openDeleteModal(news: any, index: number) {
    this.newsToDelete = news;
    this.newsToDeleteIndex = index;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    setTimeout(() => {
      this.newsToDelete = null;
      this.newsToDeleteIndex = -1;
      this.cdr.markForCheck();
    }, 300);
  }

  async confirmDelete() {
    if (!this.newsToDelete) return;

    let data = {
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    try {
      const response = await this.dataProvider.run(() => this.newsApi.deleteNews(data, this.newsToDelete.id));
      if (response.session) {
        this.allNews.splice(this.newsToDeleteIndex, 1);
        this.dataProvider.showToast(response.message);
        this.closeDeleteModal();
      } else {
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(response.message);
        this.closeDeleteModal();
      }
      this.cdr.markForCheck();
    } catch (error) {
      this.dataProvider.errorALertMessage(error);
      this.closeDeleteModal();
      this.cdr.markForCheck();
    }
  }

  openCountryModal() {
    this.filteredCountries = [...this.countries];
    this.countrySearchQuery = '';
    this.isCountryModalOpen = true;
  }

  filterCountries() {
    if (!this.countrySearchQuery || this.countrySearchQuery.trim() === '') {
      this.filteredCountries = [...this.countries];
    } else {
      const query = this.countrySearchQuery.toLowerCase();
      this.filteredCountries = this.countries.filter(
        c => (c.ar_name && c.ar_name.toLowerCase().includes(query)) || (c.name && c.name.toLowerCase().includes(query))
      );
    }
  }

  selectCountry(selected: any) {
    this.isCountryModalOpen = false;
    if (this.country?.code === selected.code) return;

    this.country = selected;
    this.country_code = selected.code;

    this.allNews = [];
    this.show_loading = true;
    this.getNews(0, 0, this.country_code, true);
  }

  clearCountryFilter(event: Event) {
    event.stopPropagation();
    if (!this.country) return;

    this.country = null;
    this.country_code = null;

    this.allNews = [];
    this.show_loading = true;
    this.getNews(0, 0, null, true);
  }
}
