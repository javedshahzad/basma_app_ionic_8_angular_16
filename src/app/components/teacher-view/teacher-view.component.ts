import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GamificationEngineService } from '../../service/gamification-engine/gamification-engine.service';
import { NgClass, DecimalPipe } from '@angular/common';
import { ɵɵDir, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-teacher-view',
    templateUrl: './teacher-view.component.html',
    styleUrl: './teacher-view.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgClass, DecimalPipe, ɵɵDir, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, TranslatePipe]
})
export class TeacherViewComponent {
  @Input() attendanceResponse: any = {};
  @Input() currentActivePeriod: number;
  @Input() lockedPeriods: number[] = [];
  @Input() courseInfo: any = {};
  @Input() canEdit: boolean = false;
  @Input() timeLeft: number = 0;
  @Input() formattedTimeLeft: string = '';
  @Input() isToday: boolean = false;
  @Input() hasSubmitted: boolean = false;
  @Input() totalSemArray: any[] = [];
  // خريطة طلبات تحويل الغياب المعتمدة، مفتاحها `sid-period` — تُستخدم فقط
  // لمعرفة ما إذا كانت خلية حضور معينة ناتجة عن طلب معتمد (عبر hasAcceptedApplication)
  @Input() appliedApplications: Map<string, unknown[]> = new Map();

  @Output() periodSelect = new EventEmitter<number>();
  @Output() setAllStatus = new EventEmitter<string>();
  @Output() studentClick = new EventEmitter<string>();
  @Output() imageClick = new EventEmitter<any>();
  @Output() noteClick = new EventEmitter<{ event: any; student: any }>();
  @Output() setStudentStatus = new EventEmitter<{ student: any; status: string }>();
  @Output() applicationInfoClick = new EventEmitter<{ event: Event; sid: string | number; period: number }>();

  constructor(public gamification: GamificationEngineService) {}

  // 🟢 تقنية لتسريع أداء قائمة الطلاب (تمنع إعادة رسم الشاشة بالكامل)
  trackByStudent(index: number, student: any) {
    return student.sid; // نراقب الطالب عبر الـ ID الخاص به
  }

  // 🟢 تقنية لتسريع أداء قائمة الحصص
  trackByPeriod(index: number, period: any) {
    return index;
  }

  // 🟢 توحيد القيمة كنص دائماً — الـ API الجديد يرجع رقم أحياناً بدل النص
  getCemStatus(sheet: any, period: number): string {
    if (!sheet) return '';
    const val = sheet['cem-' + period];
    if (val === undefined || val === null || val === '' || val === 'undefined' || val === 'null') return '';
    return String(val);
  }

  isAbsentDueToDelay(sheet: any): boolean {
    return !!sheet && String(sheet.absentDueToDelay) === '1';
  }

  // حساب إجمالي نقاط الطلاب في الصف
  getTotalPoints(): number {
    if (!this.attendanceResponse?.students) return 0;
    return this.attendanceResponse.students.reduce((sum: number, student: any) => sum + (Number(student.student_points) || 0), 0);
  }

  // 🟢 هل هذه الخلية (طالب + حصة) ناتجة عن قبول طلب تحويل غياب معتمد؟
  hasAcceptedApplication(sid: string | number, period: number): boolean {
    return !!this.appliedApplications?.has(`${sid}-${period}`);
  }
}
