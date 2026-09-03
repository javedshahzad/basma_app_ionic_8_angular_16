/**
 * Per-period attendance cell value keyed by 'cem-N' on Student.sheet.
 * CONFIRMED DIVERGENCE: everywhere except students.page.ts this is a string
 * status code ('0' absent / '1' present / '3' excused / undefined =
 * unmarked). students.page.ts reads and writes the same key as a boolean
 * instead. This is real behavior in the shipped app, not a typo — the
 * union lets both usages type-check; narrow with typeof at each call site.
 */
export type AttendanceCellValue = string | boolean | undefined;

export interface Student {
  sid?: string | number;
  name?: string;
  pic?: string;
  student_no?: string | number;
  student_points?: number;
  current_streak?: number;
  delay_rule?: number;
  sheet?: Record<string, AttendanceCellValue>;
  agg_ranking?: number;
  ranking?: number;
  frozen_until?: string;
  total_delay?: number;
  suspend_leave?: boolean;
  medical_leave?: boolean;
  medical_condition?: string;
  phone_no?: string;
  phone_no_two?: string;
  can_view_absent?: boolean;
  absents?: { date?: string; sem?: string; notes?: { ID?: string | number; note?: string; created_by?: string | number }[] }[];
  course?: { name?: string };
  unacceptable_absent_days?: number;
  suspend_days?: number;
  medical_days?: number;
  useedforabsent?: { one?: number; zero?: number };
  active_crafted_title?: string;
  active_title?: string;
  title?: string;
  cognitive?: number;
  social?: number;
  discipline?: number;
  emotional?: number;
  practical?: number;
  student_data?: {
    medical_condition?: string;
    active_crafted_title?: string;
    // خطة إدارة حالات الطلاب Phase 3 — existence-only signal (no type/
    // summary, that stays behind the confidentiality check) for the
    // neutral case badge on the class roster view.
    has_active_case?: boolean;
  };
  // Class/course association fields (edit-student-profile.page.ts) — the
  // backend returns these under inconsistent names depending on endpoint.
  cid?: string | number;
  course_id?: string | number;
  course_name?: string;
  student_id?: string | number;
  class_id?: string | number;
  // Client-computed fields (assigned in list-student.page.ts and similar,
  // not sent by the backend):
  isFrozen?: boolean;
  computedTitle?: string;
  currentLockStatus?: string | boolean;
  studentBehaviour?: string;
  // Documented escape hatch for the long tail of real PHP columns not yet
  // enumerated. Tighten field-by-field as each batch touches a consuming
  // file; remove once no consumer needs it.
  [key: string]: unknown;
}
