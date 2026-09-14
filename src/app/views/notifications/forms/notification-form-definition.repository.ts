import { Injectable } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import { FormDefinition, FormDefinitionRepository } from '../../../core/forms/contracts/form-definition-repository';
import { DynamicFormField } from '../../../core/forms/models/dynamic-form-field';

export const NOTIFICATION_FORM = 'notification-form';

const localSelect = (options: { label: string; value: unknown }[]) => ({
  displayExp: 'label',
  valueExp: 'value',
  multiple: false,
  remote: false,
  parent: null,
  options,
});

const fields: DynamicFormField[] = [
  {
    name: 'title',
    type: 'textBox',
    typeInput: 'text',
    label: 'Titolo',
    required: true,
    maxLength: 120,
    placeholder: 'Titolo notifica',
  },
  {
    name: 'body',
    type: 'textArea',
    typeInput: 'text',
    label: 'Messaggio',
    required: true,
    maxLength: 500,
    placeholder: 'Testo della notifica',
  },
  {
    name: 'deepLink',
    type: 'textBox',
    typeInput: 'text',
    label: 'Deep link',
    required: false,
    placeholder: 'comemivesto://outfit/123',
  },
  {
    name: 'type',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Tipo',
    required: true,
    selectOptions: localSelect([
      { label: 'Giornaliera', value: 'DAILY' },
      { label: 'Manuale', value: 'MANUAL' },
    ]),
  },
  {
    name: 'enabled',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Abilitata',
    required: true,
    selectOptions: localSelect([
      { label: 'Sì', value: true },
      { label: 'No', value: false },
    ]),
  },
];

const definition: FormDefinition = {
  id: NOTIFICATION_FORM,
  nameForm: 'Notifica',
  json: fields,
};

@Injectable()
export class NotificationFormDefinitionRepository implements FormDefinitionRepository {
  getForms(): Observable<FormDefinition[]> {
    return of([{ ...definition, json: [...definition.json] }]);
  }

  getFormById(formId: string): Observable<FormDefinition> {
    return formId === NOTIFICATION_FORM
      ? of({ ...definition, json: [...definition.json] })
      : throwError(() => new Error(`Notification form definition not found: ${formId}`));
  }

  getFormFields(formId: string): Observable<DynamicFormField[]> {
    return this.getFormById(formId).pipe(map((item) => item.json));
  }

  async saveForm(): Promise<never> {
    throw new Error('Notification form definition is read-only application configuration.');
  }

  async deleteForm(): Promise<never> {
    throw new Error('Notification form definition is read-only application configuration.');
  }
}
