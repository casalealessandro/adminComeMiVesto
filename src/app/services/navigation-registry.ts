import { InjectionToken } from '@angular/core';

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
}

export const NAVIGATION_ITEMS = new InjectionToken<readonly NavigationItem[]>('NAVIGATION_ITEMS');
