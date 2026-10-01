import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NavController, Platform, AlertController, ModalController, IonicModule } from '@ionic/angular';
import { Location, NgClass, DatePipe } from '@angular/common';
import { DataService } from '../service/data/data.service';
import { SubscriptionService } from '../service/subscription/subscription.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import 'cordova-plugin-purchase/www/store';
import { DurationSubscriptionComponent } from '../duration-subscription/duration-subscription.component';
import { PlanReceiptComponent } from '../plan-receipt/plan-receipt.component';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { PlanApiService } from '../service/plan-api/plan-api.service';
import { usableUserPlan } from '../service/plan-api/available-plan';
import { UserType } from '../constants/user-type';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-available-plan',
  templateUrl: './available-plan.page.html',
  styleUrls: ['./available-plan.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, NgClass, FormsModule, DatePipe, TranslatePipe]
})
export class AvailablePlanPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  lang: any;
  plans: any = [];

  // 🟢 إعطاء بنية افتراضية فارغة لحماية HTML من الانهيار قبل وصول البيانات الحقيقية
  userDetails: any = { details: { is_school_admin: 0 } };

  availablePlan: any = {
    plan: { slug: '' },
    exp_date: '',
    billingPeriodUnit: ''
  };

  monthly_plan_ammount: number = 1.99;
  yearly_plan_ammount: number = 19.99;
  StoreProducts: any[]; // CdvPurchase.Product[];

  // --- متغيرات نافذة كود التفعيل (Voucher Modal) ---
  showVoucherModal: boolean = false;
  voucherCode: string = '';

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    private ref: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private platfrm: Platform,
    public alertCtrl: AlertController,
    private subscriptionService: SubscriptionService,
    private location: Location,
    public modalController: ModalController,
    private storageSr: StorageService, // 🟢 حقن الخدمة
    private planApi: PlanApiService
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.ref.markForCheck();
    });
  }

  // 🟢 استخدام التزامن لجلب البيانات بأمان عند فتح الصفحة
  async ngOnInit() {
    let userLoggedIn = await this.storageSr.get('userloggedin');
    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      if (this.userDetails.details.user_type === UserType.Admin) {
        this.monthly_plan_ammount = 5.99;
        this.yearly_plan_ammount = 39.99;
      }
      this.getUserPlan();
    }
    //this.getPlan();
    this.ref.markForCheck();
  }

  getPlan() {
    let data = { userId: '' };
    this.planApi
      .getPlan(data)
      .then((res: any) => {
        if (res && res.response) {
          this.plans = res.response;
          const sortOrder = ['Basic Plan: Free', 'Standard Plan', 'Premium Plan'];
          this.plans = this.plans.sort((a: any, b: any) => sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name));
        }
        this.ref.markForCheck();
      })
      .catch(e => {
        console.log('Error fetching plans:', e);
        this.ref.markForCheck();
      });
  }

  getUserPlan() {
    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id
    };

    this.dataProvider
      .run(() => this.planApi.getUserPlan(data))
      .then(async (res: any) => {
        const userPlan = usableUserPlan(res?.response);
        if (userPlan) {
          this.availablePlan = userPlan;
          this.availablePlan.cardColor = userPlan.isExpire ? 'rgb(249 169 5)' : '#43a047';
          // حفظ الخطة المحدثة في الذاكرة لتستخدمها العمليات الأخرى
          await this.storageSr.set('availablePlan', this.availablePlan);
        } else {
          this.availablePlan = { plan: { slug: '' } };
        }
        this.ref.markForCheck();
      })
      .catch(e => {
        this.ref.markForCheck();
      });
  }

  subscribe(data: any, i: number) {
    var p = 0;
    if (this.userDetails.details.user_type === UserType.Admin) {
      if (data.slug == 'standard') {
        p = 0;
        this.durationSubscription('Standard', p, data);
      } else if (data.slug == 'premium') {
        p = 1;
        this.durationSubscription('Premium', p, data);
      } else if (data.slug == 'free') {
        this.subcribeToServerFreePlan();
      }
    }
  }

  async durationSubscription(subscribeName: string, option: any, subscribe_data: any) {
    const modal = await this.modalController.create({
      component: DurationSubscriptionComponent,
      backdropDismiss: true,
      initialBreakpoint: 0.45,
      breakpoints: [0, 0.45, 0.75],
      cssClass: 'half-modal',
      componentProps: {
        subscriptionName: subscribeName,
        subscriptionOption: option,
        subscriptionData: JSON.stringify(this.plans)
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      var p = -1;
      if (data.name == 'Standard') {
        var selectedPlan = data.selectedPlan;
        var months = data.month;
        p = data.month == '1' ? 0 : 2;
        this.showreceiptModal(months, selectedPlan, p, subscribe_data);
      } else if (data.name == 'Premium') {
        var selectedPlan = data.selectedPlan;
        var months = data.month;
        p = data.month == '1' ? 1 : 3;
        this.showreceiptModal(months, selectedPlan, p, subscribe_data);
      }
    }
  }

  async showreceiptModal(months: any, selectedPlan: any, p: number, subscribe_data: any) {
    const modal = await this.modalController.create({
      component: PlanReceiptComponent,
      mode: 'ios',
      backdropDismiss: false,
      cssClass: 'plan-receipt-modal',
      componentProps: {
        selectedPlan: JSON.stringify(selectedPlan),
        isSuccess: false
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.isConfirm) {
      this.subscriptionService.checkout(p, selectedPlan);
    }
  }

  openPdf() {
    window.open('https://webapp.ws/Att-App/cpanel/uploads/stu_pdf/for_example.pdf', '_system');
  }

  // --- فتح وإغلاق نافذة كود التفعيل ---
  openVoucherModal() {
    this.showVoucherModal = true;
  }

  closeVoucherModal() {
    this.showVoucherModal = false;
    setTimeout(() => {
      this.voucherCode = '';
      this.ref.markForCheck();
    }, 300);
  }

  // --- دالة تطبيق الكود السحرية والمحصنة ---
  async applyVoucherCode() {
    if (!this.voucherCode || this.voucherCode.trim() === '') {
      this.dataProvider.showToast(this.lang.enter_activation_code || 'الرجاء إدخال كود التفعيل');
      return;
    }

    // 🟢 قراءة الخطة الآمنة من خدمة التخزين بدلاً من localStorage
    let storedPlan = await this.storageSr.get('availablePlan');

    let data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      code: this.voucherCode,
      plan_id: storedPlan?.plan?.id || this.availablePlan?.plan?.id || 1 // تعيين افتراضي لمنع الأخطاء
    };

    this.dataProvider
      .run(() => this.planApi.ApplyVoucherCode(data))
      .then(res => {
        if (res.success) {
          this.dataProvider.showToast(res.msg || '');
          this.closeVoucherModal();
          this.getUserPlan(); // 🟢 تحديث واجهة الباقة فوراً بدلاً من الانتقال الأعمى للقائمة
        } else {
          this.dataProvider.showToast(res.msg || '');
        }
      })
      .catch(error => {
        this.dataProvider.showToast(this.lang.connection_error_try_again || 'حدث خطأ في الاتصال، حاول مرة أخرى.');
      });
  }

  subcribeToServerFreePlan() {
    let data = {
      plan_id: 1,
      iap_id: Date.now().toString(),
      paymentType: 'Free',
      billingPeriod: 1,
      billingPeriodUnit: 'month',
      ammount: 0.0,
      user_id: this.userDetails.details.user_no,
      school: this.userDetails.details.school_id
    };

    this.planApi
      .purchase(data)
      .then((res: any) => {
        if (res.success) {
          this.dataProvider.showToast(this.lang.free_plan_activated_success || 'تم تفعيل الباقة الأساسية المجانية بنجاح');
          this.getUserPlan(); // تحديث الواجهة بدلاً من الانتقال المباشر
        }
      })
      .catch(e => {
        this.dataProvider.showToast(this.lang.subscription_process_error || 'حدث خطأ أثناء تفعيل المميزات الاضافية');
      });
  }
}
