import { Injectable, inject } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import {
  FormDefinition,
  FormDefinitionRepository,
} from '../../../core/forms/contracts/form-definition-repository';
import { DynamicFormField } from '../../../core/forms/models/dynamic-form-field';
import {
  AFFILIATE_FEED_READ_MODES,
  AffiliateProgram,
} from '../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../services/affiliate-catalog.service';

export const AFFILIATE_FEED_CREATE_FORM = 'affiliate-feed-create';
export const AFFILIATE_FEED_EDIT_FORM = 'affiliate-feed-edit';

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

const programSelect = (programs: readonly AffiliateProgram[]) => ({
  displayExp: 'label',
  valueExp: 'value',
  multiple: false,
  remote: false,
  parent: null,
  options: programs.map((program) => ({
    label: `${program.name} · ${program.networkProgramId}`,
    value: program.id,
  })),
});

const editableFields: DynamicFormField[] = [
  {
    name: 'name',
    type: 'textBox',
    typeInput: 'text',
    label: 'Nome',
    required: true,
    placeholder: 'Nome feed',
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
    name: 'adapterType',
    type: 'textBox',
    typeInput: 'text',
    label: 'Adapter',
    required: false,
    placeholder: 'Vuoto = adapter predefinito del programma',
  },
  {
    name: 'readMode',
    type: 'selectBox',
    typeInput: 'text',
    label: 'Modalità lettura',
    required: true,
    selectOptions: localSelect(AFFILIATE_FEED_READ_MODES),
  },
  {
    name: 'locale',
    type: 'textBox',
    typeInput: 'text',
    label: 'Locale',
    required: true,
    placeholder: 'es. it-IT',
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
];

export function buildAffiliateFeedFormDefinitions(programs: readonly AffiliateProgram[]): FormDefinition[] {
  const createFields: DynamicFormField[] = [
    {
      name: 'networkFeedId',
      type: 'textBox',
      typeInput: 'text',
      label: 'Network Feed ID',
      required: true,
      placeholder: 'ID feed sul network',
    },
    {
      name: 'affiliateProgramId',
      type: 'selectBox',
      typeInput: 'text',
      label: 'Programma affiliato',
      required: true,
      selectOptions: programSelect(programs),
    },
    ...editableFields,
  ];

  return [
    {
      id: AFFILIATE_FEED_CREATE_FORM,
      nameForm: 'Nuovo feed affiliato',
      json: createFields,
    },
    {
      id: AFFILIATE_FEED_EDIT_FORM,
      nameForm: 'Modifica feed affiliato',
      json: [...editableFields],
    },
  ];
}

@Injectable()
export class AffiliateFeedFormDefinitionRepository implements FormDefinitionRepository {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  getForms(): Observable<FormDefinition[]> {
    return this.affiliateCatalogService.getPrograms().pipe(
      map((programs) => buildAffiliateFeedFormDefinitions(programs)),
    );
  }

  getFormById(formId: string): Observable<FormDefinition> {
    if (formId === AFFILIATE_FEED_EDIT_FORM) {
      return of(buildAffiliateFeedFormDefinitions([])[1]);
    }

    if (formId !== AFFILIATE_FEED_CREATE_FORM) {
      return throwError(() => new Error(`Affiliate feed form definition not found: ${formId}`));
    }

    return this.affiliateCatalogService.getPrograms().pipe(
      map((programs) => buildAffiliateFeedFormDefinitions(programs)[0]),
    );
  }

  getFormFields(formId: string): Observable<DynamicFormField[]> {
    return this.getFormById(formId).pipe(map((definition) => definition.json));
  }

  async saveForm(): Promise<never> {
    throw new Error('Affiliate feed form definitions are read-only application configuration.');
  }

  async deleteForm(): Promise<never> {
    throw new Error('Affiliate feed form definitions are read-only application configuration.');
  }
}
