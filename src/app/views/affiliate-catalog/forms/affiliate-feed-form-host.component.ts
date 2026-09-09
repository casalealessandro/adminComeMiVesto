import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { FORM_DEFINITION_REPOSITORY } from '../../../core/forms/contracts/form-definition-repository';
import { DynamicFormComponent } from '../../../core/forms/dynamic-form/dynamic-form.component';
import {
  AffiliateFeedCreateInput,
  AffiliateFeedUpdateInput,
} from '../models/affiliate-catalog-api.models';
import { AffiliateFeed, AffiliateFeedReadMode } from '../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../services/affiliate-catalog.service';
import {
  AFFILIATE_FEED_CREATE_FORM,
  AFFILIATE_FEED_EDIT_FORM,
  AffiliateFeedFormDefinitionRepository,
} from './affiliate-feed-form-definition.repository';

export type AffiliateFeedFormMode = 'create' | 'edit';

export interface AffiliateFeedFormContext {
  mode: AffiliateFeedFormMode;
  feed?: AffiliateFeed;
  programName?: string;
}

export interface AffiliateFeedFormEvent {
  name: 'submitForm' | 'cancelForm';
  formData: Record<string, unknown>;
}

export interface AffiliateFeedFormResult {
  name: 'saved' | 'cancelled';
  feed?: AffiliateFeed;
}

const normalizedString = (value: unknown): string => String(value ?? '').trim();

export function buildAffiliateFeedCreateInput(formData: Record<string, unknown>): AffiliateFeedCreateInput {
  const adapterType = normalizedString(formData['adapterType']);
  return {
    networkFeedId: normalizedString(formData['networkFeedId']),
    affiliateProgramId: normalizedString(formData['affiliateProgramId']),
    name: normalizedString(formData['name']),
    enabled: formData['enabled'] === true,
    adapterType: adapterType || null,
    readMode: formData['readMode'] as AffiliateFeedReadMode,
    locale: normalizedString(formData['locale']),
    market: normalizedString(formData['market']).toUpperCase(),
  };
}

export function buildAffiliateFeedUpdateInput(formData: Record<string, unknown>): AffiliateFeedUpdateInput {
  const adapterType = normalizedString(formData['adapterType']);
  return {
    name: normalizedString(formData['name']),
    enabled: formData['enabled'] === true,
    adapterType: adapterType || null,
    readMode: formData['readMode'] as AffiliateFeedReadMode,
    locale: normalizedString(formData['locale']),
    market: normalizedString(formData['market']).toUpperCase(),
  };
}

export function affiliateFeedErrorMessage(status: number): string {
  if (status === 400) return 'Controlla i dati inseriti nel feed.';
  if (status === 401 || status === 403) return 'Non sei autorizzato a modificare i feed affiliati.';
  if (status === 404) return 'Il feed affiliato o il programma collegato non è più disponibile.';
  if (status === 409) return 'Esiste già un feed affiliato con questi identificativi.';
  if (status === 0) return 'Il backend non è raggiungibile. Riprova tra poco.';
  return 'Operazione sul feed affiliato non riuscita.';
}

@Component({
  selector: 'app-affiliate-feed-form-host',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  providers: [
    {
      provide: FORM_DEFINITION_REPOSITORY,
      useClass: AffiliateFeedFormDefinitionRepository,
    },
  ],
  templateUrl: './affiliate-feed-form-host.component.html',
  styleUrl: './affiliate-feed-form-host.component.scss',
})
export class AffiliateFeedFormHostComponent {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  itemData: AffiliateFeedFormContext = { mode: 'create' };
  @Output() result = new EventEmitter<AffiliateFeedFormResult>();

  saving = false;
  error = '';

  readonly createDefaults: Partial<AffiliateFeedCreateInput> = {
    enabled: true,
    readMode: 'WHOLE_FEED',
    market: 'IT',
  };

  get formId(): string {
    return this.itemData.mode === 'edit'
      ? AFFILIATE_FEED_EDIT_FORM
      : AFFILIATE_FEED_CREATE_FORM;
  }

  handleForm(event: AffiliateFeedFormEvent): void {
    if (event.name === 'cancelForm') {
      if (!this.saving) this.result.emit({ name: 'cancelled' });
      return;
    }

    if (event.name !== 'submitForm' || this.saving) return;
    if (this.itemData.mode === 'edit') {
      this.updateFeed(event.formData);
      return;
    }
    this.createFeed(event.formData);
  }

  private createFeed(formData: Record<string, unknown>): void {
    this.saving = true;
    this.error = '';
    this.affiliateCatalogService
      .createFeed(buildAffiliateFeedCreateInput(formData))
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (feed) => this.result.emit({ name: 'saved', feed }),
        error: (error: HttpErrorResponse) => this.error = affiliateFeedErrorMessage(error.status),
      });
  }

  private updateFeed(formData: Record<string, unknown>): void {
    const feed = this.itemData.feed;
    if (!feed?.id) {
      this.error = 'Feed affiliato non valido.';
      return;
    }

    this.saving = true;
    this.error = '';
    this.affiliateCatalogService
      .updateFeed(feed.id, buildAffiliateFeedUpdateInput(formData))
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (updated) => this.result.emit({ name: 'saved', feed: updated }),
        error: (error: HttpErrorResponse) => this.error = affiliateFeedErrorMessage(error.status),
      });
  }
}
