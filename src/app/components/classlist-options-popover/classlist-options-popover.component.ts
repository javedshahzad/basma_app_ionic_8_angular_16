import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { UserType } from '../../constants/user-type';
import { NgIf } from '@angular/common';
import { HasRoleDirective } from '../../directives/has-role.directive';

@Component({
    selector: 'app-classlist-options-popover',
    templateUrl: './classlist-options-popover.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIf, IonicModule, HasRoleDirective]
})
export class ClasslistOptionsPopoverComponent {
  readonly UserType = UserType;

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
