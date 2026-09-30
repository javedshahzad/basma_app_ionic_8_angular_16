import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AttendanceManagerService {

  constructor() { }

  // Is this student's mark for `period` a delay (تأخير) mark, which only the
  // delay register may change? A delay is only ever recorded against period
  // 1 (the morning-lineup sheet is always `cem-1`), as either `3` (late) or,
  // once the school's delay rule is reached, `0` with absentDueToDelay=1.
  // The absentDueToDelay flag must NOT be applied to every period: doing so
  // made that student untappable yet "not recorded" in periods 2+, so the
  // period could never be completed or submitted by anyone.
  // Newer servers send a per-period `absentDueToDelay-<n>`; older ones send
  // only the student-level flag, which then means period 1.
  isDelayMark(sheet: any, period: number): boolean {
    if (!sheet) return false;
    if (String(sheet['cem-' + period]).trim() === '3') return true;
    const perPeriod = sheet['absentDueToDelay-' + period];
    if (perPeriod !== undefined && perPeriod !== null) return String(perPeriod) === '1';
    return period === 1 && String(sheet.absentDueToDelay) === '1';
  }

  // 1. 📊 حساب إحصائيات الغياب (تم إصلاح مسارات قراءة البيانات)
  calculatePeriodStats(students: any[], period: number, localSheet: any) {
    let present = 0; let absent = 0; let remaining = 0;
    if (!students || students.length === 0) return { present, absent, remaining };

    let semKey = 'cem-' + period;

    students.forEach(student => {
      let status = 'undefined';
      
      // 1. نبحث في التعديلات المحلية (السلة) أولاً
      if (localSheet[semKey] && localSheet[semKey]['sid-' + student.sid] !== undefined) {
        status = localSheet[semKey]['sid-' + student.sid];
      } 
      // 2. إذا لم يوجد تعديل محلي، نقرأ من بيانات السيرفر الأصلية
      else if (student.sheet && student.sheet[semKey] !== undefined) {
        status = String(student.sheet[semKey]).trim();
      }

      // حساب العدادات
      if (status === '1') present++;
      else if (status === '0' || status === '3') absent++; // 3 تعني تأخير
      else remaining++;
    });

    return { present, absent, remaining };
  }

  // 2. 🔐 استخراج أرقام الحصص المقفلة
  getLockedPeriods(students: any[], totalPeriodsCount: number): number[] {
    let locked: number[] = [];
    if (!students || students.length === 0) return locked;

    for (let i = 1; i <= totalPeriodsCount; i++) {
      const isPeriodLocked = students.some(s => s.sheet && s.sheet[`entered_by-${i}`]);
      if (isPeriodLocked) locked.push(i);
    }
    return locked;
  }

  // 3. 📝 التحقق من وجود أي تعديلات
  hasMadeChanges(attendanceSheet: any, removeSheet: any): boolean {
    return Object.keys(attendanceSheet).length > 0 || Object.keys(removeSheet).length > 0;
  }

  // 4. ✅ التحقق من اكتمال الرصد للمعلم
  isPeriodAttendanceComplete(students: any[], period: number, localSheet: any): boolean {
    const stats = this.calculatePeriodStats(students, period, localSheet);
    return stats.remaining === 0;
  }

  // 5. ⚠️ التحقق من اكتمال التعديلات للمشرف (تم إصلاح مسارات الفحص)
  isAnyModifiedPeriodIncomplete(students: any[], localSheet: any, totalPeriodsCount: number): boolean {
    let isIncomplete = false;
    for (let i = 1; i <= totalPeriodsCount; i++) {
      let semKey = 'cem-' + i;
      // التحقق مما إذا كانت هذه الحصة تحتوي على تعديلات فعلية في السلة
      if (localSheet[semKey] && Object.keys(localSheet[semKey]).length > 0) {
        const stats = this.calculatePeriodStats(students, i, localSheet);
        if (stats.remaining > 0) {
          isIncomplete = true;
          break;
        }
      }
    }
    return isIncomplete;
  }
}