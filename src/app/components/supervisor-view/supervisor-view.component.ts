import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { GamificationEngineService } from '../../service/gamification-engine/gamification-engine.service';
import { UserType } from '../../constants/user-type';
import { NgClass, DecimalPipe } from '@angular/common';
import { ɵɵDir, CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-supervisor-view',
  templateUrl: './supervisor-view.component.html',
  styleUrl: './supervisor-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonicModule,
    NgClass,
    DecimalPipe,
    ɵɵDir,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    HasRoleDirective,
    TranslatePipe
  ]
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

  // 🟢 توحيد القيمة كنص دائماً — الـ API الجديد يرجع رقم أحياناً بدل النص
  getCemStatus(sheet: any, period: number): string {
    if (!sheet) return '';
    const val = sheet['cem-' + period];
    if (val === undefined || val === null || val === '' || val === 'undefined' || val === 'null') return '';
    return String(val);
  }

  getTotalPoints(): number {
    if (!this.attendanceResponse?.students) return 0;
    return this.attendanceResponse.students.reduce(
      (sum: number, student: any) => sum + (Number(student.student_points) || 0),
      0
    );
  }
}
