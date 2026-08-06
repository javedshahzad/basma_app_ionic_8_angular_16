import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-print-options-popover',
  templateUrl: './print-options-popover.component.html',
  styleUrls: ['./print-options-popover.component.scss'],
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintOptionsPopoverComponent implements OnInit {
  constructor(private popoverController: PopoverController) {}

  ngOnInit() {}

  // دالة إغلاق النافذة مع إرسال القيمة المختارة
  close(type: string) {
    this.popoverController.dismiss(type);
  }
}
