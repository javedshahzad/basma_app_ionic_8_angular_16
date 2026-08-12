import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { StorageService } from '../service/storage.service';
import { UserType } from '../constants/user-type';

/**
 * Defense-in-depth alongside AuthGuard (governance review, Phase 4).
 * AuthGuard only proves "is someone logged in" -- it never checks role, so
 * a Teacher or Parent could reach an admin-only route (e.g. /users-list)
 * directly by URL. This does not replace server-side authorization (the
 * backend enforces its own checks independently, see Access_lib in
 * BasmaCP) -- it's the second layer, matching the plan's "no single layer
 * is trusted alone" principle, and it also spares a non-admin user from
 * briefly seeing an admin page's content before a page-level redirect
 * would have kicked in.
 *
 * Usage: `canActivate: [AuthGuard, RoleGuard], data: { roles: [UserType.Admin] }`.
 * A route with no `roles` in its data is allowed through unconditionally --
 * this guard is opt-in per route, not a blanket restriction.
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private zone: NgZone,
    private router: Router,
    private storageSr: StorageService
  ) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const allowedRoles: UserType[] | undefined = next.data?.['roles'];
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const isLoggedIn = await this.storageSr.get('userloggedin');
    const userType: string | undefined = isLoggedIn?.details?.user_type;

    if (userType && allowedRoles.includes(userType as UserType)) {
      return true;
    }

    this.zone.run(() => {
      this.router.navigate(['/tabs/classlist'], { replaceUrl: true });
    });
    return false;
  }
}
