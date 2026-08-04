import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-classlist-options-popover',
  templateUrl: './classlist-options-popover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClasslistOptionsPopoverComponent {
  
  // المتغيرات التي سنستقبلها من الصفحة الرئيسية
  @Input() userType: string = '';
  @Input() editMode: boolean = false;
  @Input() canReorder: boolean = false;
  @Input() lang1: any = {};

  constructor(private popoverCtrl: PopoverController) {}

  // إرسال الإجراء المختار وإغلاق القائمة
  popoverAction(action: string) {
    this.popoverCtrl.dismiss({ selectedAction: action });
  }
}