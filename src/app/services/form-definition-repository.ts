import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { DynamicFormField } from '../interface/dynamic-form-field';

export interface FormDefinition {
  id: string;
  nameForm: string;
  json: DynamicFormField[];
}

export interface FormDefinitionRepository {
  getForms(): Observable<FormDefinition[]>;
  getFormById(formId: string): Observable<FormDefinition>;
  getFormFields(formId: string): Observable<DynamicFormField[]>;
  saveForm(formId: string, form: Partial<FormDefinition>): Promise<unknown>;
  deleteForm(formId: string): Promise<unknown>;
}

export const FORM_DEFINITION_REPOSITORY = new InjectionToken<FormDefinitionRepository>('FORM_DEFINITION_REPOSITORY');
