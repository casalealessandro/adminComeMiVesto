import { Injectable } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import {
  FormDefinition,
  FormDefinitionRepository,
} from '../../../core/forms/contracts/form-definition-repository';
import { DynamicFormField } from '../../../core/forms/models/dynamic-form-field';
import { AiCreatorStyle } from '../models/ai-creator.models';

export const AFFILIATE_AI_CREATOR_CREATE_FORM = 'affiliate-ai-creator-create';
export const AFFILIATE_AI_CREATOR_EDIT_FORM = 'affiliate-ai-creator-edit';

const styleOptions: ReadonlyArray<{ label: string; value: AiCreatorStyle }> = [
  { value: 'C', label: 'Casual' },
  { value: 'B', label: 'Business' },
  { value: 'SP', label: 'Sportivo' },
  { value: 'SC', label: 'Smart casual' },
  { value: 'E', label: 'Elegante' },
  { value: 'AT', label: 'Alternativo' },
  { value: 'FES', label: 'Festival' },
  { value: 'CL', label: 'Classico' },
  { value: 'TR', label: 'Trendy' },
  { value: 'SE', label: 'Serata' },
];

const singleSelect = (options: ReadonlyArray<{ label: string; value: unknown }>) => ({
  displayExp: 'label',
  valueExp: 'value',
  multiple: false,
  remote: false,
  parent: null,
  options: [...options],
});

const multipleSelect = (options: ReadonlyArray<{ label: string; value: unknown }>) => ({
  displayExp: 'label',
  valueExp: 'value',
  multiple: true,
  remote: false,
  parent: null,
  options: [...options],
});

const editableFields: DynamicFormField[] = [
  {
    name: 'displayName',
    type: 'textBox',
    typeInput: 'text',
    label: 'Display name',
    required: true,
    maxLength: 100,
    placeholder: 'Nome visualizzato nel profilo',
  },
  {
    name: 'nome',
    type: 'textBox',
    typeInput: 'text',
    label: 'Nome',
    required: true,
    maxLength: 100,
  },
  {
    name: 'cognome',
    type: 'textBox',
    typeInput: 'text',
    label: 'Cognome',
    required: true,
    maxLength: 100,
  },
  {
    name: 'gender',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Genere',
    required: true,
    selectOptions: singleSelect([
      { label: 'Donna', value: 'D' },
      { label: 'Uomo', value: 'U' },
    ]),
  },
  {
    name: 'photoURL',
    type: 'fileBox',
    typeInput: 'file',
    label: 'Foto profilo',
    required: false,
    fileBoxOptions: {
      maxWidth: 512,
      maxHeight: 512,
      maxSize: 5,
    },
  },
  {
    name: 'bio',
    type: 'textArea',
    typeInput: 'text',
    label: 'Bio pubblica',
    required: true,
    maxLength: 500,
    placeholder: 'Es. Virtual fashion creator di ComeMiVesto.',
  },
  {
    name: 'styleAffinity',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Affinità stilistiche',
    required: true,
    selectOptions: multipleSelect(styleOptions),
  },
  {
    name: 'personaPrompt',
    type: 'textArea',
    typeInput: 'text',
    label: 'Personalità / linea editoriale',
    required: true,
    maxLength: 1500,
    placeholder: 'Descrivi gusto, palette, occasioni preferite e modo in cui deve comporre i look.',
  },
  {
    name: 'active',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Attivo per nuove generazioni',
    required: true,
    selectOptions: singleSelect([
      { label: 'Sì', value: true },
      { label: 'No', value: false },
    ]),
  },
];

const createFields: DynamicFormField[] = [
  {
    name: 'email',
    type: 'textBox',
    typeInput: 'email',
    label: 'Email account',
    required: true,
    maxLength: 320,
    placeholder: 'creator@comemivesto.app',
  },
  ...editableFields,
];

const definitions: readonly FormDefinition[] = [
  {
    id: AFFILIATE_AI_CREATOR_CREATE_FORM,
    nameForm: 'Nuovo creator AI',
    json: createFields,
  },
  {
    id: AFFILIATE_AI_CREATOR_EDIT_FORM,
    nameForm: 'Modifica creator AI',
    json: editableFields,
  },
];

@Injectable()
export class AffiliateAiCreatorFormDefinitionRepository implements FormDefinitionRepository {
  getForms(): Observable<FormDefinition[]> {
    return of(definitions.map((definition) => ({ ...definition, json: [...definition.json] })));
  }

  getFormById(formId: string): Observable<FormDefinition> {
    const definition = definitions.find((item) => item.id === formId);
    return definition
      ? of({ ...definition, json: [...definition.json] })
      : throwError(() => new Error(`Affiliate AI creator form definition not found: ${formId}`));
  }

  getFormFields(formId: string): Observable<DynamicFormField[]> {
    return this.getFormById(formId).pipe(map((definition) => definition.json));
  }

  async saveForm(): Promise<never> {
    throw new Error('Affiliate AI creator form definitions are read-only application configuration.');
  }

  async deleteForm(): Promise<never> {
    throw new Error('Affiliate AI creator form definitions are read-only application configuration.');
  }
}
