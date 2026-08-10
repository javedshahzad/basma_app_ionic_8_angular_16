import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GamificationEngineService } from '../../service/gamification-engine/gamification-engine.service';
import { UserType } from '../../constants/user-type';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { ɵɵDir, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-supervisor-view',
    templateUrl: './supervisor-view.component.html',
    styleUrl: './supervisor-view.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgIf, IonicModule, NgFor, NgClass, DecimalPipe, ɵɵDir, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf]
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

  @Output() changeAttendanceStatusAll = new EventEmitter<number>();
  @Output() studentClick = new EventEmitter<string>();
  @Output() imageClick = new EventEmitter<any>();
  @Output() noteClick = new EventEmitter<{ event: any; student: any }>();
  @Output() changeAttendanceStatus = new EventEmitter<{ student: any; sem: number; index: number }>();

  constructor(public gamification: GamificationEngineService) {}

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
