import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-options-popover',
  templateUrl: './student-options-popover.component.html',
  styleUrls: ['./student-options-popover.component.scss'],
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentOptionsPopoverComponent {
  // 1. تعريف متغير لاستقبال بيانات الطالب من الصفحة الرئيسية
  @Input() student: any;

  // 2. استدعاء PopoverController للتحكم في النافذة
  constructor(private popoverCtrl: PopoverController) {}


  // 3. الدالة التي تبحث عنها: تقوم بإغلاق النافذة وإرسال الإجراء المختار
  async dismiss(action: string) {
    await this.popoverCtrl.dismiss({ selectedAction: action });
  }
}
