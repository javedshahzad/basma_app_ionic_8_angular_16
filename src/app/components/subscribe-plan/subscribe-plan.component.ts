import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, Platform, PopoverController, ModalController, IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../service/auth/auth.service';
import { DataService } from '../../service/data/data.service';
import { DatabaseService } from '../../service/database/database.service';
import { Browser } from '@capacitor/browser';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../service/storage.service';
import { PlanApiService } from '../../service/plan-api/plan-api.service';

@Component({
  selector: 'app-subscribe-plan',
  templateUrl: './subscribe-plan.component.html',
  styleUrls: ['./subscribe-plan.component.scss'],
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscribePlanComponent implements OnInit {
  plans: any[] = [];
  PremiumPlan: any;
  availablePlan: any;
  userDetails: any;

  constructor(
    public navCtrl: NavController,
    public authProvider: AuthService,
    public dataProvider: DataService,
    public platform: Platform,
    public translate: TranslateService,
    private route: ActivatedRoute,
    public popoverController: PopoverController,
    private router: Router,
    public dbProvider: DatabaseService,
    public modalController: ModalController,
    private storageSr: StorageService,
    private planApi: PlanApiService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.userDetails = await this.storageSr.get('userloggedin');
    if (this.userDetails) {
      this.getPlan();
    }
  }
  closeModal() {
    this.modalController.dismiss();
    this.router.navigate(['tabs'], { replaceUrl: true });
  }
  getPlan() {
    let data = {
      userId: ''
    };
    this.planApi
      .getPlan(data)
      .then(res => {
        this.plans = res.response || [];
        let premium = this.plans.filter(p => p.slug == 'premium');
        this.PremiumPlan = premium[0];
        console.log(this.PremiumPlan);
        this.cdr.markForCheck();
      })
      .catch(e => {
        this.plans = e.plans;
        this.cdr.markForCheck();
      });
    this.getUserPlan();
  }
  getUserPlan() {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id
    };
    this.planApi
      .getUserPlan(data)
      .then((res: any) => {
        this.dataProvider.hideLoading();
        console.log('plan', res);
        if (res && res.response) {
          this.availablePlan = res.response;
          if (res.response.isExpire) {
            this.availablePlan.cardColor = 'rgb(249 169 5)';
          } else {
            this.availablePlan.cardColor = '#43a047';
          }
        } else {
          this.availablePlan = {};
        }
        this.cdr.markForCheck();
      })
      .catch(e => {
        this.cdr.markForCheck();
      });
  }
  continue() {
    this.modalController.dismiss();
    this.router.navigate(['tabs'], { replaceUrl: true });
  }
  gotoPlans() {
    this.modalController.dismiss();
    this.router.navigate(['/available-plan']);
  }
  async openUrl(url: string) {
    await Browser.open({ url: url });
  }

  async openPDF() {
    // await Browser.open({ url:url });
    // var pdfUrl: string = window.location.origin + '/assets/imgs/appmanual.pdf';
    // window.open('https://basmapp.com/appmanual.pdf', '_blank');
    await Browser.open({ url: 'https://basmapp.com/appmanual.pdf' });
  }

  async opentOs() {
    // await Browser.open({ url:url });
    // var pdfUrl: string = window.location.origin + '/assets/imgs/appmanual.pdf';
    // window.open('https://basmapp.com/appmanual.pdf', '_blank');
    await Browser.open({ url: 'https://basmapp.com/tOs.html' });
  }

  async openPp() {
    // await Browser.open({ url:url });
    // var pdfUrl: string = window.location.origin + '/assets/imgs/appmanual.pdf';
    // window.open('https://basmapp.com/appmanual.pdf', '_blank');
    await Browser.open({ url: 'https://basmapp.com/Pp.html' });
  }
}
