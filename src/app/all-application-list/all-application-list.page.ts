import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
  NavController,
  AlertController,
  PopoverController,
  ModalController,
  ActionSheetController
} from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { DatePipe } from '@angular/common';
import { AbsentApplicationApiService } from '../service/absent-application-api/absent-application-api.service';
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-all-application-list',
  templateUrl: './all-application-list.page.html',
  styleUrls: ['./all-application-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class AllApplicationListPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  userDetails: any;
  AllAvailableApplications = [];
  SelectedDate: any;
  showCalenderModal: boolean = false;

  calendarDate: string = '';

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    private datepipe: DatePipe,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    public popoverController: PopoverController,
    private router: Router,
    public modalCtrl: ModalController,
    public actionSheet: ActionSheetController,
    private absentApplicationApi: AbsentApplicationApiService,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // 🌟 توليد التاريخ المحلي الصافي YYYY-MM-DD لمنع مشكلة قفز الأشهر
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    this.calendarDate = `${year}-${month}-${day}`;
    this.SelectedDate = this.calendarDate;

    this.userDetails = await this.storageSr.get('userloggedin');
    this.getAbsentApplication();
  }

  async getAbsentApplication() {
    if (this.userDetails) {
      let data = {
        school_id: this.userDetails.details.school_id,
        datetime: this.SelectedDate
      };
      try {
        const res = await this.dataProvider.run(() => this.absentApplicationApi.getAbsentApplication(data));
        console.log(res);
        this.AllAvailableApplications = res.data;
        this.cdr.markForCheck();
      } catch (error) {
        this.dataProvider.showToast('error');
      }
    }
  }

  submitApplication(application, status) {
    let data = {
      school_id: this.userDetails.details.school_id,
      application_status: status, // 0 for pending, 1 for accept,2 for reject
      cid: application.cid,
      sid: application.sid,
      application_id: application.id
    };

    this.absentApplicationApi.AcceptAndRejectApplication(data).then(
      res => {
        console.log(res);
        if (res.success) {
          this.getAbsentApplication();
        } else {
          this.dataProvider.showToast(res.msg);
        }
      },
      error => {
        this.dataProvider.hideLoading();
        this.dataProvider.showToast('error');
      }
    );
  }

  hideCalenderModal() {
    this.showCalenderModal = false;
  }

  openCalenderModal() {
    this.showCalenderModal = true;
    // 🌟 تم حذف الكود القديم للبحث عن أسماء الأسهم هنا
  }

  onDaySelect(event: any) {
    if (event && event.detail && event.detail.value) {
      let selectedIsoDate = event.detail.value;

      // تحديث متغير العرض الخاص بالتقويم
      this.calendarDate = selectedIsoDate;
      // تحديث متغير السيرفر بعد قص التوقيت
      this.SelectedDate = selectedIsoDate.split('T')[0];

      this.getAbsentApplication();
      this.hideCalenderModal();
    }
  }

  ViewApplication(data) {
    const navigation: NavigationExtras = {
      state: { AppData: data }
    };
    this.router.navigate(['view-application-details'], navigation);
  }
}
