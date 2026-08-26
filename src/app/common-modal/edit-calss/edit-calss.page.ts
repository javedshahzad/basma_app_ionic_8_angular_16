import {
  Component,
  Input,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavController, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { AuthService } from '../../service/auth/auth.service';
import { DataService } from '../../service/data/data.service';
import { DatabaseService } from '../../service/database/database.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { CreateClassPage } from '../../create-class/create-class.page';
import { SchoolDirectoryApiService } from '../../service/school-directory-api/school-directory-api.service';
import { RegistrationApiService } from '../../service/registration-api/registration-api.service';
import { CoursesApiService } from '../../service/courses-api/courses-api.service';

@Component({
  selector: 'app-edit-calss',
  templateUrl: './edit-calss.page.html',
  styleUrls: ['./edit-calss.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, TranslatePipe]
})
export class EditCalssPage {
  private destroyRef = inject(DestroyRef);

  trackByIndex(index: number): number {
    return index;
  }
  course: any;
  userDetails: any;
  lang: any;
  navData: any;
  teacherList: any = [];
  noTeacher = false;
  selectedTeacher: any = [];

  constructor(
    public navCtrl: NavController,
    // public app: App,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    //public events: Events,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    public zone: NgZone,
    private router: Router,
    public modalController: ModalController,
    private cdr: ChangeDetectorRef,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private registrationApi: RegistrationApiService,
    private coursesApi: CoursesApiService
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        this.navData = navigation.extras.state;
        this.course = this.navData.course;
        this.userDetails = this.navData.userDetails;
        //   console.log(this.navData);
        console.log('data', this.course, 'userfa', this.userDetails);
        this.getTeacher();
      }
      this.cdr.markForCheck();
    });
  }

  closeModal() {
    this.modalController.dismiss({
      dismissed: true
    });
  }

  getTeacher() {
    let data = {
      class_id: this.course.cid,
      school_id: this.userDetails.school_id,
      user_no: this.userDetails.user_no,
      session_id: this.userDetails.session_id
    };
    this.dataProvider
      .run(() => this.schoolDirectoryApi.getTeachers(data))
      .then(
        res => {
          console.log('teschers', res);
          if (res.session) {
            this.teacherList = res.data;
            this.selectedTeacher = res.data;
            if ((res.data || []).length < 1) {
              this.noTeacher = true;
            }
          } else {
            this.noTeacher = true;
            console.log('err', res);
          }
          this.cdr.markForCheck();
        },
        error => {
          this.noTeacher = true;
          console.log(error);
          this.cdr.markForCheck();
        }
      );
  }

  markTeacher(teacher: any, type: string, eve: any, id: string | number) {
    let is_checked = eve.srcElement.ariaChecked;
    console.log(teacher, type, id, is_checked);
    if (type == 'reg') {
      if (is_checked != 'true') {
        this.selectedTeacher[id].is_assign = 1;
        this.selectedTeacher[id].assign_as = 'regular';
        let elem = <HTMLFormElement>document.getElementById('spl' + id);
        elem['checked'] = false;
      } else {
        this.selectedTeacher[id].is_assign = 2;
        this.selectedTeacher[id].assign_as = 0;
        // this.popMarkedTeacher(data);
      }
    } else {
      if (is_checked != 'true') {
        this.selectedTeacher[id].is_assign = 1;
        this.selectedTeacher[id].assign_as = 'split';
        let elem = <HTMLFormElement>document.getElementById('reg' + id);
        elem['checked'] = false;
      } else {
        this.selectedTeacher[id].is_assign = 2;
        this.selectedTeacher[id].assign_as = 1;
      }
    }
    console.log(this.selectedTeacher);
  }

  submitTeacher() {
    let data = {
      teachersList: this.selectedTeacher,
      class_id: this.course.cid,
      school_id: this.userDetails.school_id,
      user_no: this.userDetails.user_no,
      session_id: this.userDetails.session_id
    };
    this.dataProvider
      .run(() => this.registrationApi.updateTeacher(data))
      .then(
        res => {
          console.log('teschers', res);
          if (res.session) {
            this.dataProvider.showToast(res.data || '');
            this.router.navigate(['tabs/classlist']);
          } else {
            this.dataProvider.showToast(res.message || '');
          }
        },
        error => {
          this.dataProvider.showToast(error);
          console.log(error);
        }
      );
  }

  deletClass() {
    let data = {
      class_id: this.course.cid,
      school_id: this.userDetails.school_id,
      user_no: this.userDetails.user_no,
      session_id: this.userDetails.session_id
    };
    this.dataProvider
      .run(() => this.coursesApi.deleteClass(data))
      .then(
        res => {
          console.log('teschers', res);
          if (res.session) {
            this.dataProvider.showToast(res.data || '');
            this.router.navigate(['tabs/classlist']);
          } else {
            this.dataProvider.showToast(res.message || '');
          }
        },
        error => {
          this.dataProvider.showToast(error);
          console.log(error);
        }
      );
  }
}
