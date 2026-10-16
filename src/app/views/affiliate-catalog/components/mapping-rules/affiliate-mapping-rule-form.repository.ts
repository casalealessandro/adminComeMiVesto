import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { FormDefinition, FormDefinitionRepository } from '../../../../core/forms/contracts/form-definition-repository';
import { DynamicFormField } from '../../../../core/forms/models/dynamic-form-field';
import { AffiliateMappingRuleType } from '../../services/affiliate-catalog.service';

export const mappingRuleFormId = (type: AffiliateMappingRuleType, editing: boolean): string =>
  `affiliate-rule-${type.toLowerCase()}-${editing ? 'edit' : 'create'}`;

const select = (options: readonly { value: string | boolean; label: string }[]) => ({
  displayExp: 'label', valueExp: 'value', multiple: false, remote: false,
  parent: null, options: [...options],
});
const field = (name: string, label: string, required = false, type: DynamicFormField['type'] = 'textBox'): DynamicFormField =>
  ({ name, label, required, type, typeInput: 'text' });

export function buildMappingRuleFields(type: AffiliateMappingRuleType, editing: boolean): DynamicFormField[] {
  const fields: DynamicFormField[] = [
    ...(editing ? [] : [{ ...field('id', 'ID regola', true), maxLength: 100, placeholder: 'es. nuovo-colore-stone' }]),
    { ...field('label', 'Descrizione', true), maxLength: 150 },
    // Up to 100 aliases, each at most 120 characters, separated by newlines.
    { ...field('aliases', 'Termini riconosciuti (uno per riga)', false, 'textArea'), maxLength: 12100 },
  ];
  if (type === 'CATEGORY') fields.push(
    {
      ...field('category', 'Categoria ComeMiVesto', true, 'selectBox'),
      selectOptions: {
        displayExp: 'categoryName', valueExp: 'id', multiple: false,
        remote: true, api: 'outfitCategories', parent: null,
      },
    },
    {
      ...field('subcategory', 'Sottocategoria', false, 'selectBox'),
      selectOptions: {
        displayExp: 'categoryName', valueExp: 'id', multiple: false,
        remote: true, api: 'outfitCategories', parent: 'category',
      },
    },
    { ...field('genders', 'Genere applicabile'), type: 'selectBox', selectOptions: select([
      { value: '', label: 'Tutti' }, { value: 'D', label: 'Donna' },
      { value: 'U', label: 'Uomo' }, { value: 'U,D', label: 'Entrambi' },
    ]) },
  );
  if (type === 'COLOR') fields.push({ ...field('colorId', 'ID colore ComeMiVesto', true), maxLength: 30 });
  if (type === 'GENDER') fields.push({
    ...field('genderTargets', 'Genere riconosciuto', true), type: 'selectBox',
    selectOptions: select([
      { value: 'U', label: 'Uomo' }, { value: 'D', label: 'Donna' }, { value: 'U,D', label: 'Unisex' },
    ]),
  });
  if (type === 'SEASON') fields.push(
    { ...field('category', 'Categoria della regola', true), maxLength: 100 },
    { ...field('seasons', 'Stagioni (separate da virgola)', true), placeholder: 'SPRING, SUMMER' },
    { ...field('priority', 'Priorità', true), typeInput: 'number', min: 0, max: 1000 },
    { ...field('requireAll', 'Condizioni requireAll (JSON)', false, 'textArea') },
    { ...field('exclude', 'Esclusioni (una per riga)', false, 'textArea') },
  );
  fields.push(
    { ...field('note', 'Nota / evidenza', false, 'textArea'), maxLength: 300 },
    { ...field('enabled', 'Attiva', true), type: 'selectBox', selectOptions: select([
      { value: true, label: 'Sì' }, { value: false, label: 'No' },
    ]) },
  );
  return fields;
}

@Injectable()
export class AffiliateMappingRuleFormRepository implements FormDefinitionRepository {
  getFormById(id: string): Observable<FormDefinition> {
    const match = /^affiliate-rule-(category|color|gender|season)-(create|edit)$/.exec(id);
    if (!match) return throwError(() => new Error('Form dizionario non trovato'));
    const type = match[1].toUpperCase() as AffiliateMappingRuleType;
    return of({ id, nameForm: id, json: buildMappingRuleFields(type, match[2] === 'edit') });
  }
  getFormFields(id: string): Observable<DynamicFormField[]> {
    return new Observable(observer => {
      this.getFormById(id).subscribe({
        next: value => { observer.next(value.json); observer.complete(); },
        error: error => observer.error(error),
      });
    });
  }
  getForms(): Observable<FormDefinition[]> { return of([]); }
  async saveForm(): Promise<never> { throw new Error('Definizioni statiche'); }
  async deleteForm(): Promise<never> { throw new Error('Definizioni statiche'); }
}
