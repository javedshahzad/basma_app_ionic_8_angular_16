import { Component, OnInit, Input, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { NavController, Platform } from '@ionic/angular';
import { AuthService } from '@services/auth/auth.service';
import { DatabaseService } from '@services/database/database.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '@services/storage.service';

@Component({
  selector: 'app-edit-student-profile',
  templateUrl: './edit-student-profile.component.html',
  styleUrls: ['./edit-student-profile.component.scss'], // إضافة هذا السطر
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditStudentProfileComponent implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  @Input() student: any;
  @Input() classes: any;
  loggedinUser: any;
  userDetails: any;
  currentUser: any;
  studentName: any;
  studentSemester: any;
  user: {
    email_id: '';
    password: '';
  };
  currentUserEmail: any;
  constructor(
    public popoverController: PopoverController,
    public navCtrl: NavController,
    public authProvider: AuthService,
    public platform: Platform,
    // public events: Events,
    public translate: TranslateService,
    private route: ActivatedRoute,
    public zone: NgZone,
    private router: Router,
    public dbProvider: DatabaseService,
    private storageSr: StorageService
  ) {}

  async ngOnInit() {
    this.studentName = this.student.name;
    this.classes.forEach((res: any) => {
      if (res.name == this.student.course_name) {
        this.studentSemester = res.cid;
      }
    });
    //	console.log(this.student,this.classes,this.studentSemester,this.studentName);
    const userData = await this.storageSr.get('userloggedin');
    if (userData) {
      // console.log('logged in');
      this.userDetails = userData;
      this.currentUser = this.userDetails.details.username;
      this.currentUserEmail = this.userDetails.details.email_id;
      // console.log('th',this.currentUser);
    }
    const earlyLogin = localStorage.getItem('earlyLogin');
    if (earlyLogin) {
      this.loggedinUser = JSON.parse(earlyLogin);
      // console.log(this.loggedinUser);
    }
  }
  closeModal() {
    this.popoverController.dismiss();
  }

  saveChanges() {
    const inputElement = document.getElementById('input') as HTMLInputElement;
    let i = inputElement.value;
    const select = document.getElementById('select') as HTMLInputElement;
    let s = select.value;
    let data = {
      student: this.student,
      studentName: i,
      studentSemester: s
    };
    //	console.log(data);
    this.popoverController.dismiss(data);
  }

  deleteClass() {
    let data = {
      student: this.student,
      deleteClass: true
    };
    this.popoverController.dismiss(data);
  }
}
