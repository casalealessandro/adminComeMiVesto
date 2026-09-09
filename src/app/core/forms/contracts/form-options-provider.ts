import { InjectionToken } from '@angular/core';

export interface FormOptionsProvider {
  getData(api: string, queryString?: string): Promise<any>;
}

export const FORM_OPTIONS_PROVIDER = new InjectionToken<FormOptionsProvider>('FORM_OPTIONS_PROVIDER');
