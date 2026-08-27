import { Component, OnInit, NgZone, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-user-selection',
  // 🟢 إصلاح مسارات الملفات لكي لا يظهر خطأ (Module not found)
  templateUrl: './user-selection.page.html',
  styleUrls: ['./user-selection.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, NgClass, TranslatePipe]
})
// 🟢 إصلاح اسم الكلاس ليكون UserSelectionPage
export class UserSelectionPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }

  // المتغيرات التي تمرر من النافذة الأب (إن وجدت)
  @Input() preSelectedUsers: any[] = [];

  allUsers: any = [];
  filteredUsers: any = [];
  userDetails: any;
  selectedUsers: any = [];
  noUser = false;
  lang: any;
  show_loading: boolean = true;
  // Memoized mirror of selectedUsers' ids for O(1) isUserSelected() lookups
  // in the *ngFor row template instead of scanning the array per row per
  // change-detection cycle. Invalidated by reference (selectedUsers is
  // reassigned wholesale on init) and kept current directly in
  // toggleUserSelection() since that mutates the array in place.
  private selectedUserIdSet = new Set<string | number>();
  private selectedUserIdSetSourceRef: unknown = null;

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
    private storageSr: StorageService, // 🟢 حقن خدمة التخزين
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  // 🟢 استخدام التزامن للتخلص من الـ localStorage عند فتح الصفحة
  async ngOnInit() {
    this.show_loading = true;
    let userLoggedIn = await this.storageSr.get('userloggedin');

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
    this.cdr.markForCheck();
  }

  // 🟢 إغلاق النافذة المنبثقة دون حفظ التغييرات
  dismiss() {
    this.modalController.dismiss({
      dismissed: true
    });
  }

  // 🟢 إغلاق النافذة المنبثقة وإرسال المستخدمين المحددين للصفحة الأب
  confirmSelection() {
    this.modalController.dismiss({
      dismissed: false,
      selectedUsers: this.selectedUsers
    });
  }

  // 🟢 جلب جميع المستخدمين
  getUsers() {
    let data = {
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    this.schoolDirectoryApi
      .getAllSchoolUsers(data)
      .then(res => {
        this.show_loading = false;
        if (res.session) {
          this.allUsers = res.data;
          this.filteredUsers = [...this.allUsers]; // تهيئة القائمة المفلترة
        } else {
          this.noUser = true;
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.noUser = true;
        this.show_loading = false;
        this.cdr.markForCheck();
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
      this.cdr.markForCheck();
    }, 300); // 300ms Debounce
  }

  private syncSelectedUserIdSet() {
    this.selectedUserIdSetSourceRef = this.selectedUsers;
    this.selectedUserIdSet = new Set((this.selectedUsers || []).map((u: any) => u.user_no));
  }

  // 🟢 تحديد أو إلغاء تحديد المستخدم
  toggleUserSelection(user: any) {
    if (this.selectedUsers !== this.selectedUserIdSetSourceRef) {
      this.syncSelectedUserIdSet();
    }
    const index = this.selectedUsers.findIndex((u: any) => u.user_no === user.user_no);

    if (index > -1) {
      // المستخدم موجود بالفعل، نقوم بإزالته
      this.selectedUsers.splice(index, 1);
      this.selectedUserIdSet.delete(user.user_no);
    } else {
      // المستخدم غير موجود، نقوم بإضافته
      this.selectedUsers.push(user);
      this.selectedUserIdSet.add(user.user_no);
    }
  }

  // 🟢 التحقق مما إذا كان المستخدم محدد أم لا (يُستخدم في الـ HTML لتغيير الألوان)
  isUserSelected(user: any): boolean {
    if (this.selectedUsers !== this.selectedUserIdSetSourceRef) {
      this.syncSelectedUserIdSet();
    }
    return this.selectedUserIdSet.has(user.user_no);
  }
}
