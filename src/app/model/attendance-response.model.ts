import { Student } from './student.model';

export interface AttendanceResponse {
  session?: boolean;
  success?: boolean;
  students?: Student[];
  // Numeric-as-string on the online path (backend sends strings, callers
  // parseInt() them) but a real number on the offline/IndexedDB-fallback
  // path in attendance-api.service.ts, which builds this object client-side
  // from cached data — another confirmed online/offline shape divergence.
  last_cem?: string | number;
  delay_rule?: string | number;
  totalsems?: string;
  canAddStudent?: boolean;
  // Per-period marking-teacher lookup, keyed 'sem-N', on the online path.
  // CONFIRMED DIVERGENCE: the offline/IndexedDB fallback path resolves this
  // as an empty array instead. Both are real runtime values — callers only
  // ever do optional-chained truthy checks, so this documents reality
  // rather than gapping it.
  semteacher?: Record<string, { teacher?: string; user_no?: string | number }> | unknown[];
  // Client-stapled before caching the offline snapshot (list-student.page.ts
  // / students.page.ts), not sent by the backend.
  date?: string;
  msg?: string;
  message?: string;
}
