import { Component, Input, Output, EventEmitter } from '@angular/core';
import { GamificationEngineService } from '../../service/gamification-engine/gamification-engine.service';

@Component({
  selector: 'app-teacher-view',
  templateUrl: './teacher-view.component.html',
  standalone: false
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

  @Output() onPeriodSelect = new EventEmitter<number>();
  @Output() onSetAllStatus = new EventEmitter<string>();
  @Output() onStudentClick = new EventEmitter<string>();
  @Output() onImageClick = new EventEmitter<any>();
  @Output() onNoteClick = new EventEmitter<{ event: any; student: any }>();
  @Output() onSetStudentStatus = new EventEmitter<{ student: any; status: string }>();

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
    return this.attendanceResponse.students.reduce((sum, student) => sum + (Number(student.student_points) || 0), 0);
  }
}
