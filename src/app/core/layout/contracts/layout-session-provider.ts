import { InjectionToken } from '@angular/core';

export interface LayoutSessionProvider {
  isAuthenticated(): boolean;
  waitForSession(): Promise<boolean>;
}

export const LAYOUT_SESSION_PROVIDER = new InjectionToken<LayoutSessionProvider>('LAYOUT_SESSION_PROVIDER');
