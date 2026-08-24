import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserType } from '../../constants/user-type';

/**
 * Single source of truth for "does the current user have role X" —
 * replaces the ~40-file pattern of inline `userType === UserType.Admin ||
 * userType === UserType.Moderator || ...` comparisons scattered across
 * both component logic and templates (the same gap class that let 6+
 * routes go unguarded before RoleGuard's rollout: nothing enforced a
 * single, auditable pattern for role checks).
 *
 * Deliberately synchronous, not a fresh async storage read per call:
 * AuthService.currentUser is already the app's existing in-memory,
 * always-current source of truth for the logged-in user (hydrated once at
 * startup, kept in sync on login/logout/switch-account — MyInterceptor
 * already depends on it being synchronous for the exact same reason).
 * This service adds no new state, just centralizes the comparison.
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private authService: AuthService) {}

  get currentUserType(): UserType | undefined {
    return this.authService.currentUser?.details?.user_type;
  }

  hasRole(...roles: UserType[]): boolean {
    const userType = this.currentUserType;
    return !!userType && roles.includes(userType);
  }
}
