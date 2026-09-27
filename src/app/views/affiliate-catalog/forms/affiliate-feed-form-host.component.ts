import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { FORM_DEFINITION_REPOSITORY } from '../../../core/forms/contracts/form-definition-repository';
import { DynamicFormComponent } from '../../../core/forms/dynamic-form/dynamic-form.component';
import { ComeMiVestoAuditCategory } from '../models/affiliate-catalog-audit.models';
import {
  AffiliateFeedCreateInput,
  AffiliateFeedMappingResponse,
  AffiliateFeedSourceValues,
  AffiliateFeedUpdateInput,
  OutfitColorOption,
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
  startInMapping?: boolean;
}

export interface AffiliateFeedFormEvent {
  name: 'submitForm' | 'cancelForm';
  formData: Record<string, unknown>;
}

export interface AffiliateFeedFormResult {
  name: 'saved' | 'cancelled';
  feed?: AffiliateFeed;
}

export interface AffiliateCategoryMappingOption {
  id: string;
  parentCategory: string;
  label: string;
}

export const SKIP_CATEGORY_MAPPING = '__SKIP__';

const normalizedString = (value: unknown): string => String(value ?? '').trim();
const normalizedCompare = (value: string): string => value.trim().toLocaleLowerCase('it');
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
    rules: normalizedString(formData['rules']),
    rulesMapper: normalizedString(formData['rulesMapper']),
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
    rules: normalizedString(formData['rules']),
    rulesMapper: normalizedString(formData['rulesMapper']),
  };
}

function buildAffiliateFeedUpdateInputFromFeed(feed: AffiliateFeed): AffiliateFeedUpdateInput {
  return {
    name: feed.name,
    enabled: feed.enabled,
    adapterType: feed.adapterType ?? null,
    readMode: feed.readMode,
    locale: feed.locale,
    market: feed.market,
    rules: feed.rules ?? '',
    rulesMapper: feed.rulesMapper ?? '',
  };
}

export function buildRulesMapperJson(
  sourceValues: AffiliateFeedSourceValues,
  categories: readonly AffiliateCategoryMappingOption[],
  categoryMappings: Readonly<Record<string, string>>,
  colorMappings: Readonly<Record<string, string>>,
  genderMappings: Readonly<Record<string, string>>,
): string {
  const categoryValues: Record<string, { category?: string; subcategory?: string; skip?: boolean }> = {};
  for (const source of sourceValues.categories) {
    const target = categoryMappings[source];
    if (target === SKIP_CATEGORY_MAPPING) {
      categoryValues[source] = { skip: true };
      continue;
    }
    const option = categories.find((category) => category.id === target);
    if (option) categoryValues[source] = { category: option.parentCategory, subcategory: option.id };
  }

  const colorValues: Record<string, string> = {};
  for (const source of sourceValues.colors) {
    const target = colorMappings[source]?.trim();
    if (target) colorValues[source] = target;
  }

  const genderValues: Record<string, string[]> = {};
  for (const source of sourceValues.genders) {
    const target = genderMappings[source];
    if (target === 'U') genderValues[source] = ['U'];
    if (target === 'D') genderValues[source] = ['D'];
    if (target === 'U,D') genderValues[source] = ['U', 'D'];
  }

  return JSON.stringify({
    version: 1,
    category: { source: 'category', values: categoryValues },
    color: { source: 'merchantColor', values: colorValues },
    gender: { source: 'gender', values: genderValues },
  }, null, 2);
}

export function affiliateFeedErrorMessage(status: number): string {
  if (status === 400) return 'Controlla i dati inseriti nel feed e la sintassi JSON delle regole.';
  if (status === 401 || status === 403) return 'Non sei autorizzato a modificare i feed affiliati.';
  if (status === 404) return 'Il feed affiliato o il programma collegato non è più disponibile.';
  if (status === 409) return 'Esiste già un feed affiliato con questi identificativi.';
  if (status === 0) return 'Il backend non è raggiungibile. Riprova tra poco.';
  return 'Operazione sul feed affiliato non riuscita.';
}

@Component({
  selector: 'app-affiliate-feed-form-host',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicFormComponent],
  providers: [
    {
      provide: FORM_DEFINITION_REPOSITORY,
      useClass: AffiliateFeedFormDefinitionRepository,
    },
  ],
  templateUrl: './affiliate-feed-form-host.component.html',
  styleUrl: './affiliate-feed-form-host.component.scss',
})
export class AffiliateFeedFormHostComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  itemData: AffiliateFeedFormContext = { mode: 'create' };
  @Output() result = new EventEmitter<AffiliateFeedFormResult>();

  saving = false;
  loadingSourceValues = false;
  loadingMappingOptions = false;
  mappingStep = false;
  error = '';
  warning = '';
  createdFeed: AffiliateFeed | null = null;
  sourceValues: AffiliateFeedSourceValues | null = null;
  categoryOptions: AffiliateCategoryMappingOption[] = [];
  colorOptions: OutfitColorOption[] = [];
  categoryMappings: Record<string, string> = {};
  colorMappings: Record<string, string> = {};
  genderMappings: Record<string, string> = {};

  readonly createDefaults: Partial<AffiliateFeedCreateInput> = {
    enabled: true,
    readMode: 'WHOLE_FEED',
    market: 'IT',
    rules: '',
    rulesMapper: '',
  };

  ngOnInit(): void {
    if (this.itemData.startInMapping && this.itemData.feed?.id) {
      this.loadExistingMapping(this.itemData.feed);
    }
  }

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

  saveMapping(): void {
    if (!this.createdFeed || !this.sourceValues || this.saving) return;
    const rulesMapper = buildRulesMapperJson(
      this.sourceValues,
      this.categoryOptions,
      this.categoryMappings,
      this.colorMappings,
      this.genderMappings,
    );

    this.saving = true;
    this.error = '';
    this.affiliateCatalogService
      .updateFeed(this.createdFeed.id, { rulesMapper })
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (updated) => this.result.emit({ name: 'saved', feed: updated }),
        error: (error: HttpErrorResponse) => this.error = affiliateFeedErrorMessage(error.status),
      });
  }

  finishWithoutMapping(): void {
    if (this.createdFeed && !this.saving) this.result.emit({ name: 'saved', feed: this.createdFeed });
  }

  private createFeed(formData: Record<string, unknown>): void {
    this.saving = true;
    this.error = '';
    this.warning = '';
    this.affiliateCatalogService
      .createFeed(buildAffiliateFeedCreateInput(formData))
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (response) => this.prepareMappingStep(response),
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
    this.warning = '';
    this.affiliateCatalogService
      .updateFeedWithSourceValues(feed.id, buildAffiliateFeedUpdateInput(formData))
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (response) => this.prepareMappingStep(response),
        error: (error: HttpErrorResponse) => this.error = affiliateFeedErrorMessage(error.status),
      });
  }

  private loadExistingMapping(feed: AffiliateFeed): void {
    this.mappingStep = true;
    this.loadingSourceValues = true;
    this.error = '';
    this.warning = '';
    this.createdFeed = feed;
    this.affiliateCatalogService
      .updateFeedWithSourceValues(feed.id, buildAffiliateFeedUpdateInputFromFeed(feed))
      .pipe(finalize(() => this.loadingSourceValues = false))
      .subscribe({
        next: (response) => this.prepareMappingStep(response),
        error: (error: HttpErrorResponse) => this.error = affiliateFeedErrorMessage(error.status),
      });
  }

  private prepareMappingStep(response: AffiliateFeedMappingResponse): void {
    this.createdFeed = response.data;
    this.sourceValues = response.sourceValues;
    this.warning = response.sourceValuesError ?? '';
    this.mappingStep = true;
    this.categoryMappings = {};
    this.colorMappings = {};
    this.genderMappings = {};
    if (response.sourceValues) this.loadMappingOptions();
  }

  private loadMappingOptions(): void {
    if (!this.sourceValues) return;
    this.loadingMappingOptions = true;
    forkJoin({
      audit: this.affiliateCatalogService.getCatalogAudit(),
      colors: this.affiliateCatalogService.getOutfitColors(),
    }).pipe(finalize(() => this.loadingMappingOptions = false)).subscribe({
      next: ({ audit, colors }) => {
        this.categoryOptions = audit.comeMiVestoCategories
          .filter((category): category is ComeMiVestoAuditCategory & { parentCategory: string } => Boolean(category.parentCategory))
          .map((category) => ({
            id: category.id,
            parentCategory: category.parentCategory,
            label: `${category.parentCategoryName ? `${category.parentCategoryName} / ` : ''}${category.categoryName ?? category.id}`,
          }))
          .sort((left, right) => left.label.localeCompare(right.label, 'it', { sensitivity: 'base' }));
        this.colorOptions = [...colors].sort((left, right) => left.value.localeCompare(right.value, 'it', { sensitivity: 'base' }));
        this.prefillExistingMappings();
        this.prefillExactMappings();
      },
      error: () => this.warning = 'Feed salvato. Non è stato possibile caricare la tassonomia ComeMiVesto per il mapping.',
    });
  }

  private prefillExistingMappings(): void {
    const source = this.createdFeed?.rulesMapper?.trim();
    if (!source) return;

    try {
      const mapper = JSON.parse(source) as unknown;
      if (!isObject(mapper)) return;

      const categorySection = isObject(mapper['category']) ? mapper['category'] : null;
      const categoryValues = categorySection && isObject(categorySection['values']) ? categorySection['values'] : null;
      if (categoryValues) {
        for (const [feedValue, mapping] of Object.entries(categoryValues)) {
          if (!isObject(mapping)) continue;
          if (mapping['skip'] === true) this.categoryMappings[feedValue] = SKIP_CATEGORY_MAPPING;
          else if (typeof mapping['subcategory'] === 'string') this.categoryMappings[feedValue] = mapping['subcategory'];
        }
      }

      const colorSection = isObject(mapper['color']) ? mapper['color'] : null;
      const colorValues = colorSection && isObject(colorSection['values']) ? colorSection['values'] : null;
      if (colorValues) {
        for (const [feedValue, mapping] of Object.entries(colorValues)) {
          if (typeof mapping === 'string' && mapping.trim()) this.colorMappings[feedValue] = mapping.trim();
        }
      }

      const genderSection = isObject(mapper['gender']) ? mapper['gender'] : null;
      const genderValues = genderSection && isObject(genderSection['values']) ? genderSection['values'] : null;
      if (genderValues) {
        for (const [feedValue, mapping] of Object.entries(genderValues)) {
          const values = Array.isArray(mapping)
            ? mapping.filter((value): value is string => typeof value === 'string')
            : typeof mapping === 'string' ? [mapping] : [];
          const hasU = values.includes('U');
          const hasD = values.includes('D');
          if (hasU && hasD) this.genderMappings[feedValue] = 'U,D';
          else if (hasU) this.genderMappings[feedValue] = 'U';
          else if (hasD) this.genderMappings[feedValue] = 'D';
        }
      }
    } catch {
      this.warning = 'Il feed è stato letto, ma il rulesMapper esistente non può essere precompilato nella UI.';
    }
  }

  private prefillExactMappings(): void {
    if (!this.sourceValues) return;

    for (const source of this.sourceValues.categories) {
      if (this.categoryMappings[source]) continue;
      const exact = this.categoryOptions.find((option) => {
        const childName = option.label.split('/').pop()?.trim() ?? option.label;
        return normalizedCompare(childName) === normalizedCompare(source);
      });
      if (exact) this.categoryMappings[source] = exact.id;
    }

    for (const source of this.sourceValues.colors) {
      if (this.colorMappings[source]) continue;
      const exact = this.colorOptions.find((option) => normalizedCompare(option.value) === normalizedCompare(source));
      if (exact) this.colorMappings[source] = exact.id;
    }

    for (const source of this.sourceValues.genders) {
      if (this.genderMappings[source]) continue;
      const normalized = normalizedCompare(source);
      if (['male', 'man', 'men', 'uomo'].includes(normalized)) this.genderMappings[source] = 'U';
      else if (['female', 'woman', 'women', 'donna'].includes(normalized)) this.genderMappings[source] = 'D';
      else if (['unisex', 'all'].includes(normalized)) this.genderMappings[source] = 'U,D';
    }
  }
}
