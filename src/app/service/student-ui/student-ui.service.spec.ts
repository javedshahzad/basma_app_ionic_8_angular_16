import { TestBed } from '@angular/core/testing';

import { StudentUiService } from './student-ui.service';

describe('StudentUiService', () => {
  let service: StudentUiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentUiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
