import { Device } from '@awesome-cordova-plugins/device/ngx';
import { Component, OnInit , NgZone } from '@angular/core';
import { Platform,MenuController,NavController } from '@ionic/angular';
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
import { Browser } from '@capacitor/browser';
import { PushNotifications } from '@capacitor/push-notifications';

declare var cordova :any;
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  rootPage: any;
  loggedin: boolean = false;
  activePage: any;
  user:any={};
  lang:any = {};
  activeLink:any = {};
  pages: Array<{ title: string, component: any, icon: any }>;
  
  public selectedLanguage: string = 'ar'; 
  changedLanguage='العربية';

  checked=false;
  runNetwork=false; 
  isSchoolAdmin:any;
  routeDone=false;
  userDetails: any;
  AvailablePlan: any;
  CheckDeviceInterval: any;
  filePath: string = '';

  constructor(public platform: Platform,
              private storageSr:StorageService,
              public translate: TranslateService,
              public auth: AuthService,
              public screen: ScreenOrientation,
              public dataProvider: DataService,
              public dbProvider: DatabaseService,
              public network: Network,
              public zone:NgZone,
              private route : ActivatedRoute,
              private storage: Storage,
              private navController:NavController,
              public socialSharing: SocialSharing,
              private fcm: FcmService,
              public menuCtrl: MenuController,
              public toastController: ToastController,
              public router:Router , 
              private device : Device , 
              private http : HttpClient) {

                this.storageSr.init();
                App.addListener('appStateChange', async ({ isActive }) => {
                    if (isActive) {
                      let isLoggedIn = await this.storageSr.get('userloggedin');
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
        if(res){
          this.selectedLanguage = res;
        } else {
          this.selectedLanguage = 'ar';
          this.storageSr.set('language', 'ar');
        }
        
        this.translate.setDefaultLang(this.selectedLanguage);
        this.translate.use(this.selectedLanguage);
        this.dataProvider.language.emit(this.selectedLanguage);
        this.setAppDirection(this.selectedLanguage);

        this.initializeApp();
    });

    this.auth.event.subscribe(async (status: any) => {
      if(status === true || (status && (status.loggedin || status.changeUser))){
        this.loggedin = true;
        
        // 🟢 السحر الأول: إذا كان التبديل من شاشة switch-account فلا تقم بتوجيه عشوائي من هنا
        let isManualLogin = status && status.manual === true;
        let shouldRoute = !isManualLogin; 
        
        // 🟢 السحر الثاني: مهلة 150 ملي ثانية لضمان مسح بيانات المدير القديم من الذاكرة 
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
      
      if(status === false || (status && status.loggedin === false)){
        clearInterval(this.CheckDeviceInterval);
        this.user={};
        this.loggedin = false;
        this.navController.navigateRoot('/login');
        this.dataProvider.hideLoading();
      }
    });

    this.fcm.getPlan.subscribe(res=>{
      if(res){
        this.getUserPlan();
      }
    })
  }

  initializeApp() {
    this.platform.ready().then(() => {
        if(this.platform.is('capacitor')){
            this.storageSr.set('uuid', this.device.uuid); 
        }else{
            this.storageSr.set('uuid', '#1122112233112233'); 
        }
     
        this.requestNotificationPermission();

        this.fcm.initPush();

      if(this.platform.is('cordova') || this.platform.is("capacitor")){
      (<any>window).open = (<any>cordova).InAppBrowser.open;
      }

      this.translate.get(["sidemenu", "alertmessages","app_rate","switch_account"]).subscribe((response)=>{
      this.lang = response;
      this.dbProvider.openDataBase().then(async () => {
        this.dbProvider.createTable();
        
        let userLoggedIn = await this.storageSr.get("userloggedin"); 
        
        if (userLoggedIn) { 
          this.loggedin = true;
          // في بداية تشغيل التطبيق نمرر true لكي يوجهنا للرئيسية بنجاح
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

          if (this.user.userType === 'admin' || this.user.userType === 'teacher' || this.user.userType === 'moderator' || this.user.userType === 'viewer') {
              if (!this.pages.some(p => p.component === 'bulletins')) {
                  this.pages.push({ title: this.lang.sidemenu.billetins, component: "bulletins", icon: "list" });
              }
          }

          if (this.user.userType === 'parent') {
              this.rootPage = "ChildrenPage";
          } else {
              this.rootPage = 'tabs';
          }

          if(this.AvailablePlan){
            if(this.AvailablePlan.plan.slug != 'free' && this.AvailablePlan.isExpire == false){
              if (!this.pages.some(p => p.component === 'elearning-schools')) {
                this.pages.push({ title: this.lang.sidemenu.e_learning, component: "elearning-schools", icon: "library-outline" });
              }
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
      })

        if (this.platform.is('cordova') || this.platform.is("capacitor")) {
          this.screen.lock(this.screen.ORIENTATIONS.PORTRAIT).then(()=>{
          }).catch((err)=>{
          })
          setTimeout(()=>{
            if(this.network.type == this.network.Connection.UNKNOWN || this.network.type == this.network.Connection.NONE){
            }
          }, 1000)

          // === التعديل هنا ===
          this.network.onDisconnect().subscribe(() => {
            // نؤخر إظهار الرسالة لمدة ثانيتين
            setTimeout(() => {
              // نفحص الشبكة مرة أخرى: هل ما زالت مقطوعة؟
              if(this.network.type == this.network.Connection.UNKNOWN || this.network.type == this.network.Connection.NONE){
                this.dataProvider.showToast(this.lang.alertmessages.not_online);
              }
            }, 2000);
          });
          // ===================
          
          this.network.onConnect().subscribe(() => {
             if(!this.runNetwork){
               this.runNetwork=true;
             }
          });

          // === إضافة تأكيد الاتصال عند العودة من الخلفية ===
          this.platform.resume.subscribe(() => {
            setTimeout(() => {
               if(this.network.type !== this.network.Connection.UNKNOWN && this.network.type !== this.network.Connection.NONE){
                 this.runNetwork = true;
               }
            }, 1000);
          });
          // ==============================================
        }
      })
      this.auth.event.subscribe((data)=>{
        if(data){
          if(data.activeLink){
            this.activeLink = data.activeLink;
          }
        }
      })
    });
  }

  // 🟢 2. الدالة الجديدة: ضعها هنا مباشرة تحت دالة initializeApp
async requestNotificationPermission() {
  if (this.platform.is('capacitor')) {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('المستخدم رفض الإشعارات أو النظام حظرها');
      } else {
        console.log('تمت الموافقة، جاري التسجيل في خدمة الإشعارات...');
        // تسجيل الجهاز للحصول على التوكن
        await PushNotifications.register();
      }
    } catch (error) {
      console.error('حدث خطأ أثناء طلب صلاحية الإشعارات:', error);
    }
  }
}

      initializeDeeppLink() {
        App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
            this.zone.run(() => {
                const slug = event.url.split(".app").pop();
                let que = slug.split("&");
                let id= que[0].split("=");
                let un= que[1].split("=");
                const navigation: NavigationExtras = {
                  state : {
                      id: id[1],
                      un:un[1]
                  }
                };
                if(slug.includes('parent_register.php')){
                  this.router.navigate(['parent-register'],navigation);
                }
                if(slug.includes('registration.php')){
                  this.router.navigate(['register-teacher'],navigation);
                }
            });
        });
    }
    
    async presentToast(message) {
      const toast = await this.toastController.create({
        message: message,
        duration: 3000,
        position: "top",
        mode:'ios',
        color:'danger'
      });
      toast.present();
    }

  openPage(page: any) {
    if(page.component){
      if (page.component == "login") {
       this.navController.navigateRoot([page.component]);
      } else {
        this.navController.navigateRoot([page.component]);
      }
    }else{
      this.navController.navigateRoot([page])
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
  
  // 🟢 التوجيه الآمن (يُستدعى فقط في بداية التطبيق لتجنب التصادم)
  async checkRoute() { 
    let isLoggedIn = await this.storageSr.get("userloggedin");
    if(!isLoggedIn) {
        let oldLog = localStorage.getItem("userloggedin");
        if(oldLog) isLoggedIn = JSON.parse(oldLog);
    }

    // 🟢 استخدام مهلة زمنية لضمان استقرار الـ Storage قبل التوجيه
    setTimeout(() => {
      this.zone.run(() => {
        if (this.user.userType == 'parent') {
          // استخدام navigateRoot لضمان إعادة ضبط حالة التبويبات
          this.navController.navigateRoot('/tabs/children', { animated: true, animationDirection: 'forward' });
        } else if (!this.user.userType || !isLoggedIn) { 
          this.navController.navigateRoot('/login', { animated: true, animationDirection: 'back' });
        } else if (this.user.userType == 'student') {
          // 🟢 توجيه الطالب مباشرة وبشكل جذري لصفحة الألقاب
          this.navController.navigateRoot('/tabs/student-titles', { animated: true, animationDirection: 'forward' });
        } else {
          // الإدارة والمعلمين يذهبون للفصول
          this.navController.navigateRoot('/tabs/classlist', { animated: true, animationDirection: 'forward' });
        }
      });
    }, 100); // زيادة المهلة قليلاً لضمان معالجة الحدث
  }

  // 🟢 تسجيل خروج ذكي لا يوجهك لصفحة الدخول إلا إذا لم يكن هناك حساب آخر!
  async logout() {
    let userDetail = await this.storageSr.get("userloggedin");
    if(!userDetail) {
        let oldLog = localStorage.getItem("userloggedin");
        if(oldLog) userDetail = JSON.parse(oldLog);
    }
    
    if (userDetail && userDetail.details) {
      let data = {
        "user_no": userDetail.details.user_no,
        "session_id": userDetail.session_id
      }
      
      clearInterval(this.CheckDeviceInterval);
      this.dataProvider.showLoading();
      
      this.auth.doLogout(data).then(async (resp) => {
        this.dataProvider.hideLoading();
        
        // 🟢 السحر هنا: إذا كان الرد "logged_out" فهذا خروج نهائي
        if (resp === "logged_out") {
          await this.storageSr.remove("userloggedin");
          await this.storageSr.remove("availablePlan");
          await this.storageSr.remove("attendance");
          localStorage.removeItem("userloggedin"); 
          this.navController.navigateRoot('/login', { animated: true });
        }
        // 🟢 أما إذا كان "switched" فلن نفعل أي توجيه! 
        // لأن AuthService ستقوم بتسجيل الحساب الآخر وتوجيهنا للصفحة الصحيحة مباشرة.
        
      }).catch((error) => {
        this.dataProvider.hideLoading();
      });
    } else {
      await this.storageSr.remove("userloggedin");
      localStorage.removeItem("userloggedin");
      this.navController.navigateRoot('/login');
    }
    
    this.menuCtrl.close();
  }

  // 🟢 إضافة مُعامل للتحكم بالتوجيه
  async setUserdetails(shouldRoute: boolean = true) {
    let userDetail = await this.storageSr.get("userloggedin");

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
      
      if (userDetail.details.user_type == '1') {
        if (userDetail.details.school_details != '') {
          if (userDetail.details.is_school_admin != 1) {
            this.user.description = '';
          } else {
            this.user.description = userDetail.details.school_details;
          }
        }
        this.user.userType = 'admin';
      } else if (userDetail.details.user_type == '2') {
        this.user.userType = 'teacher';
      } else if (userDetail.details.user_type == '3') {
        this.user.userType = 'moderator';
      } else if (userDetail.details.user_type == '4') {
        this.user.userType = 'parent';
      } else if (userDetail.details.user_type == '7') {
        this.user.userType = 'viewer';
      } else if (userDetail.details.user_type == '8') {
        this.user.userType = 'student';
      }
    }
    
    if (shouldRoute) {
       await this.checkRoute();
    }
  }

  shareRegistrationLink(){
    this.socialSharing.share( "Teacher Registration", "This is registration link for the new teacher.", null, this.activeLink.link).then(res => {
    }, err => {
      console.log(err);
    })
  }

  shareParentRegistrationLink(){
    this.socialSharing.share( "Parent Registration", "This is registration link for the new parents.", null, this.activeLink.parent_link_active).then(res => {
    }, err => {
      console.log(err);
    })
  }
  registerParent(page){
    if(page=='parent_register'){

    this.router.navigate(['parent-register']);
  }else{
    this.router.navigate(['requested-parent']);
  }
    this.menuCtrl.close();
  }

  shareApp(){
    this.dataProvider.showLoading()
    this.dataProvider.getShareLink('elem').then(response=>{
      this.dataProvider.hideLoading();
        this.socialSharing.share( null, null, null,response.short_url).then(res => {
  
        }, err => {
          console.log(err);
        })
        this.menuCtrl.close();
    }).catch(e=>{
      this.dataProvider.hideLoading();
      console.log(e);
    })
  }
  
  rateApp(){
    let lang= this.translate.getDefaultLang();
    this.dataProvider.showRatePrompt(lang);
    this.menuCtrl.close();
  }

  async openBackendUrl() {
      await Browser.open({ url: 'https://basmapp.com/BasmaCP' });
  }

  async ngOnInit() {
    const path = window.location.pathname.split('folder/')[1];
    await this.checkRoute();
  }

  async changeLanguage(event: any) {
    const newLang = event.detail.value;
    
    await this.storageSr.set('language', newLang);
    
    this.selectedLanguage = newLang;
    this.changedLanguage = newLang === 'ar' ? 'العربية' : 'English';
    this.translate.use(newLang);
    this.translate.setDefaultLang(newLang);
    this.setAppDirection(newLang);
    this.dataProvider.language.emit(newLang);
    
    this.translate.get(["sidemenu", "alertmessages", "app_rate"]).subscribe((response) => {
      this.lang = response;
      this.updateMenuTranslations();
    });
  }

  updateMenuTranslations() {
    this.pages = []; 
    // 🟢 السحر الثالث: حماية القائمة، لا تفعل شيئاً إن لم يتم جلب نوع المستخدم بدقة
    if (!this.user || !this.user.userType) return; 
    
    if (this.user.userType == 'parent') {
       // لا قائمة جانبية لولي الأمر
    } else if (this.user.userType == 'student') {
       // لا قائمة جانبية (أو مخصصة) للطالب
    } else if (['admin', 'teacher', 'moderator', 'viewer'].includes(this.user.userType)) {
       // 🟢 هنا نضمن أن هذه القائمة لا تظهر إلا لطاقم المدرسة
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
       
       if (this.user.userType == 'admin' || this.user.userType == 'teacher' || this.user.userType == 'moderator') {
          this.pages.push({ title: this.lang.sidemenu?.billetins || 'النشرات', component: "bulletins", icon: "megaphone-outline" });
       }

       if (this.AvailablePlan && this.AvailablePlan.plan.slug != 'free' && this.AvailablePlan.isExpire == false) {
          this.pages.push({ title: this.lang.sidemenu?.e_learning || 'التعليم الإلكتروني', component: "elearning-schools", icon: "library-outline" });
       }
    }
  }

  setAppDirection(lang: string) {
    if (lang === 'ar') {
      document.dir = 'rtl';
    } else {
      document.dir = 'ltr';
    }
  }

  async openUrl(url){
    await Browser.open({ url: url });
  }
  
  changeAccount(event){
    this.dataProvider.switchAccount(event,this.lang.switch_account);
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
  let userInfo = await this.storageSr.get('userloggedin');
  let oldLogins = await this.storageSr.get('earlyLogin');

  if (userInfo && userInfo.details) {
    this.http.get(environment.serverURL + `get_user_type?user_no=${userInfo.details.user_no}&code=${userInfo.details.country_code}&school_id=${userInfo?.details.school_id}`).subscribe(async (res : any) => {
      if(res.user_type){
        console.log("From here user type = ",res);
        this.dataProvider.unread = res.unread;
        this.dataProvider.private_message = res.notifications
        if(res.school?.deactivate_date){
          this.dataProvider.deactivate_date =res.school?.deactivate_date;
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
      
      let data = {
        user_no: this.userDetails.details.user_no,
        school_id: this.userDetails.details.school_id
      };

      this.dataProvider.getUserPlan(data).then(async (res: any) => {
        if (res && res.response) {
          await this.storageSr.set("availablePlan", res.response);
          await localStorage.setItem("availablePlan", JSON.stringify(res.response));
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

  subcribeToServerFreePlan(){
    let data={
        plan_id: 1,
        iap_id:Date.now().toString(),
        paymentType:"Free",
        billingPeriod:1,
        billingPeriodUnit:"month",
        ammount:0.00,
        user_id:this.userDetails.details.user_no,
        school:this.userDetails.details.school_id
    }
    this.dataProvider.purchase(data).then(res=>{
     if(res.success){
      }
    },e=>{
        this.dataProvider.showToast('Error in processing payment');
    })
  }

  async CheckDeviceLogInStatus() {
    let userDetails = await this.storageSr.get("userloggedin");
    
    if (userDetails && userDetails.details && userDetails.details.user_no) {
      
      let currentDeviceId = '';

      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        currentDeviceId = this.device.uuid;
      }

      if (!currentDeviceId || currentDeviceId === 'undefined' || currentDeviceId === null) {
          let browserId = await this.storageSr.get("browser_uuid");
          if (!browserId) {
              browserId = 'BRW-' + Math.random().toString(36).substr(2, 9).toUpperCase();
              await this.storageSr.set("browser_uuid", browserId);
          }
          currentDeviceId = browserId;
      }

      let data = {
        "user_no": userDetails.details.user_no,
        "device_id": currentDeviceId 
      };
      
      this.dataProvider.CheckDeviceLogInStatus(data).then(res => {
        // نتحقق فقط من نجاح الطلب
        if (res.success) {
          // يتم تسجيل الخروج "فقط" إذا كان هناك أمر صريح بالطرد أو إيقاف الحساب
          if (res.data && (res.data.is_logged_out == '1' || res.data.user.status == "0")) {
            this.logout();
          } 
        }
        // 🔴 تم حذف else if (!res.success) بالكامل لمنع الخروج العشوائي
        
      }, error => {
        // في حال انقطاع الإنترنت أو وجود خطأ عام، نتجاهل الأمر بصمت
        this.dataProvider.hideLoading();
      });
    }
  }

  async LogInDevice() {
    let userDetails = await this.storageSr.get("userloggedin");
    
    if (userDetails && userDetails.details) {

      let currentDeviceId = '';

      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        currentDeviceId = this.device.uuid;
      }

      if (!currentDeviceId || currentDeviceId === 'undefined' || currentDeviceId === null) {
          let browserId = await this.storageSr.get("browser_uuid");
          if (!browserId) {
              browserId = 'BRW-' + Math.random().toString(36).substr(2, 9).toUpperCase();
              await this.storageSr.set("browser_uuid", browserId);
          }
          currentDeviceId = browserId;
      }

      let data = {
        "user_no": userDetails.details.user_no,
        "device_id": currentDeviceId 
      };
      
      this.dataProvider.LogInSingleDevice(data).then(res => {
        console.log("Device Logged In:", res);  
      }, error => {
        this.dataProvider.hideLoading();
      });
    }
  }

  getAppStatus(){
    this.platform.pause.subscribe(async () => {
    });
    this.platform.resume.subscribe(async () => {
    });
  }
}