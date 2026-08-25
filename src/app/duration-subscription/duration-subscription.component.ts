import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { ModalController, IonicModule } from '@ionic/angular';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-duration-subscription',
  templateUrl: './duration-subscription.component.html',
  styleUrls: ['./duration-subscription.component.scss'],
  imports: [IonicModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DurationSubscriptionComponent implements OnInit {
  @Input() subscriptionName!: string;
  @Input() subscriptionOption!: string;
  @Input() subscriptionData!: string | any; // قد تأتي كنص أو كائن

  choosePlan: any = null;
  subscriptionPlan: any = [];
  selectedValue: string = '';

  readonly standard_yearly_price: number = 94.99;
  readonly premium_yearly_price: number = 139.99;

  constructor(
    private modalCtrl: ModalController, // تم تصحيح الاسم
    public translate: TranslateService,
    public dataProvider: DataService
  ) {}

  ngOnInit() {
    // 🟢 حماية صلبة ضد أخطاء السيرفر عند تحويل الـ JSON
    try {
      if (this.subscriptionData) {
        this.subscriptionPlan =
          typeof this.subscriptionData === 'string' ? JSON.parse(this.subscriptionData) : this.subscriptionData;
      }
    } catch (error) {
      console.error('Error parsing subscription data:', error);
      this.subscriptionPlan = [];
    }

    // 🟢 استخراج خطة الاشتراك وحساب الخصومات بأمان
    if (this.subscriptionPlan && this.subscriptionPlan.length > 0) {
      let foundPlan = this.subscriptionPlan.find((x: any) => x.slug === this.subscriptionName?.toLowerCase());

      if (foundPlan) {
        this.choosePlan = { ...foundPlan };
        this.choosePlan.original = parseFloat(this.choosePlan.amount || '0') * 12;
        this.choosePlan.discounted_price =
          this.subscriptionName === 'Standard' ? this.standard_yearly_price : this.premium_yearly_price;
        this.choosePlan.total_discount = this.choosePlan.original - this.choosePlan.discounted_price;
      }
    }
  }

  // 🟢 تصحيح إملائي
  dismiss() {
    this.modalCtrl.dismiss();
  }

  chooseSubscription() {
    if (this.selectedValue) {
      let total_price = this.selectedValue === '1' ? Number(this.choosePlan.amount) : this.choosePlan.discounted_price;

      this.choosePlan.total_price = total_price;
      this.choosePlan.month = this.selectedValue;

      this.modalCtrl.dismiss({
        dismissed: true,
        name: this.subscriptionName,
        month: this.selectedValue,
        selectedPlan: this.choosePlan
      });
    } else {
      this.dataProvider.showToast('الرجاء اختيار مدة الاشتراك أولاً!');
    }
  }

  onRadioChange(event: any) {
    this.selectedValue = event.detail.value;
  }

  async openUrl(url: string) {
    await Browser.open({ url: url });
  }
}
