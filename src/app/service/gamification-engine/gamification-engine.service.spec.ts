import { TestBed } from '@angular/core/testing';

import { GamificationEngineService } from './gamification-engine.service';

describe('GamificationEngineService', () => {
  let service: GamificationEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GamificationEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
