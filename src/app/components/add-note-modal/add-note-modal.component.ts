import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { DataService } from '../../service/data/data.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-note-modal',
  templateUrl: './add-note-modal.component.html', // إضافة هذا السطر
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddNoteModalComponent {
  noteMessage: string = '';
  lang: Record<string, string> = {};

  constructor(
    private modalCtrl: ModalController,
    private dataProvider: DataService,
    private translate: TranslateService
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
    });
  }

  hideModal() {
    this.modalCtrl.dismiss();
  }

  submitNote() {
    if (this.noteMessage && this.noteMessage.trim() !== '') {
      if (this.noteMessage.length <= 45) {
        // إغلاق النافذة وإرسال النص للصفحة الأب
        this.modalCtrl.dismiss({
          noteMessage: this.noteMessage
        });
      } else {
        this.dataProvider.showToast(this.lang.note_length_exceeded || 'عذراً، يجب ألا يتجاوز طول الملاحظة 45 حرفاً');
      }
    } else {
      this.dataProvider.showToast(this.lang.write_note_first || 'الرجاء كتابة الملاحظة أولاً');
    }
  }
}
