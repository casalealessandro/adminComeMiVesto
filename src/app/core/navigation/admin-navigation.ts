import { InjectionToken } from '@angular/core';

export interface AdminNavigationItem {
  path: string;
  label: string;
  icon: string;
}

export const ADMIN_NAVIGATION = new InjectionToken<readonly AdminNavigationItem[]>('ADMIN_NAVIGATION');
