import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-absence-conversion-popover',
  templateUrl: './absence-conversion-popover.component.html',
  imports: [IonicModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbsenceConversionPopoverComponent {
  @Input() submittedByName: string = '';
  @Input() reason: string = '';
  @Input() approvedByName: string = '';

  constructor(private popoverCtrl: PopoverController) {}

  dismiss() {
    this.popoverCtrl.dismiss();
  }
}
