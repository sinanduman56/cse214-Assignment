import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.userRole();
    if (role && allowedRoles.map((r) => r.toLowerCase()).includes(role.toLowerCase())) {
      return true;
    }
    return router.createUrlTree(['/auth/login']);
  };
}
