import { InjectionToken } from '@angular/core';

export interface HeaderConfig {
  logoUrl: string;
  logoAlt: string;
  defaultAvatarUrl: string;
}

export const HEADER_CONFIG = new InjectionToken<HeaderConfig>('HEADER_CONFIG');
