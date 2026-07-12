import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.page.html',
  styleUrls: ['./users-list.page.scss'],
})
export class UsersListPage implements OnInit {
  allUsers: any = [];
  userDetails: any;
  selectedUsers: any = [];
  trimmedUsers: any = [];
  noUser = false;
  lang: any;
  show_loading: boolean = true;
  userSearchValue: string = '';

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
    private storageSr: StorageService // 🟢 2. حقن خدمة التخزين
  ) {
    // 🟢 3. جعل الاشتراك (subscribe) async لجلب البيانات بأمان عند العودة
    this.route.queryParams.subscribe(async params => {
      if (this.router.getCurrentNavigation() && this.router.getCurrentNavigation().extras.state) {
        let isUpdated = this.router.getCurrentNavigation().extras.state['isUpdated'];
        if (isUpdated) {
          let userLoggedIn = await this.storageSr.get("userloggedin"); // 👈 القراءة الآمنة
          if (userLoggedIn) {
            this.userDetails = userLoggedIn;
            this.getUsers(false);
          }
        }
      }
    });

    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
    });
  }

  // 🟢 4. استخدام التزامن للتخلص من الـ localStorage عند فتح الصفحة لأول مرة
  async ngOnInit() {
    this.show_loading = true;
    let userLoggedIn = await this.storageSr.get("userloggedin"); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.getUsers();
    } else {
      this.show_loading = false;
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  closeModal() {
    this.modalController.dismiss({
      'dismissed': true
    });
  }

  goBack() {
    this.navCtrl.navigateRoot(['/tabs', 'tab1'], { 
      animated: true, 
      animationDirection: 'back' 
    });
  }

  getUsers(loader = true) {
    let data = {
      'school_id': this.userDetails.details.school_id,
      'user_no': this.userDetails.details.user_no
    };
    
    this.dataProvider.getAllUsers(data).then(res => {
      this.show_loading = false;
      console.log('allUsersdata', res.data);
      
      if (res.session) {
        this.selectedUsers = res.data;
        if (this.selectedUsers.length > 1) {
          this.trimmedUsers = this.selectedUsers.splice(0, 20);
        } else {
          this.trimmedUsers = this.selectedUsers;
        }
      } else {
        this.noUser = true;
        console.log('err', res);
      }

    }, error => {
      this.noUser = true;
      this.show_loading = false;
      console.log(error);
    });
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      this.trimmedUsers = this.trimmedUsers.concat(this.selectedUsers.splice(0, 20));
      infiniteScroll.target.complete();
    }, 1000);
  }

  addNewUser() {
    this.router.navigate(['add-user']);
  }

  openEditPage(user) {
    console.log("nav user1111", user);
    const navigation: NavigationExtras = {
      state: { user: user }
    };
    this.router.navigate(['edit-user-profile'], navigation);
  }

}