import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { AttendanceManagerService } from './attendance-manager.service';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('AttendanceManagerService', () => {
  let service: AttendanceManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AppRate, useValue: {} },
        {
          provide: IonicStorage,
          useValue: {
            create: () =>
              Promise.resolve({
                get: () => Promise.resolve(null),
                set: () => Promise.resolve(),
                remove: () => Promise.resolve(),
                clear: () => Promise.resolve()
              })
          }
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AttendanceManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isDelayMark', () => {
    it('treats a late mark (3) as a delay only in its own period', () => {
      const sheet = { 'cem-1': 3, 'entered_by-1': 7 };
      expect(service.isDelayMark(sheet, 1)).toBeTrue();
      expect(service.isDelayMark(sheet, 2)).toBeFalse();
    });

    it('applies the legacy student-level absentDueToDelay flag to period 1 only', () => {
      // A student who reached the delay rule: absence in period 1 only.
      const sheet = { 'cem-1': 0, 'entered_by-1': 7, absentDueToDelay: 1 };
      expect(service.isDelayMark(sheet, 1)).toBeTrue();
      expect(service.isDelayMark(sheet, 2)).toBeFalse();
      expect(service.isDelayMark(sheet, 7)).toBeFalse();
    });

    it('prefers the per-period flag when the server sends one', () => {
      const sheet = { 'cem-1': 0, 'cem-2': 1, absentDueToDelay: 1, 'absentDueToDelay-1': 1, 'absentDueToDelay-2': 0 };
      expect(service.isDelayMark(sheet, 1)).toBeTrue();
      expect(service.isDelayMark(sheet, 2)).toBeFalse();
    });

    it('is false for an empty or missing sheet', () => {
      expect(service.isDelayMark(undefined, 1)).toBeFalse();
      expect(service.isDelayMark({}, 1)).toBeFalse();
    });
  });

  it('lets a period after a delay-rule absence be completed', () => {
    // Regression: the delay-absent student used to count as "remaining" in
    // every later period while being untappable, so the teacher's submit
    // button could never enable.
    const students = [
      { sid: 1, sheet: { 'cem-1': 0, 'entered_by-1': 9, absentDueToDelay: 1 } },
      { sid: 2, sheet: {} },
    ];
    const local = { 'cem-2': { 'sid-1': '1', 'sid-2': '1' } };
    expect(service.isDelayMark(students[0].sheet, 2)).toBeFalse();
    expect(service.calculatePeriodStats(students, 2, local).remaining).toBe(0);
  });
});
