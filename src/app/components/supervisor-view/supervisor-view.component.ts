import { Component, Input, Output, EventEmitter } from '@angular/core';
import { GamificationEngineService } from '../../service/gamification-engine/gamification-engine.service';
import { UserType } from '../../constants/user-type';

@Component({
  selector: 'app-supervisor-view',
  templateUrl: './supervisor-view.component.html',
})
export class SupervisorViewComponent {
  readonly UserType = UserType;
  @Input() attendanceResponse: any = {};
  @Input() showAll: boolean = true;
  @Input() userType: string = '';
  @Input() totalSemArray: any[] = [];
  @Input() classAll: any[] = [];
  @Input() editMode: boolean = false;
  @Input() canEdit: boolean = false;

  @Output() onChangeAttendanceStatusAll = new EventEmitter<number>();
  @Output() onStudentClick = new EventEmitter<string>();
  @Output() onImageClick = new EventEmitter<any>();
  @Output() onNoteClick = new EventEmitter<{event: any, student: any}>();
  @Output() onChangeAttendanceStatus = new EventEmitter<{student: any, sem: number, index: number}>();

  constructor(public gamification: GamificationEngineService,) {}

  // 🟢 تقنية لتسريع أداء قائمة الطلاب (تمنع إعادة رسم الشاشة بالكامل)
  trackByStudent(index: number, student: any) {
    return student.sid; // نراقب الطالب عبر الـ ID الخاص به
  }

  // 🟢 تقنية لتسريع أداء قائمة الحصص
  trackByPeriod(index: number, period: any) {
    return index; 
  }

  getTotalPoints(): number {
    if (!this.attendanceResponse?.students) return 0;
    return this.attendanceResponse.students.reduce((sum, student) => sum + (Number(student.student_points) || 0), 0);
  }
}