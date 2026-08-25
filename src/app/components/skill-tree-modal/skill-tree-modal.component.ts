import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-skill-tree-modal',
  templateUrl: './skill-tree-modal.component.html',
  imports: [IonicModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillTreeModalComponent {
  @Input() student: any; // لاستقبال بيانات الطالب المختار

  constructor(private modalCtrl: ModalController) {}

  closeModal() {
    this.modalCtrl.dismiss();
  }

  // عند الضغط على أي زر نقاط، نغلق النافذة ونرسل البيانات للصفحة الأب
  awardPoints(skillType: string, points: number) {
    this.modalCtrl.dismiss({
      skillType: skillType,
      points: points
    });
  }
}
