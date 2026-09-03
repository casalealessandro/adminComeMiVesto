import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.waitForUser();
  if (!user) return router.createUrlTree(['/login']);
  try {
    const access = await auth.refreshRole();
    return access.canAccessBackoffice && (access.role === 'admin' || access.role === 'editor')
      ? true : router.createUrlTree(['/access-denied']);
  } catch { return router.createUrlTree(['/login']); }
};
