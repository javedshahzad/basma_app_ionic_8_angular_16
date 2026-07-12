import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { StorageService } from '../service/storage.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule], // 🟢 إضافة RouterTestingModule للتعامل مع التوجيه
      providers: [
        AuthGuard,
        {
          // 🟢 حقن خدمة التخزين الوهمية لكي لا يفشل الاختبار
          provide: StorageService,
          useValue: { get: () => Promise.resolve(null) } 
        }
      ]
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});