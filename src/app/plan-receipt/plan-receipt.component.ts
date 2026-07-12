import { Component, Input, OnInit } from '@angular/core';
import { ModalController, Platform, IonicModule } from '@ionic/angular';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-plan-receipt',
  templateUrl: './plan-receipt.component.html',
  styleUrls: ['./plan-receipt.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
})
export class PlanReceiptComponent implements OnInit {
  @Input() selectedPlan: any;
  @Input() isSuccess: any; // 🟢 تم السماح باستقبال نصوص أو قيم منطقية
  @Input() receipt: any;

  OrderID: any;
  isSuccessBool: boolean = false; // 🟢 متغير جديد للتعامل الآمن مع واجهة HTML

  constructor(
    public modalCtrl: ModalController,
    public translate: TranslateService,
    public platform: Platform
  ) { }

  ngOnInit() {
    // 🟢 معالجة آمنة للمتغيرات (تجنب الخطأ في حال تم تمرير Object جاهز)
    if (typeof this.selectedPlan === 'string') {
      try {
        this.selectedPlan = JSON.parse(this.selectedPlan);
      } catch (e) { console.error('Error parsing selectedPlan', e); }
    }

    // 🟢 تحويل isSuccess لقيمة منطقية صحيحة أياً كان نوع المدخل
    this.isSuccessBool = this.isSuccess === true || this.isSuccess === 'true';

    if (this.receipt) {
      let parsedReceipt = this.receipt;
      if (typeof this.receipt === 'string') {
        try {
          parsedReceipt = JSON.parse(this.receipt);
        } catch (e) { console.error('Error parsing receipt', e); }
      }
      
      if (this.platform.is("android")) {
        this.OrderID = parsedReceipt?.orderId;
      } else {
        this.OrderID = parsedReceipt?.transactionId;
      }
    }
  }

  dissmis() {
    if (this.isSuccessBool) {
      this.OnDone();
    } else {
      this.modalCtrl.dismiss();
    }
  }

  OnCofirm() {
    this.modalCtrl.dismiss({
      dismissed: true,
      isConfirm: true,
    });
  }

  OnDone() {
    this.modalCtrl.dismiss({
      dismissed: true,
      isDone: true,
    });
  }
}