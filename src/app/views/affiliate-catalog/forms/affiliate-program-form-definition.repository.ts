import { Injectable } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import { DynamicFormField } from '../../../core/forms/models/dynamic-form-field';
import {
  FormDefinition,
  FormDefinitionRepository,
} from '../../../core/forms/contracts/form-definition-repository';
import {
  AFFILIATE_NETWORK_PROGRAM_STATUSES,
  AFFILIATE_NETWORKS,
  PRICE_SEGMENTS,
} from '../models/affiliate-catalog.models';

export const AFFILIATE_PROGRAM_CREATE_FORM = 'affiliate-program-create';
export const AFFILIATE_PROGRAM_EDIT_FORM = 'affiliate-program-edit';

const localSelect = (options: readonly string[]) => ({
  displayExp: 'label',
  valueExp: 'value',
  multiple: false,
  remote: false,
  parent: null,
  options: options.map((value) => ({ label: value, value })),
});

const enabledSelect = {
  displayExp: 'label',
  valueExp: 'value',
  multiple: false,
  remote: false,
  parent: null,
  options: [
    { label: 'Sì', value: true },
    { label: 'No', value: false },
  ],
};

const editableFields: DynamicFormField[] = [
  {
    name: 'name',
    type: 'textBox',
    typeInput: 'text',
    label: 'Nome',
    required: true,
    placeholder: 'Nome programma',
  },
  {
    name: 'networkStatus',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Stato network',
    required: true,
    selectOptions: localSelect(AFFILIATE_NETWORK_PROGRAM_STATUSES),
  },
  {
    name: 'enabled',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Abilitato',
    required: true,
    selectOptions: enabledSelect,
  },
  {
    name: 'defaultAdapterType',
    type: 'textBox',
    typeInput: 'text',
    label: 'Adapter predefinito',
    required: true,
    placeholder: 'TRADEDOUBLER',
  },
  {
    name: 'market',
    type: 'textBox',
    typeInput: 'text',
    label: 'Mercato',
    required: true,
    maxLength: 10,
    placeholder: 'IT',
  },
  {
    name: 'currency',
    type: 'textBox',
    typeInput: 'text',
    label: 'Valuta',
    required: true,
    minLength: 3,
    maxLength: 3,
    placeholder: 'EUR',
  },
  {
    name: 'priceSegment',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Fascia prezzo',
    required: true,
    selectOptions: localSelect(PRICE_SEGMENTS),
  },
];

const createFields: DynamicFormField[] = [
  {
    name: 'network',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Network',
    required: true,
    selectOptions: localSelect(AFFILIATE_NETWORKS),
  },
  {
    name: 'networkProgramId',
    type: 'textBox',
    typeInput: 'text',
    label: 'Network Program ID',
    required: true,
    placeholder: 'ID programma sul network',
  },
  ...editableFields,
];

const definitions: readonly FormDefinition[] = [
  {
    id: AFFILIATE_PROGRAM_CREATE_FORM,
    nameForm: 'Nuovo programma affiliato',
    json: createFields,
  },
  {
    id: AFFILIATE_PROGRAM_EDIT_FORM,
    nameForm: 'Modifica programma affiliato',
    json: editableFields,
  },
];

@Injectable()
export class AffiliateProgramFormDefinitionRepository implements FormDefinitionRepository {
  getForms(): Observable<FormDefinition[]> {
    return of(definitions.map((definition) => ({ ...definition, json: [...definition.json] })));
  }

  getFormById(formId: string): Observable<FormDefinition> {
    const definition = definitions.find((item) => item.id === formId);
    return definition
      ? of({ ...definition, json: [...definition.json] })
      : throwError(() => new Error(`Affiliate form definition not found: ${formId}`));
  }

  getFormFields(formId: string): Observable<DynamicFormField[]> {
    return this.getFormById(formId).pipe(map((definition) => definition.json));
  }

  async saveForm(): Promise<never> {
    throw new Error('Affiliate form definitions are read-only application configuration.');
  }

  async deleteForm(): Promise<never> {
    throw new Error('Affiliate form definitions are read-only application configuration.');
  }
}
