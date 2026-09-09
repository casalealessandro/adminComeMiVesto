import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { finalize } from 'rxjs';
import { DynamicFormComponent } from '../../../core/forms/dynamic-form/dynamic-form.component';
import { FORM_DEFINITION_REPOSITORY } from '../../../core/forms/contracts/form-definition-repository';
import {
  AffiliateProgramCreateInput,
  AffiliateProgramUpdateInput,
} from '../models/affiliate-catalog-api.models';
import {
  AffiliateNetwork,
  AffiliateNetworkProgramStatus,
  AffiliateProgram,
  PriceSegment,
} from '../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../services/affiliate-catalog.service';
import {
  AFFILIATE_PROGRAM_CREATE_FORM,
  AFFILIATE_PROGRAM_EDIT_FORM,
  AffiliateProgramFormDefinitionRepository,
} from './affiliate-program-form-definition.repository';

export type AffiliateProgramFormMode = 'create' | 'edit';

export interface AffiliateProgramFormContext {
  mode: AffiliateProgramFormMode;
  program?: AffiliateProgram;
}

export interface AffiliateProgramFormEvent {
  name: 'submitForm' | 'cancelForm';
  formData: Record<string, unknown>;
}

export interface AffiliateProgramFormResult {
  name: 'saved' | 'cancelled';
  program?: AffiliateProgram;
}

const normalizedString = (value: unknown): string => String(value ?? '').trim();

export function buildAffiliateProgramCreateInput(formData: Record<string, unknown>): AffiliateProgramCreateInput {
  return {
    network: formData['network'] as AffiliateNetwork,
    networkProgramId: normalizedString(formData['networkProgramId']),
    name: normalizedString(formData['name']),
    networkStatus: formData['networkStatus'] as AffiliateNetworkProgramStatus,
    enabled: formData['enabled'] === true,
    defaultAdapterType: normalizedString(formData['defaultAdapterType']),
    market: normalizedString(formData['market']).toUpperCase(),
    currency: normalizedString(formData['currency']).toUpperCase(),
    priceSegment: formData['priceSegment'] as PriceSegment,
  };
}

export function buildAffiliateProgramUpdateInput(formData: Record<string, unknown>): AffiliateProgramUpdateInput {
  return {
    name: normalizedString(formData['name']),
    networkStatus: formData['networkStatus'] as AffiliateNetworkProgramStatus,
    enabled: formData['enabled'] === true,
    defaultAdapterType: normalizedString(formData['defaultAdapterType']),
    market: normalizedString(formData['market']).toUpperCase(),
    currency: normalizedString(formData['currency']).toUpperCase(),
    priceSegment: formData['priceSegment'] as PriceSegment,
  };
}

export function affiliateProgramErrorMessage(status: number): string {
  if (status === 400) return 'Controlla i dati inseriti nel programma.';
  if (status === 401 || status === 403) return 'Non sei autorizzato a modificare i programmi affiliati.';
  if (status === 404) return 'Il programma affiliato non è più disponibile.';
  if (status === 409) return 'Esiste già un programma affiliato con questi identificativi.';
  if (status === 0) return 'Il backend non è raggiungibile. Riprova tra poco.';
  return 'Operazione sul programma affiliato non riuscita.';
}

@Component({
  selector: 'app-affiliate-program-form-host',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  providers: [
    {
      provide: FORM_DEFINITION_REPOSITORY,
      useClass: AffiliateProgramFormDefinitionRepository,
    },
  ],
  templateUrl: './affiliate-program-form-host.component.html',
  styleUrl: './affiliate-program-form-host.component.scss',
})
export class AffiliateProgramFormHostComponent {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  itemData: AffiliateProgramFormContext = { mode: 'create' };
  @Output() result = new EventEmitter<AffiliateProgramFormResult>();

  saving = false;
  error = '';

  readonly createDefaults: Partial<AffiliateProgramCreateInput> = {
    network: 'TRADEDOUBLER',
    networkStatus: 'ACTIVE',
    enabled: true,
    defaultAdapterType: 'TRADEDOUBLER',
    market: 'IT',
    currency: 'EUR',
    priceSegment: 'MID_RANGE',
  };

  get formId(): string {
    return this.itemData.mode === 'edit'
      ? AFFILIATE_PROGRAM_EDIT_FORM
      : AFFILIATE_PROGRAM_CREATE_FORM;
  }

  handleForm(event: AffiliateProgramFormEvent): void {
    if (event.name === 'cancelForm') {
      if (!this.saving) this.result.emit({ name: 'cancelled' });
      return;
    }

    if (event.name !== 'submitForm' || this.saving) return;
    if (this.itemData.mode === 'edit') {
      this.updateProgram(event.formData);
      return;
    }
    this.createProgram(event.formData);
  }

  private createProgram(formData: Record<string, unknown>): void {
    this.saving = true;
    this.error = '';
    this.affiliateCatalogService
      .createProgram(buildAffiliateProgramCreateInput(formData))
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (program) => this.result.emit({ name: 'saved', program }),
        error: (error: HttpErrorResponse) => this.error = affiliateProgramErrorMessage(error.status),
      });
  }

  private updateProgram(formData: Record<string, unknown>): void {
    const program = this.itemData.program;
    if (!program?.id) {
      this.error = 'Programma affiliato non valido.';
      return;
    }

    this.saving = true;
    this.error = '';
    this.affiliateCatalogService
      .updateProgram(program.id, buildAffiliateProgramUpdateInput(formData))
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (updated) => this.result.emit({ name: 'saved', program: updated }),
        error: (error: HttpErrorResponse) => this.error = affiliateProgramErrorMessage(error.status),
      });
  }
}
