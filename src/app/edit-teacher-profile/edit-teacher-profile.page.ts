import { Component, NgZone, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, NavParams, AlertController, Platform, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
//import { TabsPage } from '../tabs/tabs';

import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { DeviceApiService } from '../service/device-api/device-api.service';
import { StorageService } from '../service/storage.service';
import { UserManagementApiService } from '../service/user-management-api/user-management-api.service';
import { CoursesApiService } from '../service/courses-api/courses-api.service';
import { UserType } from '../constants/user-type';
import { FormsModule } from '@angular/forms';
import { IonicSelectableComponent } from 'ionic-selectable';

import { HasRoleDirective } from '../directives/has-role.directive';

@Component({
  selector: 'app-edit-teacher-profile',
  templateUrl: './edit-teacher-profile.page.html',
  styleUrls: ['./edit-teacher-profile.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, IonicSelectableComponent, TranslatePipe, HasRoleDirective]
})
export class EditTeacherProfilePage {
  trackByIndex(index: number): number {
    return index;
  }
  readonly UserType = UserType;
  navData: any;
  lang: any;
  userDetails: any;
  teacher: any = {};
  classes: any = [];
  userType: any = '';
  private destroyRef = inject(DestroyRef);

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    public alertCtrl: AlertController,

    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    public platform: Platform,
    private deviceApi: DeviceApiService,
    private storageSr: StorageService,
    private userManagementApi: UserManagementApiService,
    private coursesApi: CoursesApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.navData = navigation.extras.state['teacher'];
        console.log(this.navData);
        this.teacher.email = this.navData.email_id;
        this.teacher.name = this.navData.first_name;
        this.teacher.user_id = this.navData.username;
        this.teacher.user_type = this.navData.user_type;
        this.teacher.class = this.navData.in_class;
        this.teacher.teacher_type = this.navData.assigned_as;
        this.teacher.status = this.navData.status;
        this.teacher.is_show_absent_students = this.navData.is_show_absent_students;
        this.teacher.is_show_absent_application_list = this.navData.is_show_absent_application_list;
        if (this.navData.TeacherAttenEditPower !== '0') {
          this.teacher.attendence_permit = true;
        }

        // نقسم على 60 لنعيد الوقت لشكله الأصلي (1) بدلاً من (60)
        this.teacher.time = this.navData.editTimeForTeacher ? this.navData.editTimeForTeacher / 60 : 0;
        this.teacher.action = 'active';
        this.cdr.markForCheck();
      }
    });
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
  }

  async ionViewWillEnter() {
    const userData = await this.storageSr.get('userloggedin');
    if (userData) {
      this.userDetails = userData;
      this.userType = this.userDetails.details.user_type;
      this.getClasses();
    }
    this.cdr.markForCheck();
  }
  check() {
    console.log(this.teacher.attendence_permit);
  }
  saveTeacherProfile() {
    if (this.teacher.password !== this.teacher.c_pass) {
      this.dataProvider.showToast(this.lang.pass_not_match);
    } else {
      this.teacher.user_no = this.navData.user_no;
      this.teacher.school_id = this.navData.school_id;
      this.teacher.updatedBy = this.userDetails.details.user_no;
      console.log('teacher', this.teacher);
      if (this.teacher.attendence_permit == true) {
        this.teacher.attendence_permit = 1;
      } else {
        this.teacher.attendence_permit = 0;
      }
      // 🟢 السلوك الأصلي يكمل التوجيه دائماً بغض النظر عن نجاح/فشل الطلب
      this.userManagementApi.updateTeacherProfile(this.teacher).finally(() => {
        if (this.teacher.status == '0' || (this.teacher.password != '' && this.teacher.c_pass)) {
          this.logoutDeviceFromAll();
        }
        const navigation: NavigationExtras = {
          state: {
            isUpdated: true
          }
        };
        console.log(navigation);
        this.zone.run(() => {
          this.router.navigate(['manage-teacher'], navigation);
        });
      });
    }
  }
  logoutDeviceFromAll() {
    let data = {
      user_no: this.navData.user_no
    };
    this.dataProvider
      .run(() => this.deviceApi.LogOutAllDevice(data))
      .then(
        res => {},
        error => {
          this.dataProvider.showToast('error');
        }
      );
  }
  async deleteTeacher() {
    const alert = await this.alertCtrl.create({
      header: this.lang.delete_teacher,
      backdropDismiss: true,
      mode: 'ios',
      buttons: [
        {
          text: this.lang.delete,
          handler: () => {
            let deleteData = {
              teacher_user_no: this.navData.user_no,
              user_no: this.userDetails.details.user_no,
              school_id: this.userDetails.details.school_id,
              session_id: this.userDetails.session_id
            };
            this.userManagementApi
              .deleteTeacher(deleteData)
              .then(res => {
                this.dataProvider.showToast(res.msg || '');
                const navigation: NavigationExtras = {
                  state: {
                    isUpdated: true
                  }
                };
                this.zone.run(() => {
                  this.router.navigate(['manage-teacher'], navigation);
                });
                console.log(res);
              })
              .catch(error => {
                console.log(error);
              });
          }
        },
        {
          text: this.lang.alert_btn_cancel_text,
          handler: () => {}
        }
      ]
    });
    await alert.present();
  }

  getClasses() {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };
    this.dataProvider
      .run(() => this.coursesApi.getCourses(data))
      .then(response => {
        if (response.session) {
          let all_classes_cid = [];
          (response.data || []).forEach(item => {
            all_classes_cid.push(item.cid);
          });
          this.classes = response.data || [];
          // this.classes.splice(0, 0, {name: 'Select All', cid: all_classes_cid});
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.dataProvider.errorALertMessage(error);
        this.cdr.markForCheck();
      });
  }

  portChange(event: any) {
    // alert(1)
    console.log('event', event);
    if (event) this.teacher.class = event.value;
  }
}
