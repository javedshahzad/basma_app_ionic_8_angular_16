import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { DataService } from '../../service/data/data.service';
import { GamificationEngineService } from '../../service/gamification-engine/gamification-engine.service';
import { GamificationApiService } from '../../service/gamification-api/gamification-api.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { UserType } from '../../constants/user-type';

@Component({
  selector: 'app-student-profile-modal',
  templateUrl: './student-profile-modal.component.html',
  styleUrls: ['./student-profile-modal.component.scss'],
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentProfileModalComponent implements OnInit {
  readonly UserType = UserType;

  // استقبال البيانات من الصفحة الأم
  @Input() student: any;
  @Input() userType: string;
  @Input() editMode: boolean = false;

  // استقبال الدوال من الصفحة الأم
  @Input() onPhotoClick: (event: any) => void;
  @Input() onFullscreenClick: (url: string) => void;

  isLoadingSkills: boolean = false;
  studentTotalPoints: number = 0;
  studentSkillData: any = null;
  studentTitle: string = '';

  private intervalId: any;

  constructor(
    private dataProvider: DataService,
    private modalCtrl: ModalController,
    public gamification: GamificationEngineService,
    private gamificationApi: GamificationApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchStudentSkillsAndTitle();

    // 🟢 الحل الذكي: إجبار المودال على تحديث واجهته كل نصف ثانية لاصطياد الصورة الجديدة
    this.intervalId = setInterval(() => {
      this.cdr.detectChanges();
    }, 500);
  }

  ngOnDestroy() {
    // 🟢 إغلاق المؤقت عند إغلاق المودال لتوفير الذاكرة
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async fetchStudentSkillsAndTitle() {
    this.isLoadingSkills = true;
    try {
      // 🟢 1. الإصلاح: استخدام الدالة الصحيحة للمهارات وإرسال (sid)
      const skillRes: any = await this.gamificationApi.getStudentSkillTree({ sid: this.student.sid });

      this.isLoadingSkills = false;

      // 🟢 2. الإصلاح: إزالة شرط (session) والاعتماد على (success) فقط
      if (skillRes && skillRes.success) {
        this.studentSkillData = skillRes.skills || {};
        this.studentTotalPoints = Number(skillRes.total_points || 0);

        // 🟢 3. الإصلاح: اللقب المفعل نأخذه من بيانات الطالب الممررة للمودال أو من السيرفر
        let activeCraftedTitle = skillRes.active_title || this.student?.active_crafted_title || null;

        // المحرك المركزي يقرر اللقب النهائي
        this.studentTitle = this.gamification.getFinalStudentTitle(
          activeCraftedTitle,
          this.studentSkillData,
          this.studentTotalPoints
        );
      } else {
        this.studentTitle = '🌱 بطل في البداية';
      }
    } catch (error) {
      this.isLoadingSkills = false;
      this.studentTitle = '⚠️ تعذر جلب اللقب';
    }
  }

  triggerCamera(event: any) {
    if (this.onPhotoClick) {
      // 1. استدعاء الدالة الممررة من الصفحة الأم
      this.onPhotoClick(event);

      // 2. 🟢 إجبار المودال على فحص التغييرات بعد فترة قصيرة للسماح للصورة بالتحميل
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 500); // نصف ثانية لتحديث الواجهة بعد حفظ الصورة
    }
  }

  // 🟢 دالة عرض الصورة بحجم الشاشة
  triggerFullscreen(pic: any) {
    // نتحقق من وجود الدالة الممررة من الصفحة الأم ووجود رابط للصورة
    if (this.onFullscreenClick && pic) {
      this.onFullscreenClick(pic);
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
