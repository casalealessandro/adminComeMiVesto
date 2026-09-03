import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';

export function isBackendRequest(url: string): boolean {
  try {
    const requestUrl = new URL(url, window.location.origin);
    const apiUrl = new URL(environment.apiBaseUrl, window.location.origin);
    return requestUrl.origin === apiUrl.origin && requestUrl.pathname.startsWith(apiUrl.pathname);
  } catch { return false; }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isBackendRequest(request.url)) return next(request);
  const auth = inject(AuthService);
  return from(auth.getIdToken()).pipe(
    switchMap(token => next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request)),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && request.url.indexOf('/user/me/role') === -1) void auth.handleUnauthorized();
      return throwError(() => error);
    })
  );
};
