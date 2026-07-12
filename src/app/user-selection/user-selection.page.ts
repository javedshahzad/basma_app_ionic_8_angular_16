import { Component, OnInit, NgZone, Input } from '@angular/core';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-user-selection',
  // 🟢 إصلاح مسارات الملفات لكي لا يظهر خطأ (Module not found)
  templateUrl: './user-selection.page.html',
  styleUrls: ['./user-selection.page.scss'],
})
// 🟢 إصلاح اسم الكلاس ليكون UserSelectionPage
export class UserSelectionPage implements OnInit {
  
  // المتغيرات التي تمرر من النافذة الأب (إن وجدت)
  @Input() preSelectedUsers: any[] = [];
  
  allUsers: any = [];
  filteredUsers: any = [];
  userDetails: any;
  selectedUsers: any = [];
  noUser = false;
  lang: any;
  show_loading: boolean = true;
  
  // متغيرات البحث
  searchQuery: string = '';
  searchTimeout: any;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public zone: NgZone,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private router: Router,
    public modalController: ModalController,
    private storageSr: StorageService // 🟢 حقن خدمة التخزين
  ) {
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
    });
  }

  // 🟢 استخدام التزامن للتخلص من الـ localStorage عند فتح الصفحة
  async ngOnInit() {
    this.show_loading = true;
    let userLoggedIn = await this.storageSr.get("userloggedin"); 

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      
      // إذا تم تمرير مستخدمين محددين مسبقاً، نقوم بتخزينهم
      if (this.preSelectedUsers && this.preSelectedUsers.length > 0) {
        this.selectedUsers = [...this.preSelectedUsers];
      }
      
      this.getUsers();
    } else {
      this.show_loading = false;
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  // 🟢 إغلاق النافذة المنبثقة دون حفظ التغييرات
  dismiss() {
    this.modalController.dismiss({
      'dismissed': true
    });
  }

  // 🟢 إغلاق النافذة المنبثقة وإرسال المستخدمين المحددين للصفحة الأب
  confirmSelection() {
    this.modalController.dismiss({
      'dismissed': false,
      'selectedUsers': this.selectedUsers
    });
  }

  // 🟢 جلب جميع المستخدمين
  getUsers() {
    let data = {
      'school_id': this.userDetails.details.school_id,
      'user_no': this.userDetails.details.user_no
    };
    
    this.dataProvider.getAllSchoolUsers(data).then(res => {
      this.show_loading = false;
      if (res.session) {
        this.allUsers = res.data;
        this.filteredUsers = [...this.allUsers]; // تهيئة القائمة المفلترة
      } else {
        this.noUser = true;
      }
    }).catch(error => {
      this.noUser = true;
      this.show_loading = false;
    });
  }

  // 🟢 دالة البحث المحلية (لا تضغط على السيرفر)
  searchUser() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      if (!this.searchQuery || this.searchQuery.trim() === '') {
        this.filteredUsers = [...this.allUsers];
        return;
      }
      
      const searchTerm = this.searchQuery.toLowerCase();
      this.filteredUsers = this.allUsers.filter((user: any) => {
        // البحث بالاسم الأول أو اسم المستخدم
        const nameMatch = user.first_name ? user.first_name.toLowerCase().includes(searchTerm) : false;
        const userMatch = user.username ? user.username.toLowerCase().includes(searchTerm) : false;
        return nameMatch || userMatch;
      });
    }, 300); // 300ms Debounce
  }

  // 🟢 تحديد أو إلغاء تحديد المستخدم
  toggleUserSelection(user: any) {
    const index = this.selectedUsers.findIndex((u: any) => u.user_no === user.user_no);
    
    if (index > -1) {
      // المستخدم موجود بالفعل، نقوم بإزالته
      this.selectedUsers.splice(index, 1);
    } else {
      // المستخدم غير موجود، نقوم بإضافته
      this.selectedUsers.push(user);
    }
  }

  // 🟢 التحقق مما إذا كان المستخدم محدد أم لا (يُستخدم في الـ HTML لتغيير الألوان)
  isUserSelected(user: any): boolean {
    return this.selectedUsers.findIndex((u: any) => u.user_no === user.user_no) > -1;
  }
}