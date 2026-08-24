import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../service/auth/auth.service';
import { PermissionService } from '../service/permission/permission.service';
import { UserType } from '../constants/user-type';

/**
 * Structural directive replacement for the
 * `*ngIf="userType === UserType.Admin || userType === UserType.Moderator"`
 * pattern repeated across templates app-wide:
 *
 *   <div *appHasRole="[UserType.Admin, UserType.Moderator]">...</div>
 *
 * Re-evaluates on AuthService's own event Subject (already fired on
 * login/logout/switch-account by every call site that changes who's
 * logged in — see auth.service.ts's publishEvent()/changeUser()), so a
 * role change while the page is open (e.g. switching accounts) updates
 * the view the same way the equivalent *ngIf on a component field would
 * have, once that field is refreshed by the same event.
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private roles: UserType[] = [];
  private hasView = false;
  private destroyRef = inject(DestroyRef);

  @Input() set appHasRole(roles: UserType[] | UserType) {
    this.roles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.event.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateView());
  }

  private updateView(): void {
    const allowed = this.permissionService.hasRole(...this.roles);
    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
