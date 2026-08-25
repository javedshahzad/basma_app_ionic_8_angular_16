import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { HasRoleDirective } from './has-role.directive';
import { PermissionService } from '../service/permission/permission.service';
import { AuthService } from '../service/auth/auth.service';
import { UserType } from '../constants/user-type';

@Component({
  template: `<div *appHasRole="[UserType.Admin, UserType.Moderator]" class="guarded">secret</div>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [HasRoleDirective]
})
class HostComponent {
  UserType = UserType;
}

describe('HasRoleDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let authServiceStub: { currentUser: any; event: Subject<any> };

  function guardedEl(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.guarded');
  }

  beforeEach(() => {
    authServiceStub = { currentUser: null, event: new Subject() };

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [PermissionService, { provide: AuthService, useValue: authServiceStub }]
    });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('does not render the element when logged out', () => {
    fixture.detectChanges();
    expect(guardedEl()).toBeNull();
  });

  it('does not render the element for a role not in the allow-list', () => {
    authServiceStub.currentUser = { details: { user_type: UserType.Teacher } };
    fixture.detectChanges();
    expect(guardedEl()).toBeNull();
  });

  it('renders the element for a role in the allow-list', () => {
    authServiceStub.currentUser = { details: { user_type: UserType.Admin } };
    fixture.detectChanges();
    expect(guardedEl()).not.toBeNull();
    expect(guardedEl()!.textContent).toContain('secret');
  });

  it('re-evaluates when AuthService.event fires (e.g. switch-account)', () => {
    fixture.detectChanges();
    expect(guardedEl()).toBeNull();

    authServiceStub.currentUser = { details: { user_type: UserType.Moderator } };
    authServiceStub.event.next({ loggedin: true });
    fixture.detectChanges();

    expect(guardedEl()).not.toBeNull();
  });

  it('removes the element again if a subsequent event drops the role', () => {
    authServiceStub.currentUser = { details: { user_type: UserType.Admin } };
    fixture.detectChanges();
    expect(guardedEl()).not.toBeNull();

    authServiceStub.currentUser = { details: { user_type: UserType.Parent } };
    authServiceStub.event.next({ loggedin: false });
    fixture.detectChanges();

    expect(guardedEl()).toBeNull();
  });
});
