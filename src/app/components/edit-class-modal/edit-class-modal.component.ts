import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-edit-class-modal',
  templateUrl: './edit-class-modal.component.html',
})
export class EditClassModalComponent {
  
  // 📥 استقبال بيانات الصف والقوائم المنسدلة من الصفحة الرئيسية
  @Input() editingClass: any = {};
  @Input() userLevels: any[] = [];
  @Input() userCategory: any[] = [];
  @Input() lang1: any = {};

  constructor(private modalCtrl: ModalController) {}

  // إغلاق النافذة بدون فعل شيء
  closeModal() {
    this.modalCtrl.dismiss();
  }

  // 📤 إرسال أمر الحفظ مع البيانات المعدلة
  saveChanges() {
    this.modalCtrl.dismiss({ action: 'save', data: this.editingClass });
  }

  // 📤 إرسال أمر الحذف مع رقم الصف
  deleteClass() {
    this.modalCtrl.dismiss({ action: 'delete', cid: this.editingClass.cid });
  }
}