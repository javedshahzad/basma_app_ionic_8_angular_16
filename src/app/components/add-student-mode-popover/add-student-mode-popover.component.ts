import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-add-student-mode-popover',
  templateUrl: './add-student-mode-popover.component.html',
  imports: [IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddStudentModePopoverComponent {
  constructor(private popoverCtrl: PopoverController) {}

  async dismiss(action: 'single' | 'multiple') {
    await this.popoverCtrl.dismiss({ selectedAction: action });
  }
}
