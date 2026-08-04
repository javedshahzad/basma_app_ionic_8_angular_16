import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { DataService } from '../../service/data/data.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-student-modal',
  templateUrl: './add-student-modal.component.html',
  standalone: true, // إضافة هذا السطر
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStudentModalComponent {
  @Input() addStudentLang: any; // لاستقبال نصوص الترجمة من الصفحة الأب

  newStudentName: string = '';
  newStudentId: string = '';

  constructor(private modalCtrl: ModalController, private dataProvider: DataService) {}

  hideModal() {
    this.modalCtrl.dismiss();
  }

  submitNewStudent() {
    // التحقق من صحة المدخلات هنا بدلاً من الصفحة الرئيسية
    if (this.newStudentName.trim() === '') {
      this.dataProvider.showToast(this.addStudentLang?.invalid_stu_name || 'اسم الطالب غير صالح');
      return;
    } 
    if (!this.newStudentId || Number(this.newStudentId) === 0) {
      this.dataProvider.showToast(this.addStudentLang?.invalid_stu_id || 'رقم الطالب غير صالح');
      return;
    }

    // إذا كانت البيانات صحيحة، نغلق النافذة ونرسل البيانات للصفحة الرئيسية
    this.modalCtrl.dismiss({
      name: this.newStudentName,
      id: this.newStudentId
    });
  }
}