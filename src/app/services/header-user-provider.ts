import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface HeaderUser {
  displayName: string;
  profileLabel: string;
  photoURL?: string;
}

export interface HeaderUserProvider {
  getUser(): Observable<HeaderUser | null>;
  logout(): Promise<void>;
}

export const HEADER_USER_PROVIDER = new InjectionToken<HeaderUserProvider>('HEADER_USER_PROVIDER');
