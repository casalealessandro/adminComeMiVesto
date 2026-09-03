import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.waitForUser();
  if (!user) return router.createUrlTree(['/login']);
  try {
    const access = await auth.refreshRole();
    return access.canAccessBackoffice && (access.role === 'admin' || access.role === 'editor')
      ? true : router.createUrlTree(['/access-denied']);
  } catch (error) {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      await auth.logout(false);
    }
    return router.createUrlTree(['/login']);
  }
};
