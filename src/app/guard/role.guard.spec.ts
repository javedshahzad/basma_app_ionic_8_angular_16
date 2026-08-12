import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RoleGuard } from './role.guard';
import { StorageService } from '../service/storage.service';
import { UserType } from '../constants/user-type';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let router: Router;
  let storedUser: any;

  function makeSnapshot(roles?: UserType[]): ActivatedRouteSnapshot {
    return { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
  }

  beforeEach(() => {
    storedUser = null;
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        RoleGuard,
        {
          provide: StorageService,
          useValue: { get: () => Promise.resolve(storedUser) }
        }
      ]
    });
    guard = TestBed.inject(RoleGuard);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('allows any logged-in user through when the route has no roles data', async () => {
    storedUser = { details: { user_type: UserType.Teacher } };
    const result = await guard.canActivate(makeSnapshot(undefined), {} as RouterStateSnapshot);
    expect(result).toBeTrue();
  });

  it('allows a user whose role is in the route\'s allowed list', async () => {
    storedUser = { details: { user_type: UserType.Admin } };
    const result = await guard.canActivate(makeSnapshot([UserType.Admin]), {} as RouterStateSnapshot);
    expect(result).toBeTrue();
  });

  it('denies and redirects a user whose role is not in the route\'s allowed list', async () => {
    storedUser = { details: { user_type: UserType.Teacher } };
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    const result = await guard.canActivate(makeSnapshot([UserType.Admin]), {} as RouterStateSnapshot);
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/tabs/classlist'], { replaceUrl: true });
  });

  it('denies when there is no logged-in user at all', async () => {
    storedUser = null;
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    const result = await guard.canActivate(makeSnapshot([UserType.Admin]), {} as RouterStateSnapshot);
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalled();
  });
});
