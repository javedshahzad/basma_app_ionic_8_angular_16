import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { Camera, CameraResultType, CameraSource, ImageOptions } from '@capacitor/camera';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { AbsentApplicationApiService } from '../service/absent-application-api/absent-application-api.service';

@Component({
  selector: 'app-submit-absent-application',
  templateUrl: './submit-absent-application.page.html',
  styleUrls: ['./submit-absent-application.page.scss'],
})
export class SubmitAbsentApplicationPage implements OnInit {
  trackByIndex(index: number): number { return index; }
  UserData: any;
  absentDates: any;
  absentSeminars: any;
  seminarsList = [];
  selectedDate: any = '';
  selectedSeminar = [];
  notes: any = "";
  userDetails: any;
  lang: any;
  ImgData: string = "";

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    public network: Network,
    private route: ActivatedRoute,
    private router: Router,
    private platform: Platform, // 🟢 لحماية التقاط الصور
    private storageSr: StorageService, // 🟢 2. حقن الخدمة
    private absentApplicationApi: AbsentApplicationApiService
  ) {
    // 🟢 3. استخراج البيانات من الـ Router بشكل متزامن قبل ضياعها
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.UserData = navigation.extras.state['user'];
      this.absentDates = navigation.extras.state['absentDates'];
      this.absentSeminars = navigation.extras.state['absentSeminars'];
    }
  }

  // 🟢 4. استخدام async/await لجلب البيانات والتخلص من localStorage
  async ngOnInit() {
    this.translate.get("alertmessages").subscribe((val) => {
      this.lang = val;
    });

    // جلب بيانات المستخدم بأمان
    let userLoggedIn = await this.storageSr.get("userloggedin");
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
      return;
    }

    // 🟢 حماية بيانات الـ Router من الضياع عند الـ Refresh (مثل ما فعلنا في صفحة العرض)
    if (this.UserData) {
      await this.storageSr.set('submitAppData', {
        user: this.UserData,
        dates: this.absentDates,
        seminars: this.absentSeminars
      });
    } else {
      let savedData = await this.storageSr.get('submitAppData');
      if (savedData) {
        this.UserData = savedData.user;
        this.absentDates = savedData.dates;
        this.absentSeminars = savedData.seminars;
      } else {
        this.navCtrl.back(); // العودة إذا لم يكن هناك أي بيانات
      }
    }
  }

  OnchangeDate(event) {
    const value = event.detail.value;
    this.selectedDate = this.absentDates[value];
    this.seminarsList = this.absentSeminars[value];
    
    // تفريغ اختيار الحصص عند تغيير التاريخ
    this.selectedSeminar = [];
  }

  OnchangeSeminar(event) {
    const value = event.detail.value;
    const semsList = [];
    
    value.forEach(element => {
      const numMatch = String(element).match(/\d+/);
      if (numMatch) {
        semsList.push(numMatch[0]);
      } else {
        semsList.push(element);
      }
    });
    
    this.selectedSeminar = semsList;
  }

  async submitApplication() {
    if (!this.selectedDate || this.selectedSeminar.length === 0) {
      this.dataProvider.showToast("يجب تحديد التاريخ والحصص لتقديم الطلب!");
      return; 
    }

    const data = {
      "absent_date": this.selectedDate,
      "absent_seminars": this.selectedSeminar,
      "absent_notes": this.notes,
      "cid": this.UserData.cid,
      "sid": this.UserData.sid,
      "school_id": this.userDetails.details.school_id,
      "student_id": this.UserData.student_id,
      "student_name": this.UserData.student_name,
      "submitted_by": this.userDetails.details.user_no,
      "imageData": this.ImgData
    };

    try {
      let res: any = await this.dataProvider.run(() => this.absentApplicationApi.saveAbsentApplication(data));
      this.dataProvider.showToast(res.msg);

      if (res.success) {
        // تنظيف البيانات المؤقتة بعد الإرسال الناجح
        await this.storageSr.remove('submitAppData');
        setTimeout(() => {
          this.navCtrl.back();
        }, 1000);
      }
    } catch (error) {
      this.dataProvider.showToast("حدث خطأ أثناء الاتصال بالخادم");
    }
  }

  async takePicture() {
    // 🟢 حماية الكاميرا للعمل فقط إذا كان هناك إنترنت، لأن السيرفر يحتاج لرفع الصورة فوراً
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      if (this.network.type === this.network.Connection.NONE || this.network.type === this.network.Connection.UNKNOWN) {
        this.dataProvider.showToast(this.lang?.no_internet || 'لا يوجد اتصال بالإنترنت');
        return;
      }
    }

    const alert = await this.alertCtrl.create({
      header: this.lang?.image_option || 'اختر الصورة',
      buttons: [
        {
          text: this.lang?.camera || 'الكاميرا',
          handler: () => {
            this.openCamera();
          }
        },
        {
          text: this.lang?.gallery || 'المعرض',
          handler: () => {
            this.openGallery();
          }
        }
      ]
    });
    await alert.present();
  }

  openCamera() {
    const options: ImageOptions = {
      quality: 90,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 800, 
      allowEditing: false,
    };

    Camera.getPhoto(options).then((imageData) => {
      if (imageData && imageData.base64String) {
        this.ImgData = 'data:image/jpeg;base64,' + imageData.base64String;
      }
    }).catch(err => console.log('Camera cancelled', err));
  }

  openGallery() {
    const options: ImageOptions = {
      quality: 90,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 800,
      allowEditing: false,
    };

    Camera.getPhoto(options).then((imageData) => {
      if (imageData && imageData.base64String) {
        this.ImgData = 'data:image/jpeg;base64,' + imageData.base64String;
      }
    }).catch(err => console.log('Gallery cancelled', err));
  }
  
  removeImage() {
    this.ImgData = "";
  }
}