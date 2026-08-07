import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { PinchZoomModule } from '@mtnair/ngx-pinch-zoom';

@Component({
    selector: 'app-profile-image',
    templateUrl: './profile-image.page.html',
    styleUrls: ['./profile-image.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, PinchZoomModule]
})
export class ProfileImagePage {
  @Input() pic: string = ''; // تحديد القيمة الافتراضية

  constructor(
    private modalCtrl: ModalController // جعلها private واستخدام الاسم المتعارف عليه
  ) {}


  // 🟢 دالة مخصصة لإغلاق النافذة بطريقة نظيفة
  closeModal() {
    this.modalCtrl.dismiss();
  }
}
