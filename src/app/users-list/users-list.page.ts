import {
  Component,
  OnInit,
  NgZone,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { FormsModule } from '@angular/forms';

import { UserSearchPipe } from '../pipes/user-search.pipe';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { UserType } from '../constants/user-type';
import { PermissionService } from '../service/permission/permission.service';
import { SpecialistQualificationModalComponent } from '../components/specialist-qualification-modal/specialist-qualification-modal.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.page.html',
  styleUrls: ['./users-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, UserSearchPipe, TranslatePipe]
})
export class UsersListPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  readonly UserType = UserType;
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
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef
  ) {
    // 🟢 3. جعل الاشتراك (subscribe) async لجلب البيانات بأمان عند العودة
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async params => {
      const navigationState = this.router.getCurrentNavigation()?.extras.state;
      if (navigationState) {
        let isUpdated = navigationState['isUpdated'];
        if (isUpdated) {
          let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة
          if (userLoggedIn) {
            this.userDetails = userLoggedIn;
            this.getUsers(false);
          }
        }
      }
      this.cdr.markForCheck();
    });

    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  // 🟢 4. استخدام التزامن للتخلص من الـ localStorage عند فتح الصفحة لأول مرة
  async ngOnInit() {
    this.show_loading = true;
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.getUsers();
    } else {
      this.show_loading = false;
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  trackByUser(index: number, user: any): any {
    return user?.user_no ?? index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  closeModal() {
    this.modalController.dismiss({
      dismissed: true
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
      school_id: this.userDetails.details.school_id,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    };

    this.schoolDirectoryApi.getAllUsers(data).then(
      res => {
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
        this.cdr.markForCheck();
      },
      error => {
        this.noUser = true;
        this.show_loading = false;
        console.log(error);
        this.cdr.markForCheck();
      }
    );
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      this.trimmedUsers = this.trimmedUsers.concat(this.selectedUsers.splice(0, 20));
      infiniteScroll.target.complete();
      this.cdr.markForCheck();
    }, 1000);
  }

  addNewUser() {
    this.router.navigate(['add-user']);
  }

  openEditPage(user: any) {
    console.log('nav user1111', user);
    const navigation: NavigationExtras = {
      state: { user: user }
    };
    this.router.navigate(['edit-user-profile'], navigation);
  }

  /** خطة إدارة حالات الطلاب Phase 3 — Admin-only, Viewer-role rows only
   * ("مكتب الخدمة الاجتماعية والنفسية"). Reuses this existing list instead
   * of adding a new nav item, per the plan's own design. */
  get isAdmin(): boolean {
    return this.permissionService.hasRole(UserType.Admin);
  }

  async openQualifications(event: Event, user: any) {
    event.stopPropagation();
    const modal = await this.modalController.create({
      component: SpecialistQualificationModalComponent,
      componentProps: { specialist: user },
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.6,
      handleBehavior: 'cycle',
      cssClass: 'lineone-bottom-sheet'
    });
    await modal.present();
  }
}
