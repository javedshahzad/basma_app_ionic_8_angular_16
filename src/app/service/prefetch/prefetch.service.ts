import { Injectable } from '@angular/core';
import { CoursesApiService } from '../courses-api/courses-api.service';
import { AttendanceApiService } from '../attendance-api/attendance-api.service';
import { DataService } from '../data/data.service';

/**
 * Proactively warms DatabaseService's offline cache (classes + today's
 * roster per class) right after login, instead of relying on the user
 * happening to visit classlist/list-student while still online. Both
 * underlying calls already cache as a side effect of a successful
 * response (CoursesApiService.getCourses -> insertClasses,
 * AttendanceApiService.getClassStudentList -> insertStudentList) — this
 * service just triggers them proactively rather than adding new caching
 * logic. Native-only in effect: DatabaseService no-ops on web, so this is
 * a harmless, cheap no-op there too.
 */
@Injectable({
  providedIn: 'root'
})
export class PrefetchService {
  constructor(
    private coursesApi: CoursesApiService,
    private attendanceApi: AttendanceApiService,
    private dataProvider: DataService
  ) {}

  /**
   * Fire-and-forget from the caller's side — never awaited from the login
   * flow, so it can't slow down navigation. Failures are logged and
   * swallowed; a failed prefetch just means the cache stays as stale as it
   * already was, not a user-facing error for something the user didn't
   * explicitly ask for.
   */
  async prefetchClassesAndRosters(userNo: string | number, schoolId: string | number, sessionId: string): Promise<void> {
    try {
      const coursesRes = await this.coursesApi.getCourses({ user_no: userNo, school_id: schoolId, session_id: sessionId });
      const courses = coursesRes.data || [];
      const today = this.dataProvider.getFormatedDate(new Date());

      for (const course of courses) {
        if (!course.cid) continue;
        try {
          await this.attendanceApi.getClassStudentList({
            date: today,
            user_no: userNo,
            session_id: sessionId,
            course_id: course.cid,
            school_id: schoolId
          });
        } catch (error) {
          console.error(`PrefetchService: failed to prefetch roster for class ${course.cid}`, error);
        }
      }
    } catch (error) {
      console.error('PrefetchService: failed to prefetch classes', error);
    }
  }
}
