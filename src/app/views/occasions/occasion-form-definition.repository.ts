import { Injectable } from '@angular/core';
import { map, Observable, of, throwError } from 'rxjs';
import { FormDefinition, FormDefinitionRepository } from '../../core/forms/contracts/form-definition-repository';
import { DynamicFormField } from '../../core/forms/models/dynamic-form-field';

export const OCCASION_CREATE_FORM = 'outfit-occasion-create';
export const OCCASION_EDIT_FORM = 'outfit-occasion-edit';
const editableFields: DynamicFormField[] = [
  { name: 'value', label: 'Nome occasione', type: 'textBox', typeInput: 'text', required: true, maxLength: 100 },
  { name: 'order', label: 'Ordine', type: 'textBox', typeInput: 'number', required: true },
  { name: 'active', label: 'Attiva', type: 'selectBox', typeInput: 'text', required: true,
    selectOptions: { displayExp: 'label', valueExp: 'value', multiple: false, remote: false, parent: null,
      options: [{ label: 'Sì', value: true }, { label: 'No', value: false }] } },
];
const definitions: FormDefinition[] = [
  { id: OCCASION_CREATE_FORM, nameForm: 'Nuova occasione', json: [
    { name: 'id', label: 'Codice (tra i sette codici supportati)', type: 'textBox', typeInput: 'text', required: true, maxLength: 64 },
    ...editableFields,
  ] },
  { id: OCCASION_EDIT_FORM, nameForm: 'Modifica occasione', json: editableFields },
];

@Injectable()
export class OccasionFormDefinitionRepository implements FormDefinitionRepository {
  getForms(): Observable<FormDefinition[]> { return of(definitions); }
  getFormById(id: string): Observable<FormDefinition> {
    const found = definitions.find(item => item.id === id);
    return found ? of(found) : throwError(() => new Error('Unknown occasion form'));
  }
  getFormFields(id: string): Observable<DynamicFormField[]> { return this.getFormById(id).pipe(map(x => x.json)); }
  async saveForm(): Promise<never> { throw new Error('Read-only form definition'); }
  async deleteForm(): Promise<never> { throw new Error('Read-only form definition'); }
}
