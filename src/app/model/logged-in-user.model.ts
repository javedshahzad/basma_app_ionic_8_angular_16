export interface UserDetails {
  user_no?: string | number;
  school_id?: string | number;
  // Backend sends string codes ('4', '8', ...) — don't cast to the UserType
  // enum, that asserts a closed set that hasn't been confirmed against it.
  user_type?: string;
  teacher_type?: string;
  is_school_admin?: number | boolean;
  is_show_absent_students?: boolean;
  first_name?: string;
  last_name?: string;
  pic?: string;
  school_name?: string;
  school_logo?: string;
  school_details?: unknown;
  country_code?: string;
  country_en_name?: string;
  country_ar_name?: string;
  phone_no?: string;
  username?: string;
  email_id?: string;
  child?: unknown[];
  // Student-role account's own student id (distinct from user_no) — used to
  // scope gamification/notes/warning-report calls to "this student".
  stu_id?: string | number;
  // Also student-role-only: the student's own class/level, present on
  // `details` for a student account (confirmed via student-titles.page.html).
  level_name?: string;
  class_name?: string;
  // Student-role account's own badges (login response) — see student.model.ts's
  // Student.has_active_case for the shared reasoning on top-level vs nested.
  medical_condition?: string;
  has_active_case?: boolean;
}

export interface LoggedInUser {
  session_id?: string;
  success?: boolean;
  status?: boolean;
  message?: string;
  msg?: string;
  details?: UserDetails;
}
