import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-points-popover',
  templateUrl: './student-points-popover.component.html',
  imports: [IonicModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentPointsPopoverComponent {
  trackByIndex(index: number): number {
    return index;
  }

  @Input() student: any;
  @Input() points: any[] = []; // استقبال مصفوفة النقاط من السيرفر

  constructor(private popoverCtrl: PopoverController) {}

  async dismiss(selectedPoint: string) {
    // إرسال النقطة التي تم اختيارها
    await this.popoverCtrl.dismiss({ point: selectedPoint });
  }
}
