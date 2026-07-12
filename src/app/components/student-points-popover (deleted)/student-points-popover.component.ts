import { Component, Input } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-student-points-popover',
  templateUrl: './student-points-popover.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
})
export class StudentPointsPopoverComponent {
  
  @Input() student: any;
  @Input() points: any[] = []; // استقبال مصفوفة النقاط من السيرفر

  constructor(private popoverCtrl: PopoverController) {}

  async dismiss(selectedPoint: string) {
    // إرسال النقطة التي تم اختيارها
    await this.popoverCtrl.dismiss({ point: selectedPoint });
  }
}