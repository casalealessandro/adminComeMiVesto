import { InjectionToken } from '@angular/core';

export interface ScrollInteractionPolicy {
  onScroll(event: Event): void;
}

export const SCROLL_INTERACTION_POLICY = new InjectionToken<ScrollInteractionPolicy>('SCROLL_INTERACTION_POLICY');
