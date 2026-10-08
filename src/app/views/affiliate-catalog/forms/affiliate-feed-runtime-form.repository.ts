import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, throwError } from 'rxjs';
import {
  FormDefinition,
  FormDefinitionRepository,
} from '../../../core/forms/contracts/form-definition-repository';
import { DynamicFormField } from '../../../core/forms/models/dynamic-form-field';
import { FormService } from '../../../services/form.service';
import { AffiliateCatalogService } from '../services/affiliate-catalog.service';
import { AffiliateProgram } from '../models/affiliate-catalog.models';

// Runtime identities are create-only. The remaining fields remain editable in Firestore/Form Builder.
export const AFFILIATE_FEED_CREATE_RUNTIME_FORM = 'affiliateFeed:create';
export const AFFILIATE_FEED_EDIT_RUNTIME_FORM = 'affiliateFeed:edit';
const STORED_FORM_ID = 'affiliateFeed';
const IDENTITY_NAMES = new Set(['networkFeedId', 'affiliateProgramId']);

export function affiliateFeedRuntimeFields(
  fields: DynamicFormField[],
  programs: AffiliateProgram[],
  create: boolean,
): DynamicFormField[] {
  const editable = fields.filter(field => !IDENTITY_NAMES.has(field.name));
  if (!create) return editable;

  const networkFeedId: DynamicFormField = {
    name: 'networkFeedId', type: 'textBox', typeInput: 'text',
    label: 'Network Feed ID', required: true, placeholder: 'ID feed sul network',
  };
  const affiliateProgramId: DynamicFormField = {
    name: 'affiliateProgramId', type: 'selectBox', typeInput: 'text',
    label: 'Programma affiliato', required: true,
    selectOptions: {
      displayExp: 'label', valueExp: 'value', multiple: false, remote: false,
      parent: null,
      options: programs.map(program => ({
        label: `${program.name} · ${program.networkProgramId}`, value: program.id,
      })),
    },
  };
  return [networkFeedId, affiliateProgramId, ...editable];
}

@Injectable()
export class AffiliateFeedRuntimeFormRepository implements FormDefinitionRepository {
  private readonly formService = inject(FormService);
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  getFormById(formId: string): Observable<FormDefinition> {
    if (formId === AFFILIATE_FEED_EDIT_RUNTIME_FORM) {
      return this.formService.getFormById(STORED_FORM_ID).pipe(map(form => ({
        ...form, id: formId,
        json: affiliateFeedRuntimeFields(form.json, [], false),
      })));
    }
    if (formId !== AFFILIATE_FEED_CREATE_RUNTIME_FORM) {
      return throwError(() => new Error(`Unknown affiliate feed form: ${formId}`));
    }
    return forkJoin({
      form: this.formService.getFormById(STORED_FORM_ID),
      programs: this.affiliateCatalogService.getPrograms(),
    }).pipe(map(({ form, programs }) => ({
      ...form, id: formId,
      json: affiliateFeedRuntimeFields(form.json, programs, true),
    })));
  }

  getFormFields(formId: string): Observable<DynamicFormField[]> {
    return this.getFormById(formId).pipe(map(form => form.json));
  }

  getForms(): Observable<FormDefinition[]> {
    return forkJoin([
      this.getFormById(AFFILIATE_FEED_CREATE_RUNTIME_FORM),
      this.getFormById(AFFILIATE_FEED_EDIT_RUNTIME_FORM),
    ]);
  }

  saveForm(): Promise<never> {
    return Promise.reject(new Error('Runtime affiliate feed form is read-only.'));
  }

  deleteForm(): Promise<never> {
    return Promise.reject(new Error('Runtime affiliate feed form is read-only.'));
  }
}
