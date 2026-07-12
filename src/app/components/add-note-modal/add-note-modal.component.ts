import { Component } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { DataService } from '../../service/data/data.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-note-modal',
  templateUrl: './add-note-modal.component.html',
  standalone: true, // إضافة هذا السطر
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
})
export class AddNoteModalComponent {
  noteMessage: string = '';

  constructor(private modalCtrl: ModalController, private dataProvider: DataService) {}

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
        this.dataProvider.showToast('عذراً، يجب ألا يتجاوز طول الملاحظة 45 حرفاً');
      }
    } else {
      this.dataProvider.showToast('الرجاء كتابة الملاحظة أولاً');
    }
  }
}