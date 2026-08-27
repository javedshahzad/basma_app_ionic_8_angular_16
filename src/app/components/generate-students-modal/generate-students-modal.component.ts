import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { DataService } from '../../service/data/data.service';

import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-generate-students-modal',
  templateUrl: './generate-students-modal.component.html',
  imports: [IonicModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateStudentsModalComponent {
  @Input() generateLang: any;
  @Input() startNumber: number = 1;
  @Input() maxCount: number = 50;

  count = signal<number | null>(null);

  endNumber = computed(() => {
    const c = this.count();
    if (!c || c < 1) return this.startNumber;
    return this.startNumber + c - 1;
  });

  padWidth = computed(() => Math.max(2, String(this.endNumber()).length));
  previewStart = computed(() => String(this.startNumber).padStart(this.padWidth(), '0'));
  previewEnd = computed(() => String(this.endNumber()).padStart(this.padWidth(), '0'));

  constructor(
    private modalCtrl: ModalController,
    private dataProvider: DataService
  ) {}

  hideModal() {
    this.modalCtrl.dismiss();
  }

  confirm() {
    const c = this.count();
    if (!c || !Number.isInteger(c) || c < 1) {
      this.dataProvider.showToast(this.generateLang?.generate_invalid_count || 'الرجاء إدخال عدد صحيح أكبر من صفر');
      return;
    }
    if (c > this.maxCount) {
      this.dataProvider.showToast(
        (this.generateLang?.generate_max_count || 'الحد الأقصى {{max}} طالب في الدفعة الواحدة').replace('{{max}}', String(this.maxCount))
      );
      return;
    }

    this.modalCtrl.dismiss({ count: c });
  }
}
