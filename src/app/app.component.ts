import { Device } from '@awesome-cordova-plugins/device/ngx';
import { UserType } from './constants/user-type';
import { Component, OnInit, NgZone } from '@angular/core';
import { Platform, MenuController, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './service/auth/auth.service';
import { DataService } from './service/data/data.service';
import { DatabaseService } from './service/database/database.service';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { Storage } from '@ionic/storage';
import { ToastController } from '@ionic/angular';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './service/storage.service';
import { FcmService } from './service/fcm.service';
import { SyncService } from './service/sync/sync.service';
import { DeviceApiService } from './service/device-api/device-api.service';
import { PlanApiService } from './service/plan-api/plan-api.service';
import { Browser } from '@capacitor/browser';
import { PushNotifications } from '@capacitor/push-notifications';

declare var cordova: any;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  trackByIndex(index: number): number { return index; }
  rootPage: any;
  loggedin: boolean = false;
  activePage: any;
  user: any = {};
  lang: any = {};
  activeLink: any = {};
  pages: Array<{ title: string, component: any, icon: any }>;

  public selectedLanguage: string = 'ar';
  changedLanguage = 'العربية';

  checked = false;
  runNetwork = false;
  isSchoolAdmin: any;
  routeDone = false;
  userDetails: any;
  AvailablePlan: any;
  CheckDeviceInterval: any;
  filePath: string = '';

  constructor(public platform: Platform,
              private storageSr: StorageService,
              public translate: TranslateService,
              public auth: AuthService,
              public screen: ScreenOrientation,
              public dataProvider: DataService,
              public dbProvider: DatabaseService,
              public network: Network,
              public zone: NgZone,
              private route: ActivatedRoute,
              private storage: Storage,
              private navController: NavController,
              public socialSharing: SocialSharing,
              private fcm: FcmService,
              private syncService: SyncService,
              private deviceApi: DeviceApiService,
              public menuCtrl: MenuController,
              public toastController: ToastController,
              public router: Router,
              private device: Device,
              private http: HttpClient,
              private planApi: PlanApiService) {

    this.storageSr.init();

    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        const isLoggedIn = await this.storageSr.get('userloggedin');
        if (isLoggedIn) {
          this.tryLogin();
        }
      }
    });

    this.storageSr.get('userloggedin').then(async (user) => {
      if (user) {
        this.AvailablePlan = await this.storageSr.get('availablePlan');
        this.tryLogin();
        this.getUserPlan();

        clearInterval(this.CheckDeviceInterval);
        this.CheckDeviceInterval = setInterval(() => {
          this.CheckDeviceLogInStatus();
        }, 7000);
      }
    });

    this.storageSr.get('language').then(res => {
      this.selectedLanguage = res ? res : 'ar';
      if (!res) {
        this.storageSr.set('language', 'ar');
      }

      this.translate.setDefaultLang(this.selectedLanguage);

      // FIX: wait for the language file to actually finish loading before
      // doing anything that depends on translations being ready. Previously
      // `use()` was fired without waiting, which is exactly what caused the
      // "first click doesn't work, second click works" bug when switching
      // languages later in the app (see changeLanguage()).
      this.translate.use(this.selectedLanguage).subscribe(() => {
        this.dataProvider.language.next(this.selectedLanguage);
        this.setAppDirection(this.selectedLanguage);
        this.initializeApp();
      });
    });

    this.auth.event.subscribe(async (status: any) => {
      if (status === true || (status && (status.loggedin || status.changeUser))) {
        this.loggedin = true;

        // If switching accounts came from the switch-account screen, don't
        // auto-route from here.
        const isManualLogin = status && status.manual === true;
        const shouldRoute = !isManualLogin;

        // Small delay to make sure the previous admin's data is cleared
        // from memory before we read it again.
        setTimeout(async () => {
          await this.setUserdetails(shouldRoute);
          this.updateMenuTranslations();
          this.getUserPlan();
        }, 150);

        clearInterval(this.CheckDeviceInterval);
        this.CheckDeviceInterval = setInterval(() => {
          this.CheckDeviceLogInStatus();
        }, 7000);

        this.dataProvider.hideLoading();
      }

      if (status === false && status && status.loggedin === false) {
        clearInterval(this.CheckDeviceInterval);
        this.user = {};
        this.loggedin = false;
        this.navController.navigateRoot('/login');
        this.dataProvider.hideLoading();
      }
    });

    this.fcm.getPlan.subscribe(res => {
      if (res) {
        this.getUserPlan();
      }
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if (this.platform.is('capacitor')) {
        this.storageSr.set('uuid', this.device.uuid);
      } else {
        this.storageSr.set('uuid', '#1122112233112233');
      }

      this.requestNotificationPermission();
      this.fcm.initPush();

      this.translate.get(["sidemenu", "alertmessages", "app_rate", "switch_account"]).subscribe((response) => {
        this.lang = response;
        this.dbProvider.openDataBase().then(async () => {
          this.dbProvider.createTable();

          const userLoggedIn = await this.storageSr.get("userloggedin");

          if (userLoggedIn) {
            this.loggedin = true;
            await this.setUserdetails(true);
            this.pages = [];

            if (this.user.userType !== 'student' && this.user.userType !== 'parent') {
              this.pages.push({ title: this.lang.sidemenu.class_list, component: "tabs", icon: "list" });
            }

            if (this.user.userType === 'moderator' || this.user.userType === 'viewer') {
              this.pages.push({ title: this.lang.sidemenu.student_report, component: "student-report-classes", icon: "bar-chart" });
            }

            if (this.user.userType === 'admin') {
              this.pages.push({ title: this.lang.sidemenu.student_report, component: "student-report-classes", icon: "bar-chart" });
              this.pages.push({ title: this.lang.sidemenu.users_list, component: "users-list", icon: "list" });
              this.pages.push({ title: this.lang.sidemenu.manage_teacher, component: "manage-teacher", icon: "list" });
              this.pages.push({ title: this.lang.sidemenu.manage_student, component: "manage-student", icon: "list" });
              this.pages.push({ title: this.lang.sidemenu.new_parent, component: "requested-parent", icon: "list" });
              this.pages.push({ title: this.lang.sidemenu.tasks_calendar, component: "tasks-calendar", icon: "calendar-outline" });
              this.pages.push({ title: this.lang.sidemenu.parent_connect, component: "parentconnect", icon: "list" });
            }

            if (['admin', 'teacher', 'moderator', 'viewer'].includes(this.user.userType)) {
              if (!this.pages?.some(p => p.component === 'bulletins')) {
                this.pages.push({ title: this.lang.sidemenu.billetins, component: "bulletins", icon: "list" });
              }
            }

            this.rootPage = this.user.userType === 'parent' ? "ChildrenPage" : 'tabs';

            if (this.AvailablePlan && this.AvailablePlan.plan.slug != 'free' && this.AvailablePlan.isExpire == false) {
              if (!this.pages.some(p => p.component === 'elearning-schools')) {
                this.pages.push({ title: this.lang.sidemenu.e_learning, component: "elearning-schools", icon: "library-outline" });
              }
            }

          } else {
            await this.checkRoute();
            this.pages = [
              { title: this.lang.sidemenu.login, component: "login", icon: "log-in" },
              { title: this.lang.sidemenu.news, component: "news", icon: "list" },
            ];
            this.rootPage = "login";
          }
          this.initializeDeeppLink();
        });
      });

      if (this.platform.is('cordova') || this.platform.is("capacitor")) {
        this.screen.lock(this.screen.ORIENTATIONS.PORTRAIT).then(() => {
        }).catch(() => {
        });

        setTimeout(() => {
          if (this.network.type == this.network.Connection.UNKNOWN || this.network.type == this.network.Connection.NONE) {
            // no-op: initial check, handled by onDisconnect/onConnect below
          }
        }, 1000);

        this.network.onDisconnect().subscribe(() => {
          // Delay so we don't show a false-positive during brief network blips.
          setTimeout(() => {
            if (this.network.type == this.network.Connection.UNKNOWN || this.network.type == this.network.Connection.NONE) {
              this.dataProvider.showToast(this.lang.alertmessages.not_online);
            }
          }, 2000);
        });

        this.network.onConnect().subscribe(() => {
          if (!this.runNetwork) {
            this.runNetwork = true;
          }
        });

        this.platform.resume.subscribe(() => {
          setTimeout(() => {
            if (this.network.type !== this.network.Connection.UNKNOWN && this.network.type !== this.network.Connection.NONE) {
              this.runNetwork = true;
            }
          }, 1000);
        });
      }

      this.auth.event.subscribe((data) => {
        if (data && data.activeLink) {
          this.activeLink = data.activeLink;
        }
      });
    });
  }

  async requestNotificationPermission() {
    if (this.platform.is('capacitor')) {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  }

  initializeDeeppLink() {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        const slug = event.url.split(".app").pop();
        const que = slug.split("&");
        const id = que[0].split("=");
        const un = que[1].split("=");
        const navigation: NavigationExtras = {
          state: {
            id: id[1],
            un: un[1]
          }
        };
        if (slug.includes('parent_register.php')) {
          this.router.navigate(['parent-register'], navigation);
        }
        if (slug.includes('registration.php')) {
          this.router.navigate(['register-teacher'], navigation);
        }
      });
    });
  }

  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: "top",
      mode: 'ios',
      color: 'danger'
    });
    toast.present();
  }

  openPage(page: any) {
    if (page.component) {
      this.navController.navigateRoot([page.component]);
    } else {
      this.navController.navigateRoot([page]);
    }
    this.activePage = page;
    this.menuCtrl.close();
  }

  async manualLink(path: string) {
    await Browser.open({ url: path });
  }

  getActivePage(page: any) {
    return this.activePage == page;
  }

  // Safe routing — only called on app start / clean login to avoid
  // clashing with in-flight navigation elsewhere.
  async checkRoute() {
    let isLoggedIn = await this.storageSr.get("userloggedin");

    // FIX: `!isLoggedIn && !isLoggedIn.success` throws a TypeError when
    // isLoggedIn is null/undefined, because the right-hand side still gets
    // evaluated. Using optional chaining avoids the crash.
    if (!isLoggedIn?.success) {
      const oldLog = localStorage.getItem("userloggedin");
      if (oldLog) isLoggedIn = JSON.parse(oldLog);
    }

    if (this.user.userType == 'parent') {
      this.navController.navigateRoot('/tabs/children', { animated: true, animationDirection: 'forward' });
    } else if ((!this.user.userType || this.user.userType === "undefined") && !isLoggedIn?.success) {
      this.navController.navigateRoot('/login', { animated: true, animationDirection: 'back' });
    } else if (this.user.userType === 'student') {
      this.navController.navigateRoot('/tabs/student-titles', { animated: true, animationDirection: 'forward' });
    } else {
      this.navController.navigateRoot('/tabs/classlist', { animated: true, animationDirection: 'forward' });
    }
  }

  // Smart logout — doesn't force a redirect to login if another account is
  // being switched to.
  async logout() {
    let userDetail = await this.storageSr.get("userloggedin");
    if (!userDetail) {
      const oldLog = localStorage.getItem("userloggedin");
      if (oldLog) userDetail = JSON.parse(oldLog);
    }

    if (userDetail && userDetail.details) {
      const data = {
        "user_no": userDetail.details.user_no,
        "session_id": userDetail.session_id
      };

      clearInterval(this.CheckDeviceInterval);

      this.dataProvider.run(() => this.auth.doLogout(data)).then(async (resp) => {
        if (resp) {
          await this.storageSr.remove("userloggedin");
          await this.storageSr.remove("availablePlan");
          await this.storageSr.remove("attendance");
          localStorage.removeItem("userloggedin");
          this.navController.navigateRoot('/login', { animated: true });
        }
        // If the response was "switched" we do nothing — AuthService already
        // logged in the other account and routed correctly.

      }).catch(() => {});
    } else {
      await this.storageSr.remove("userloggedin");
      localStorage.removeItem("userloggedin");
      this.navController.navigateRoot('/login');
    }

    this.menuCtrl.close();
  }

  async setUserdetails(shouldRoute: boolean = true) {
    const userDetail = await this.storageSr.get("userloggedin");

    if (userDetail && userDetail.details) {
      this.isSchoolAdmin = userDetail.details.is_school_admin;
      this.user.is_show_absent_students = userDetail.details.is_show_absent_students;

      if (userDetail.details.is_school_admin == 1) {
        this.user.name = userDetail.details.school_name;
        this.user.image = userDetail.details.school_logo ? userDetail.details.school_logo : "./assets/imgs/logo.png";
      } else {
        this.user.name = userDetail.details.first_name + " " + ((userDetail.details.last_name && userDetail.details.last_name != null) ? userDetail.details.last_name : '');
        this.user.image = userDetail.details.pic ? userDetail.details.pic : "./assets/imgs/logo.png";
      }

      this.user.description = userDetail.details.school_name;
      this.user.school_image = userDetail.details.school_logo;
      this.user.is_school_admin = userDetail.details.is_school_admin;

      if (userDetail.details.user_type == UserType.Admin) {
        if (userDetail.details.school_details != '') {
          this.user.description = userDetail.details.is_school_admin != 1 ? '' : userDetail.details.school_details;
        }
        this.user.userType = 'admin';
      } else if (userDetail.details.user_type == UserType.Teacher) {
        this.user.userType = 'teacher';
      } else if (userDetail.details.user_type == UserType.Moderator) {
        this.user.userType = 'moderator';
      } else if (userDetail.details.user_type == UserType.Parent) {
        this.user.userType = 'parent';
      } else if (userDetail.details.user_type == UserType.Viewer) {
        this.user.userType = 'viewer';
      } else if (userDetail.details.user_type == UserType.Student) {
        this.user.userType = 'student';
      }
    }

    if (shouldRoute) {
      await this.checkRoute();
    }
  }

  shareRegistrationLink() {
    this.socialSharing.share("Teacher Registration", "This is registration link for the new teacher.", null, this.activeLink.link)
      .then(() => {}, err => console.log(err));
  }

  shareParentRegistrationLink() {
    this.socialSharing.share("Parent Registration", "This is registration link for the new parents.", null, this.activeLink.parent_link_active)
      .then(() => {}, err => console.log(err));
  }

  registerParent(page) {
    if (page == 'parent_register') {
      this.router.navigate(['parent-register']);
    } else {
      this.router.navigate(['requested-parent']);
    }
    this.menuCtrl.close();
  }

  shareApp() {
    this.dataProvider.run(() => this.dataProvider.getShareLink('elem')).then(response => {
      this.socialSharing.share(null, null, null, response.short_url)
        .then(() => {}, err => console.log(err));
      this.menuCtrl.close();
    }).catch(e => {
      console.log(e);
    });
  }

  rateApp() {
    const lang = this.translate.getDefaultLang();
    this.dataProvider.showRatePrompt(lang);
    this.menuCtrl.close();
  }

  async openBackendUrl() {
    await Browser.open({ url: 'https://basmapp.com/BasmaCP' });
  }

  async ngOnInit() {
    // reserved for future use
  }

  // FIX: this was the root cause of the "first click doesn't work" bug.
  // translate.use() is asynchronous — it fetches/parses the language JSON
  // file. Calling translate.get() immediately afterwards (without waiting)
  // meant the very first switch to a language could read translations
  // before they'd finished loading. Subsequent switches "worked" only
  // because ngx-translate had already cached that language in memory.
  // Now we wait for use() to complete before doing anything that depends
  // on the new language being active.
  async changeLanguage(event: any) {
    const newLang = event.detail.value;
    console.log(newLang)
    // if (newLang === this.selectedLanguage) {
    //   return;
    // }

    await this.storageSr.set('language', newLang);

    this.translate.use(newLang).subscribe({
      next: () => {
        this.selectedLanguage = newLang;
        this.changedLanguage = newLang === 'ar' ? 'العربية' : 'English';
        this.translate.setDefaultLang(newLang);
        this.setAppDirection(newLang);
        this.dataProvider.language.next(newLang);

        this.translate.get(["sidemenu", "alertmessages", "app_rate"]).subscribe((response) => {
          this.lang = response;
          this.updateMenuTranslations();
        });
      },
      error: (err) => {
        console.error('Failed to switch language:', err);
      }
    });
  }

  updateMenuTranslations() {
    this.pages = [];
    if (!this.user || !this.user.userType) return;

    if (this.user.userType == 'parent') {
      // no side menu for parents
    } else if (this.user.userType == 'student') {
      // no side menu for students
    } else if (['admin', 'teacher', 'moderator', 'viewer'].includes(this.user.userType)) {
      this.pages.push({ title: this.lang.sidemenu?.class_list || 'قائمة الفصول', component: "tabs", icon: "grid-outline" });

      if (this.user.userType == 'moderator' || this.user.userType == 'viewer') {
        this.pages.push({ title: this.lang.sidemenu?.student_report || 'تقرير الطلاب', component: "student-report-classes", icon: "analytics-outline" });
      }

      if (this.user.userType == 'admin') {
        this.pages.push({ title: this.lang.sidemenu?.student_report || 'تقرير الطلاب', component: "student-report-classes", icon: "analytics-outline" });
        this.pages.push({ title: this.lang.sidemenu?.users_list || 'المستخدمين', component: "users-list", icon: "people-outline" });
        this.pages.push({ title: this.lang.sidemenu?.manage_teacher || 'إدارة المعلمين', component: "manage-teacher", icon: "briefcase-outline" });
        this.pages.push({ title: this.lang.sidemenu?.manage_student || 'إدارة الطلاب', component: "manage-student", icon: "school-outline" });
        this.pages.push({ title: this.lang.sidemenu?.new_parent || 'أولياء الأمور', component: "requested-parent", icon: "person-add-outline" });
        this.pages.push({ title: this.lang.sidemenu?.tasks_calendar || 'التقويم', component: "tasks-calendar", icon: "calendar-outline" });
        this.pages.push({ title: this.lang.sidemenu?.parent_connect || 'التواصل', component: "parentconnect", icon: "chatbubbles-outline" });
      }

      if (['admin', 'teacher', 'moderator'].includes(this.user.userType)) {
        this.pages.push({ title: this.lang.sidemenu?.billetins || 'النشرات', component: "bulletins", icon: "megaphone-outline" });
      }

      if (this.AvailablePlan && this.AvailablePlan.plan.slug != 'free' && this.AvailablePlan.isExpire == false) {
        this.pages.push({ title: this.lang.sidemenu?.e_learning || 'التعليم الإلكتروني', component: "elearning-schools", icon: "library-outline" });
      }
    }
  }

  setAppDirection(lang: string) {
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  async openUrl(url) {
    await Browser.open({ url });
  }

  changeAccount(event) {
    this.dataProvider.switchAccount(event, this.lang.switch_account);
    this.menuCtrl.close();
  }

  async openPDF() {
    await Browser.open({ url: 'https://basmapp.com/appmanual.pdf' });
  }

  async opentOs() {
    await Browser.open({ url: 'https://basmapp.com/tOs.html' });
  }

  async openPp() {
    await Browser.open({ url: 'https://basmapp.com/Pp.html' });
  }

  async tryLogin() {
    const userInfo = await this.storageSr.get('userloggedin');

    if (userInfo && userInfo.details) {
      this.http.get(environment.serverURL + `get_user_type?user_no=${userInfo.details.user_no}&code=${userInfo.details.country_code}&school_id=${userInfo?.details.school_id}`)
        .subscribe(async (res: any) => {
          if (res.user_type) {
            this.dataProvider.unread = res.unread;
            this.dataProvider.private_message = res.notifications;
            if (res.school?.deactivate_date) {
              this.dataProvider.deactivate_date = res.school?.deactivate_date;
            }
            await this.storageSr.set('userloggedin', userInfo);
          }
        });
    }

    this.AvailablePlan = await this.storageSr.get('availablePlan');
  }

  async getUserPlan() {
    this.userDetails = await this.storageSr.get("userloggedin");

    if (this.userDetails && this.userDetails.details && this.userDetails.details.user_no) {

      const data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id
      };

      this.planApi.getUserPlan(data).then(async (res: any) => {
        if (res && res.response) {
          await this.storageSr.set("availablePlan", res.response);
          localStorage.setItem("availablePlan", JSON.stringify(res.response));
          this.AvailablePlan = res.response;

          if (this.AvailablePlan.plan.slug != 'free' && this.AvailablePlan.isExpire == false) {
            if (!this.pages.some(p => p.component === 'elearning-schools')) {
              this.pages.push({ title: this.lang.sidemenu.e_learning, component: "elearning-schools", icon: "library-outline" });
            }
          }
        } else if (!res.response && this.userDetails.details.is_school_admin == 1) {
          this.subcribeToServerFreePlan();
        } else {
          await this.storageSr.remove("availablePlan");
        }
      }).catch(e => {
        console.log(e);
      });
    }
  }

  subcribeToServerFreePlan() {
    const data = {
      plan_id: 1,
      iap_id: Date.now().toString(),
      paymentType: "Free",
      billingPeriod: 1,
      billingPeriodUnit: "month",
      ammount: 0.00,
      user_id: this.userDetails.details.user_no,
      school: this.userDetails.details.school_id
    };
    this.planApi.purchase(data).then(res => {
      // success — nothing further needed here
    }, () => {
      this.dataProvider.showToast('Error in processing payment');
    });
  }

  async CheckDeviceLogInStatus() {
    const userDetails = await this.storageSr.get("userloggedin");

    if (userDetails && userDetails.details && userDetails.details.user_no) {

      let currentDeviceId = '';

      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        currentDeviceId = this.device.uuid;
      }

      if (!currentDeviceId || currentDeviceId === 'undefined') {
        let browserId = await this.storageSr.get("browser_uuid");
        if (!browserId) {
          browserId = 'BRW-' + Math.random().toString(36).substr(2, 9).toUpperCase();
          await this.storageSr.set("browser_uuid", browserId);
        }
        currentDeviceId = browserId;
      }

      const data = {
        "user_no": userDetails.details.user_no,
        "device_id": currentDeviceId
      };

      this.deviceApi.CheckDeviceLogInStatus(data).then(res => {
        // Only log out on an explicit kick / deactivated account signal.
        if (res.success && res.data && (res.data.is_logged_out == '1' || res.data.user.status == "0")) {
          this.logout();
        }
      }, () => {
        // Network hiccup or general error — fail silently.
        this.dataProvider.hideLoading();
      });
    }
  }

  async LogInDevice() {
    const userDetails = await this.storageSr.get("userloggedin");

    if (userDetails && userDetails.details) {

      let currentDeviceId = '';

      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        currentDeviceId = this.device.uuid;
      }

      if (!currentDeviceId || currentDeviceId === 'undefined') {
        let browserId = await this.storageSr.get("browser_uuid");
        if (!browserId) {
          browserId = 'BRW-' + Math.random().toString(36).substr(2, 9).toUpperCase();
          await this.storageSr.set("browser_uuid", browserId);
        }
        currentDeviceId = browserId;
      }

      const data = {
        "user_no": userDetails.details.user_no,
        "device_id": currentDeviceId
      };

      this.deviceApi.LogInSingleDevice(data).then(res => {
        console.log("Device Logged In:", res);
      }, () => {
        this.dataProvider.hideLoading();
      });
    }
  }

  getAppStatus() {
    this.platform.pause.subscribe(async () => {
    });
    this.platform.resume.subscribe(async () => {
    });
  }
}