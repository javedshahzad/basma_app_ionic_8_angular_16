import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GamificationEngineService } from '../../service/gamification-engine/gamification-engine.service';
import { NgClass, DecimalPipe } from '@angular/common';
import { ɵɵDir, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-teacher-view',
    templateUrl: './teacher-view.component.html',
    styleUrl: './teacher-view.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgClass, DecimalPipe, ɵɵDir, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf]
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

  @Output() periodSelect = new EventEmitter<number>();
  @Output() setAllStatus = new EventEmitter<string>();
  @Output() studentClick = new EventEmitter<string>();
  @Output() imageClick = new EventEmitter<any>();
  @Output() noteClick = new EventEmitter<{ event: any; student: any }>();
  @Output() setStudentStatus = new EventEmitter<{ student: any; status: string }>();

  constructor(public gamification: GamificationEngineService) {}

  // 🟢 تقنية لتسريع أداء قائمة الطلاب (تمنع إعادة رسم الشاشة بالكامل)
  trackByStudent(index: number, student: any) {
    return student.sid; // نراقب الطالب عبر الـ ID الخاص به
  }

  // 🟢 تقنية لتسريع أداء قائمة الحصص
  trackByPeriod(index: number, period: any) {
    return index;
  }

  // حساب إجمالي نقاط الطلاب في الصف
  getTotalPoints(): number {
    if (!this.attendanceResponse?.students) return 0;
    return this.attendanceResponse.students.reduce((sum: number, student: any) => sum + (Number(student.student_points) || 0), 0);
  }
}
