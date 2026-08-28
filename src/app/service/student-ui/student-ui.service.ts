import { Injectable, Signal } from '@angular/core';
import { ModalController, PopoverController, ActionSheetController, AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import type { GenerateProgress } from '../../components/generate-students-progress-modal/generate-students-progress-modal.component';

// الاستيرادات أدناه ديناميكية عمداً (داخل كل دالة، لا في أعلى الملف): هذه
// الخدمة تُستخدم من خمس صفحات مختلفة (قائمة المتابعة، قائمة الطلاب، تفاصيل
// الطالب، الطلاب...)، وأي استيراد ثابت هنا يُقحَم في حزمة أول صفحة من هذه
// الخمس تُحمَّل، حتى لو لم يفتح المستخدم تلك النافذة إطلاقاً في تلك الجلسة.
// راجع خطة العمل الاحترافية لحزمة التحميل الأساسية، المرحلة الثانية.

@Injectable({
  providedIn: 'root'
})
export class StudentUiService {

  constructor(
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private platform: Platform,
    private translate: TranslateService
  ) { }

  // 1. إدارة نافذة شجرة المهارات
  async openSkillTree(student: any): Promise<any> {
    const { SkillTreeModalComponent } = await import('../../components/skill-tree-modal/skill-tree-modal.component');
    const modal = await this.modalCtrl.create({
      component: SkillTreeModalComponent,
      cssClass: 'lineone-modal',
      initialBreakpoint: 0.70,
      breakpoints: [0, 0.70, 0.9],
      handleBehavior: 'cycle',
      componentProps: { student: student }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    return data;
  }

  // 2. إدارة نافذة تسجيل طالب جديد
  async openAddStudent(langData: any): Promise<any> {
    const { AddStudentModalComponent } = await import('../../components/add-student-modal/add-student-modal.component');
    const modal = await this.modalCtrl.create({
      component: AddStudentModalComponent,
      cssClass: 'transparent-modal',
      componentProps: { addStudentLang: langData }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    return data;
  }

  // 2ب. اختيار طريقة إضافة الطالب: فردي أم إنشاء عدة طلاب أم استيراد من إكسل
  async presentAddStudentModeChooser(event: Event): Promise<'single' | 'multiple' | 'import' | null> {
    return new Promise(async (resolve) => {
      if (this.platform.width() >= 768) {
        const { AddStudentModePopoverComponent } = await import('../../components/add-student-mode-popover/add-student-mode-popover.component');
        const popover = await this.popoverCtrl.create({
          component: AddStudentModePopoverComponent,
          event: event,
          mode: 'ios', translucent: true
        });
        await popover.present();
        const { data } = await popover.onDidDismiss();
        resolve(data?.selectedAction ?? null);
      } else {
        const actionSheet = await this.actionSheetCtrl.create({
          header: this.translate.instant('popovers.add_student_header'),
          cssClass: 'custom-action-sheet',
          buttons: [
            { text: this.translate.instant('popovers.register_new_student'), icon: 'person-add-outline', handler: () => resolve('single') },
            { text: this.translate.instant('popovers.generate_multiple_students'), icon: 'people-outline', handler: () => resolve('multiple') },
            { text: this.translate.instant('popovers.import_students_excel'), icon: 'document-attach-outline', handler: () => resolve('import') },
            { text: this.translate.instant('popovers.cancel'), icon: 'close', role: 'cancel', cssClass: 'text-rose-500 font-bold', handler: () => resolve(null) }
          ]
        });
        await actionSheet.present();
        actionSheet.onDidDismiss().then(() => resolve(null));
      }
    });
  }

  // 2هـ. نافذة استيراد الطلاب من ملف إكسل
  async openImportStudents(langData: any): Promise<{ rows: { name: string; student_id: number | null }[] } | null> {
    const { ImportStudentsModalComponent } = await import('../../components/import-students-modal/import-students-modal.component');
    const modal = await this.modalCtrl.create({
      component: ImportStudentsModalComponent,
      cssClass: 'transparent-modal',
      componentProps: { importLang: langData }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    return data ?? null;
  }

  // 2ج. نافذة تحديد عدد الطلاب المراد إنشاؤهم دفعة واحدة
  async openGenerateStudents(langData: any, startNumber: number, maxCount: number): Promise<{ count: number } | null> {
    const { GenerateStudentsModalComponent } = await import('../../components/generate-students-modal/generate-students-modal.component');
    const modal = await this.modalCtrl.create({
      component: GenerateStudentsModalComponent,
      cssClass: 'transparent-modal',
      componentProps: { generateLang: langData, startNumber, maxCount }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    return data ?? null;
  }

  // 2د. نافذة تقدّم إنشاء الطلاب أثناء تنفيذ الدفعة
  async presentGenerateProgress(langData: any, progress: Signal<GenerateProgress>) {
    const { GenerateStudentsProgressModalComponent } = await import(
      '../../components/generate-students-progress-modal/generate-students-progress-modal.component'
    );
    const modal = await this.modalCtrl.create({
      component: GenerateStudentsProgressModalComponent,
      cssClass: 'transparent-modal',
      backdropDismiss: false,
      componentProps: { generateLang: langData, progress }
    });
    await modal.present();
    return modal;
  }

  // 3. إدارة قائمة إجراءات المشرف
  async presentAdminActions(event: any, showAdd: boolean): Promise<string | null> {
    return new Promise(async (resolve) => {
      if (this.platform.width() >= 768) {
        const { AdminActionsPopoverComponent } = await import('../../components/admin-actions-popover/admin-actions-popover.component');
        const popover = await this.popoverCtrl.create({
          component: AdminActionsPopoverComponent,
          event: event,
          componentProps: { canEdit: false, canAdd: showAdd },
          mode: 'ios', translucent: true
        });
        await popover.present();
        const { data } = await popover.onDidDismiss();
        resolve(data?.selectedAction);
      } else {
        let buttons = [];
        if (showAdd) buttons.push({ text: this.translate.instant('popovers.register_new_student'), icon: 'person-add-outline', handler: () => resolve('add') });
        if (showAdd) buttons.push({ text: this.translate.instant('popovers.generate_multiple_students'), icon: 'people-outline', handler: () => resolve('generate') });
        if (showAdd) buttons.push({ text: this.translate.instant('popovers.import_students_excel'), icon: 'document-attach-outline', handler: () => resolve('import') });
        buttons.push({ text: this.translate.instant('popovers.view_notes'), icon: 'document-text-outline', handler: () => resolve('notes') });
        buttons.push({ text: this.translate.instant('popovers.cancel'), icon: 'close', role: 'cancel', cssClass: 'text-rose-500 font-bold', handler: () => resolve(null) });

        const actionSheet = await this.actionSheetCtrl.create({
          header: this.translate.instant('popovers.admin_actions_header'), cssClass: 'custom-action-sheet', buttons: buttons
        });
        await actionSheet.present();
      }
    });
  }

  // 4. إدارة الملاحظات والتقييم
  async openNoteOrReviewModal(student: any, mode: 'note' | 'review'): Promise<any> {
    if (mode === 'note') {
      const { AddNoteModalComponent } = await import('../../components/add-note-modal/add-note-modal.component');
      const modal = await this.modalCtrl.create({ component: AddNoteModalComponent, cssClass: 'transparent-modal' });
      await modal.present();
      const { data } = await modal.onDidDismiss();
      return { mode: 'note', data };
    } else {
      const { AddReviewComponent } = await import('../../add-review/add-review.component');
      const modal = await this.modalCtrl.create({ component: AddReviewComponent, cssClass: 'review-desktop-modal', componentProps: { student: student.student_data } });
      await modal.present();
      const { data } = await modal.onDidDismiss();
      return { mode: 'review', data };
    }
  }

  // 5. 🟢 إدارة نافذة ملف الطالب (تم نقلها بالكامل لتنظيف الكنترولر)
  async openStudentProfileModal(student: any, userType: string, editMode: boolean, onPhotoClick: Function, onFullscreenClick: Function, sessionId: string | undefined): Promise<any> {
    const { StudentProfileModalComponent } = await import('../../components/student-profile-modal/student-profile-modal.component');
    const modal = await this.modalCtrl.create({
      component: StudentProfileModalComponent,
      cssClass: 'profile-modal-class',
      componentProps: {
        student: student,
        userType: userType,
        editMode: editMode,
        onPhotoClick: onPhotoClick,
        onFullscreenClick: onFullscreenClick,
        sessionId: sessionId
      }
    });
    await modal.present();
    return await modal.onDidDismiss();
  }

  // 6. 🟢 خيارات تغيير الصورة
  async presentImageOptions(event: Event, lang: Record<string, string>): Promise<string | null> {
    return new Promise(async (resolve) => {
      if (this.platform.width() >= 768 && event) {
        const { ImageOptionPopoverComponent } = await import('../../components/image-option-popover/image-option-popover.component');
        const popover = await this.popoverCtrl.create({
          component: ImageOptionPopoverComponent, event: event, mode: 'ios', translucent: true
        });
        await popover.present();
        const { data } = await popover.onDidDismiss();
        resolve(data?.selectedAction);
      } else {
        const actionSheet = await this.actionSheetCtrl.create({
          header: lang.image_option || 'تغيير صورة الطالب',
          cssClass: 'custom-action-sheet',
          buttons: [
            { text: lang.camera || 'التقاط بالكاميرا', icon: 'camera-outline', handler: () => resolve('camera') },
            { text: lang.gallery || 'اختيار من المعرض', icon: 'image-outline', handler: () => resolve('gallery') },
            { text: lang.avatar || 'اختيار صورة رمزية', icon: 'people-circle-outline', handler: () => resolve('avatar') },
            { text: lang.cancel || 'إلغاء', icon: 'close', role: 'cancel', cssClass: 'text-rose-500 font-bold', handler: () => resolve(null) }
          ]
        });
        await actionSheet.present();
      }
    });
  }

  // 7. 🟢 نافذة اختيار الصورة الرمزية (Avatar)
  async openAvatarModal(student: any): Promise<any> {
    const { AvatarImagesComponent } = await import('../../components/avatar-images/avatar-images.component');
    const modal = await this.modalCtrl.create({
      component: AvatarImagesComponent, cssClass: 'avatar-modal-class', componentProps: { student: student }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    return data;
  }

  // 8. 🟢 خيارات التقييم والملاحظات للطالب
  async presentStudentOptions(event: any, student: any, detailsLang: any): Promise<string | null> {
    return new Promise(async (resolve) => {
      if (this.platform.width() >= 768) {
        const { StudentOptionsPopoverComponent } = await import('../../components/student-options-popover/student-options-popover.component');
        const popover = await this.popoverCtrl.create({
          component: StudentOptionsPopoverComponent, event: event, componentProps: { student: student }, mode: 'ios', translucent: true
        });
        await popover.present();
        const { data } = await popover.onDidDismiss();
        resolve(data?.selectedAction);
      } else {
        const actionSheet = await this.actionSheetCtrl.create({
          header: `إجراءات الطالب: ${student.name}`,
          cssClass: 'custom-action-sheet',
          buttons: [
            { text: detailsLang?.student_review || 'تقييم الطالب', icon: 'star-outline', handler: () => resolve('review') },
            { text: detailsLang?.student_note || 'إضافة ملاحظة', icon: 'document-text-outline', handler: () => resolve('note') },
            { text: detailsLang?.student_point || 'شجرة المهارات (نقاط)', icon: 'medal-outline', handler: () => resolve('points') },
            { text: detailsLang?.cancel || 'إلغاء', icon: 'close', role: 'cancel', cssClass: 'text-rose-500 font-bold', handler: () => resolve(null) }
          ]
        });
        await actionSheet.present();
      }
    });
  }

  // 9. 🟢 خيارات الطباعة (Excel / PDF)
  async presentPrintOptions(lang: any): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: lang.report_option,
        buttons: [
          { text: lang.exel, handler: () => resolve('exel') },
          { text: lang.pdf, handler: () => resolve('pdf') },
          { text: lang.cancel || 'إلغاء', role: 'cancel', handler: () => resolve(null) }
        ]
      });
      await alert.present();
    });
  }

  // 10. 🟢 رسالة الاشتراك
  async presentSubscriptionAlert(planLang: any): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: planLang.not_valid, mode: 'ios',
        buttons: [
          { text: planLang.cancel, role: 'cancel', cssClass: 'secondary', handler: () => resolve(false) },
          { text: planLang.subscribe, handler: () => resolve(true) }
        ]
      });
      await alert.present();
    });
  }

  // 11. 🟢 معلومات تحويل الغياب إلى حضور عبر طلب معتمد (مقدّم الطلب، السبب، وموافق الطلب إن توفر)
  async presentAbsenceConversionInfo(
    event: Event,
    data: { submittedByName: string; reason: string; approvedByName: string }
  ): Promise<void> {
    const { AbsenceConversionPopoverComponent } = await import(
      '../../components/absence-conversion-popover/absence-conversion-popover.component'
    );
    const popover = await this.popoverCtrl.create({
      component: AbsenceConversionPopoverComponent,
      event: event,
      componentProps: data,
      mode: 'ios',
      translucent: true
    });
    await popover.present();
  }
}