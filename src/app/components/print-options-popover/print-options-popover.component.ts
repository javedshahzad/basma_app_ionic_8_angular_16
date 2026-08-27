import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-print-options-popover',
  templateUrl: './print-options-popover.component.html',
  styleUrls: ['./print-options-popover.component.scss'],
  imports: [IonicModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintOptionsPopoverComponent {
  constructor(private popoverController: PopoverController) {}

  // دالة إغلاق النافذة مع إرسال القيمة المختارة
  close(type: string) {
    // The consumer (student-detail.page.ts) reads `data.selectedAction` off
    // the dismiss payload -- dismissing with the bare string here made that
    // always undefined, so choosing either option silently did nothing.
    this.popoverController.dismiss({ selectedAction: type });
  }
}
