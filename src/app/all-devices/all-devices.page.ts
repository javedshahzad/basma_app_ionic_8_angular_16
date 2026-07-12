import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { Router } from '@angular/router';
import { Device } from '@awesome-cordova-plugins/device/ngx';

@Component({
  selector: 'app-all-devices',
  templateUrl: './all-devices.page.html',
  styleUrls: ['./all-devices.page.scss'],
})
export class AllDevicesPage implements OnInit {
  userDetails: any;
  All_available_devices=[];

  // ==========================================
  // المتغيرات للتحكم في النوافذ المنبثقة (Modals)
  // ==========================================
  showDeleteModal: boolean = false;
  deviceToDelete: any = null;
  showLogoutAllModal: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public dataProvider: DataService,
    public authProvider: AuthService, 
    private router:Router,
    public deviceSr : Device
  ) { }

  ngOnInit() {
    this.userDetails = JSON.parse(localStorage.getItem("userloggedin"));
  }

  ionViewWillEnter(){
    this.GetAlldevices();
  }

  GetAlldevices(){
    this.dataProvider.showLoading();
    let data = {
      "user_no": this.userDetails.details.user_no,
    };
    this.dataProvider.GetAllDevices(data).then(res => {
      console.log(res);
      
      // 🔴 التعديل السحري هنا: 
      // نتحقق من وجود res.data، وإذا لم تكن موجودة نضع مصفوفة فارغة []
      this.All_available_devices = (res && res.data) ? res.data : [];
      
      this.dataProvider.hideLoading();
    },error=>{
      // 🔴 تأمين المتغير أيضاً في حال حدوث خطأ في الاتصال
      this.All_available_devices = [];
      this.dataProvider.hideLoading();
      this.dataProvider.showToast("حدث خطأ في جلب الأجهزة");
    })
  }

  // ==========================================
  // 1️⃣ دوال نافذة حذف جهاز واحد
  // ==========================================
  deletedDevice(device) {
    this.deviceToDelete = device;
    this.showDeleteModal = true; // إظهار النافذة
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deviceToDelete = null;
  }

  confirmDelete() {
    if (this.deviceToDelete) {
      this.showDeleteModal = false;
      this.executeDeleteDevice(this.deviceToDelete); // تنفيذ الحذف الفعلي
    }
  }

  // عملية الحذف الفعلية
  executeDeleteDevice(device) {
    this.dataProvider.showLoading();
    let data = {
      "user_no": this.userDetails.details.user_no,
      "device_id": device.device_id
    };
    this.dataProvider.Delete_device(data).then(res => {
      console.log(res);
      if(device.device_id == this.deviceSr.uuid){
        this.logout();
      }else{
        this.GetAlldevices();
      }
    },error=>{
      this.dataProvider.hideLoading();
      this.dataProvider.showToast("error");
    })
  }

  // ==========================================
  // 2️⃣ دوال نافذة تسجيل الخروج من الجميع
  // ==========================================
  logoutDeviceFromAll() {
    this.showLogoutAllModal = true; // إظهار النافذة
  }

  closeLogoutAllModal() {
    this.showLogoutAllModal = false;
  }

  confirmLogoutAll() {
    this.showLogoutAllModal = false;
    this.executeLogoutAll(); // تنفيذ الخروج الفعلي
  }

  // عملية الخروج من الجميع الفعلية
  executeLogoutAll() {
    this.dataProvider.showLoading();
    let data = {
      "user_no": this.userDetails.details.user_no
    };
    
    if (this.dataProvider.LogOutAllDevice) {
      this.dataProvider.LogOutAllDevice(data).then(res => {
        this.GetAlldevices();
        this.dataProvider.hideLoading();
      }).catch(error => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast("حدث خطأ أثناء تسجيل الخروج من الجميع");
      });
    } else {
      this.dataProvider.hideLoading();
      console.warn("LogOutAllDevice is not defined in DataService");
      this.dataProvider.showToast("عذراً، دالة الحذف للجميع غير متوفرة حالياً في ملف الخدمات");
    }
  }

  // ==========================================
  // 3️⃣ تسجيل الخروج العادي
  // ==========================================
  logout() {
    let userDetail = JSON.parse(localStorage.getItem("userloggedin"));
    let data = {
      "user_no": userDetail.details.user_no,
      "session_id": userDetail.session_id
    }
    this.authProvider.doLogout(data).then((resp) => {
    this.router.navigate(['login'],{replaceUrl:true})
    }).catch((error) => {
      this.dataProvider.hideLoading();
    })
  }
}