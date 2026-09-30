import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { PinchZoomDirective } from '../../directives/pinch-zoom.directive';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-profile-image',
    templateUrl: './profile-image.page.html',
    styleUrls: ['./profile-image.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, PinchZoomDirective, TranslatePipe]
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
