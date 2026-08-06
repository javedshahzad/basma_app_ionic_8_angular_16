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
import { NavController, Platform, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { DataService } from '../service/data/data.service';

import { UserSelectionPage } from '../user-selection/user-selection.page';

import { CameraResultType, Camera, ImageOptions, CameraSource } from '@capacitor/camera';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { environment } from '../../environments/environment';

// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

import { AuthService } from '../service/auth/auth.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { MessagingApiService } from '../service/messaging-api/messaging-api.service';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

const env = environment;

@Component({
    selector: 'app-sendmessage',
    templateUrl: './sendmessage.page.html',
    styleUrls: ['./sendmessage.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, NgIf, NgFor, TranslatePipe]
})
export class SendmessagePage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  private destroyRef = inject(DestroyRef);
  mail: any = {
    send_to: {
      parents: false,
      mod: false,
      tech: false,
      others: false,
      admin: false,
      viewer: false,
      students: false
    },
    title: '',
    notification: '',
    useremailorid: '',
    selected_users: []
  };
  lang: any = {};
  userDetails: any = {};
  ticketImage: string = '';
  users: any = [];
  selectedUsers: any;
  mediaType: any;
  selectedUsersShow: any = [];
  formdata: any = new FormData();
  show_spinner: boolean = false;
  sendTo: any[] = [];
  sendToUers: any[] = [];
  blob: any;

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    public alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين
    public authProvider: AuthService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private messagingApi: MessagingApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.dataProvider.selectedUsers.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      this.mail.selected_users = res.selectedUsers;
      this.selectedUsersShow = res.selectedUsersShow;
      console.log(this.mail.selected_users);
      console.log(res);
      this.cdr.markForCheck();
    });

    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    this.translate.get('sendmsg').subscribe(res => {
      this.sendToUers.push({ name: res.parent, value: true, user_id: 'parents' });
      this.sendToUers.push({ name: res.mod, value: true, user_id: 'mod' });
      this.sendToUers.push({ name: res.admin, value: true, user_id: 'admin' });
      this.sendToUers.push({ name: res.viewer, value: true, user_id: 'viewer' });
      this.sendToUers.push({ name: res.teachers, value: true, user_id: 'tech' });
      this.sendToUers.push({ name: res.students, value: true, user_id: 'students' });
      this.sendToUers.push({ name: res.users, value: true, user_id: 'others' });
      this.sendTo = this.sendToUers;
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {}

  // 🟢 3. جعل الدالة async لاستخدام StorageService بدلاً من localStorage
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.ticketImage = '';
      this.getUsers();
    } else {
      this.authProvider.flushLocalStorage(); // تأكد من وجود دالة flushLocalStorage في authProvider أو قم بتغييرها
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  get isAnyCheckboxSelected(): boolean {
    const s = this.mail.send_to;
    return s.parents || s.mod || s.tech || s.others || s.admin || s.viewer || s.students;
  }

  async openUserSelection() {
    const modal = await this.modalCtrl.create({
      component: UserSelectionPage,
      componentProps: {
        usersList: this.users,
        preSelectedUsers: this.mail.selected_users
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {
      this.mail.selected_users = data;
    }
    this.cdr.markForCheck();
  }

  async selectUserpage() {
    const navigation: NavigationExtras = {
      state: this.users,
      queryParams: {
        selectedUsers: this.mail.selected_users,
        selectedUsersShow: this.selectedUsersShow
      }
    };
    this.zone.run(() => {
      this.router.navigate(['select-message-user'], navigation);
    });
  }

  moveBack() {
    this.router.navigate(['tabs/messages']);
  }

  async getUsers() {
    let data = {
      school_id: this.userDetails.details.school_id
    };
    try {
      const res = await this.dataProvider.run(() => this.schoolDirectoryApi.getAllSchoolUsers(data));
      if (res.data) {
        this.users = res.data;
      }
    } catch (error) {
      this.dataProvider.showToast(error);
      console.log(error);
    }
    this.cdr.markForCheck();
  }

  sendMessage() {
    if (!this.isAnyCheckboxSelected) {
      this.dataProvider.showToast(this.lang.select_user);
      return;
    }

    if (this.mail.notification && this.mail.notification.trim() == '') {
      this.dataProvider.showToast(this.lang.enter_noti_desc);
      return;
    }

    if (this.mail.notification.length > 140) {
      this.dataProvider.showToast(this.lang.max_body);
      return;
    }

    if (this.mail.send_to.others && (!this.mail.selected_users || this.mail.selected_users.length < 1)) {
      this.dataProvider.showToast(this.lang.enter_email_userid);
      return;
    }

    // 🟢 4. تبسيط مسار إرسال الرسالة بعد التأكد من صحة البيانات
    let isemailvar = this.mail.send_to.others ? 1 : 2;

    let data = {
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      notification: this.mail,
      isemail: isemailvar,
      school_id: this.userDetails.details.school_id
    };

    this.show_spinner = true;
    this.startUpload(this.ticketImage, data);
  }

  uploadToServer(data, imgBlob?: any, fileName?: any) {
    this.formdata = new FormData();

    this.formdata.append('user_no', data.user_no);
    this.formdata.append('session_id', this.userDetails.session_id);

    if (!data.notification.title || data.notification.title.trim() === '') {
      data.notification.title = 'إشعار إداري';
    }

    Object.keys(data.notification).map(key => {
      if (key == 'send_to') {
        Object.keys(data.notification[key]).map(send_to_key => {
          this.formdata.append('notification[' + key + '][' + send_to_key + ']', data.notification[key][send_to_key]);
        });
      } else if (key == 'selected_users') {
        let usersArray = data.notification[key];
        if (Array.isArray(usersArray) && usersArray.length > 0) {
          let idsString = usersArray.map(u => u.user_id || u.id || u.user_no).join(',');
          this.formdata.append('notification[' + key + ']', idsString);
        } else {
          this.formdata.append('notification[' + key + ']', '');
        }
      } else {
        this.formdata.append('notification[' + key + ']', data.notification[key]);
      }
    });

    this.formdata.append('isemail', data.isemail);
    this.formdata.append('school_id', this.userDetails.details.school_id);

    if (imgBlob) {
      this.formdata.append('file', imgBlob, fileName);
    }

    this.messagingApi.sendMessage(this.formdata, data.school_id).subscribe(
      res => {
        this.show_spinner = false;
        this.dataProvider.showToast(this.lang.msg_sent_success);
        this.resetForm();
        this.router.navigate(['tabs/messages']);
        this.cdr.markForCheck();
      },
      e => {
        this.show_spinner = false;
        this.resetForm();
        this.router.navigate(['tabs/messages']);
        this.dataProvider.showToast(this.lang.usnexpectedError);
        this.cdr.markForCheck();
      }
    );
  }

  resetForm() {
    this.mail = {
      send_to: {
        parents: false,
        mod: false,
        tech: false,
        others: false,
        admin: false,
        viewer: false,
        students: false
      },
      title: '',
      notification: '',
      useremailorid: '',
      selected_users: []
    };
    this.ticketImage = '';
  }

  startUpload(imgEntry, data) {
    if (imgEntry) {
      this.blob = this.dataProvider.base64toBlob(imgEntry, 'jpg');
      this.readFile('', data);
    } else {
      this.uploadToServer(data);
    }
  }

  readFile(file: any, data) {
    this.uploadToServer(data, this.blob, this.dataProvider.generateRandomFileName('jpg'));
  }

  portChange(event) {
    let send_to = {
      parents: false,
      mod: false,
      tech: false,
      others: false,
      admin: false,
      viewer: false,
      students: false
    };
    event.value.forEach(res => {
      send_to[res.user_id] = true;
      this.mail.send_to = send_to;
    });
  }

  async takePicture() {
    const alert = await this.alertCtrl.create({
      header: this.lang.image_option,
      buttons: [
        {
          text: this.lang.camera,
          handler: () => {
            this.openCamera();
          }
        },
        {
          text: this.lang.gallery,
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
      quality: 100,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    };

    Camera.getPhoto(options).then(imageData => {
      if (imageData) {
        this.ticketImage = imageData.base64String;
        this.mediaType = 'image/jpg';
      }
      this.cdr.markForCheck();
    });
  }

  openGallery() {
    const options: ImageOptions = {
      quality: 100,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos
    };

    Camera.getPhoto(options).then(imageData => {
      if (imageData) {
        this.ticketImage = imageData.base64String;
        this.mediaType = 'image/jpg';
      }
      this.cdr.markForCheck();
    });
  }

  checkUserList() {}
}
