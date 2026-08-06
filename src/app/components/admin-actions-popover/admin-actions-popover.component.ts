import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-actions-popover',
  templateUrl: './admin-actions-popover.component.html',
  styleUrls: ['./admin-actions-popover.component.scss'], // إضافة هذا السطر
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminActionsPopoverComponent implements OnInit {
  // استقبال الصلاحيات لمعرفة الأزرار التي يجب إظهارها
  @Input() canEdit: boolean = false;
  @Input() canAdd: boolean = false;

  constructor(private popoverCtrl: PopoverController) {}

  ngOnInit() {}

  // دالة الإغلاق وإرسال الإجراء المطلوب
  async dismiss(action: string) {
    await this.popoverCtrl.dismiss({ selectedAction: action });
  }
}
