import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { PermissionService } from './permission.service';
import { AuthService } from '../auth/auth.service';
import { UserType } from '../../constants/user-type';

describe('PermissionService', () => {
  let service: PermissionService;
  let authServiceStub: { currentUser: any; event: Subject<any> };

  beforeEach(() => {
    authServiceStub = { currentUser: null, event: new Subject() };

    TestBed.configureTestingModule({
      providers: [PermissionService, { provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(PermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('hasRole() returns false when nobody is logged in', () => {
    expect(service.hasRole(UserType.Admin)).toBeFalse();
  });

  it('hasRole() returns true when the current user matches one of the given roles', () => {
    authServiceStub.currentUser = { details: { user_type: UserType.Moderator } };
    expect(service.hasRole(UserType.Admin, UserType.Moderator, UserType.Viewer)).toBeTrue();
  });

  it('hasRole() returns false when the current user matches none of the given roles', () => {
    authServiceStub.currentUser = { details: { user_type: UserType.Parent } };
    expect(service.hasRole(UserType.Admin, UserType.Moderator)).toBeFalse();
  });

  it('reflects a live change to AuthService.currentUser without re-injecting the service', () => {
    expect(service.hasRole(UserType.Admin)).toBeFalse();
    authServiceStub.currentUser = { details: { user_type: UserType.Admin } };
    expect(service.hasRole(UserType.Admin)).toBeTrue();
  });

  it('currentUserType returns the raw user_type, or undefined when logged out', () => {
    expect(service.currentUserType).toBeUndefined();
    authServiceStub.currentUser = { details: { user_type: UserType.Teacher } };
    expect(service.currentUserType).toBe(UserType.Teacher);
  });
});
