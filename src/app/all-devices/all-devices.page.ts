import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { Router } from '@angular/router';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { DeviceApiService } from '../service/device-api/device-api.service';
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-all-devices',
  templateUrl: './all-devices.page.html',
  styleUrls: ['./all-devices.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllDevicesPage implements OnInit {
  trackByIndex(index: number): number { return index; }
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
    public deviceSr : Device,
    private deviceApi: DeviceApiService,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.userDetails = await this.storageSr.get("userloggedin");
    this.cdr.markForCheck();
  }

  ionViewWillEnter(){
    this.GetAlldevices();
  }

  GetAlldevices(){
    let data = {
      "user_no": this.userDetails.details.user_no,
    };
    this.dataProvider.run(() => this.deviceApi.GetAllDevices(data)).then(res => {
      console.log(res);

      // 🔴 التعديل السحري هنا:
      // نتحقق من وجود res.data، وإذا لم تكن موجودة نضع مصفوفة فارغة []
      this.All_available_devices = (res && res.data) ? res.data : [];
      this.cdr.markForCheck();
    },error=>{
      // 🔴 تأمين المتغير أيضاً في حال حدوث خطأ في الاتصال
      this.All_available_devices = [];
      this.dataProvider.showToast("حدث خطأ في جلب الأجهزة");
      this.cdr.markForCheck();
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
    let data = {
      "user_no": this.userDetails.details.user_no,
      "device_id": device.device_id
    };
    this.dataProvider.run(() => this.deviceApi.Delete_device(data)).then(res => {
      console.log(res);
      if(device.device_id == this.deviceSr.uuid){
        this.logout();
      }else{
        this.GetAlldevices();
      }
    },error=>{
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
    let data = {
      "user_no": this.userDetails.details.user_no
    };

    this.dataProvider.run(() => this.deviceApi.LogOutAllDevice(data)).then(res => {
      this.GetAlldevices();
    }).catch(error => {
      this.dataProvider.showToast("حدث خطأ أثناء تسجيل الخروج من الجميع");
    });
  }

  // ==========================================
  // 3️⃣ تسجيل الخروج العادي
  // ==========================================
  async logout() {
    let userDetail = await this.storageSr.get("userloggedin");
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