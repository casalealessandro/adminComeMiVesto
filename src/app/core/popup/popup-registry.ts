import { InjectionToken, Type } from '@angular/core';

export interface PopupRegistration {
  readonly name: string;
  readonly component: Type<any>;
}

export const POPUP_REGISTRY = new InjectionToken<readonly PopupRegistration[]>('POPUP_REGISTRY');
