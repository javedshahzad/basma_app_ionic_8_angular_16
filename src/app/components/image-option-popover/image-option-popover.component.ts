import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-option-popover',
  templateUrl: './image-option-popover.component.html', // إضافة هذا السطر
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageOptionPopoverComponent {
  constructor(private popoverCtrl: PopoverController) {}

  async dismiss(action: string) {
    await this.popoverCtrl.dismiss({ selectedAction: action });
  }
}
