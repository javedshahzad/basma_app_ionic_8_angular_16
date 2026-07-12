import { TestBed } from '@angular/core/testing';

import { AttendanceManagerService } from './attendance-manager.service';

describe('AttendanceManagerService', () => {
  let service: AttendanceManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttendanceManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
