import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { DynamicFormField } from '../../../../interface/dynamic-form-field';
import { FormService } from '../../../../services/form.service';
import { outfitCategories, OutfitsService } from '../../../../services/outfit.service';
import { OutfitColor, TaxonomyService } from '../../../../services/taxonomy.service';
import { alert } from '../../../../widgets/ui-dialogs';
import { AffiliateProductUpdateInput } from '../../models/affiliate-catalog-api.models';
import { AffiliateFeed, AffiliateProgram, CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

export function affiliateProductDetailErrorMessage(status?: number): string {
  if (status === 401 || status === 403) return 'Non sei autorizzato a consultare questo prodotto.';
  if (status === 404) return 'Il prodotto richiesto non è più disponibile.';
  if (status === 0) return 'Backend non raggiungibile. Riprova quando la connessione è disponibile.';
  return 'Impossibile caricare il dettaglio del prodotto affiliato.';
}

export type CatalogGenderTarget = 'U' | 'D';

export function normalizeCatalogGenderTarget(value: unknown): CatalogGenderTarget | null {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (['u', 'm', 'male', 'man', 'men', 'uomo'].includes(normalized)) return 'U';
  if (['d', 'f', 'female', 'woman', 'women', 'donna'].includes(normalized)) return 'D';

  return null;
}

export function normalizeCatalogGenderTargets(values: readonly unknown[] | null | undefined): CatalogGenderTarget[] {
  const normalized = (values ?? [])
    .map((value) => normalizeCatalogGenderTarget(value))
    .filter((value): value is CatalogGenderTarget => value !== null);

  return [...new Set(normalized)];
}

interface ProductCurationForm {
  enabledForApp: boolean;
  category: string;
  subcategory: string;
  genderTargets: string[];
  normalizedColor: string;
}

@Component({
  selector: 'app-affiliate-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './affiliate-product-detail.component.html',
  styleUrl: '../affiliate-detail-layout.scss',
})
export class AffiliateProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);
  private readonly outfitService = inject(OutfitsService);
  private readonly taxonomyService = inject(TaxonomyService);
  private readonly formService = inject(FormService);

  productId = '';
  product: CatalogProduct | null = null;
  program: AffiliateProgram | null = null;
  loading = false;
  error = '';
  images: string[] = [];

  categories: outfitCategories[] = [];
  subcategories: outfitCategories[] = [];
  colors: OutfitColor[] = [];
  genderOptions: Array<{ id: string; value: string }> = [];
  curation: ProductCurationForm = this.emptyCuration();
  curationSaving = false;
  curationError = '';

  private feedNames = new Map<string, string>();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')?.trim() ?? '';
    if (!id) {
      this.error = 'Identificativo prodotto non valido.';
      return;
    }
    this.productId = id;
    this.load();
  }

  load(): void {
    if (!this.productId || this.loading) return;

    this.loading = true;
    this.error = '';
    this.curationError = '';

    this.affiliateCatalogService.getProduct(this.productId)
      .pipe(
        switchMap((product) => forkJoin({
          product: of(product),
          program: this.affiliateCatalogService.getProgram(product.affiliateProgramId).pipe(
            catchError(() => of(null as AffiliateProgram | null)),
          ),
          feeds: this.affiliateCatalogService.getFeeds(product.affiliateProgramId).pipe(
            catchError(() => of([] as AffiliateFeed[])),
          ),
          categories: this.outfitService.getOutFitCategories().pipe(
            catchError(() => of([] as outfitCategories[])),
          ),
          colors: this.taxonomyService.getColors().pipe(
            catchError(() => of([] as OutfitColor[])),
          ),
          formFields: this.formService.getFormFields('outfitForm').pipe(
            catchError(() => of([] as DynamicFormField[])),
          ),
        })),
        finalize(() => this.loading = false),
      )
      .subscribe({
        next: ({ product, program, feeds, categories, colors, formFields }) => {
          this.product = product;
          this.program = program;
          this.images = (product.images ?? []).filter((image) => typeof image === 'string' && image.trim().length > 0);
          this.feedNames = new Map(feeds.map((feed) => [feed.id, feed.name]));
          this.categories = categories;
          this.colors = colors;
          this.curation = this.curationFromProduct(product);
          this.loadSubcategories(product.category);
          void this.loadGenderOptions(formFields);
        },
        error: (error: { status?: number }) => {
          this.product = null;
          this.program = null;
          this.images = [];
          this.feedNames.clear();
          this.error = affiliateProductDetailErrorMessage(error?.status);
        },
      });
  }

  programName(): string {
    if (!this.product) return '—';
    return this.program?.name || this.product.affiliateProgramId;
  }

  categoryLabel(): string {
    if (!this.product) return '—';
    return [this.product.category, this.product.subcategory].filter(Boolean).join(' / ') || '—';
  }

  genderLabel(): string {
    return this.product?.genderTargets?.filter(Boolean).join(', ') || '—';
  }

  materialsLabel(): string {
    return this.product?.materials?.filter(Boolean).join(', ') || '—';
  }

  sourceFeedName(feedId: string): string {
    return this.feedNames.get(feedId) || feedId;
  }

  mappingComplete(): boolean {
    return Boolean(this.curation.category && this.curation.subcategory);
  }

  onCategoryChange(): void {
    this.curation.subcategory = '';
    this.loadSubcategories(this.curation.category);
  }

  toggleGender(id: string, event: Event): void {
    const target = normalizeCatalogGenderTarget(id);
    if (!target) return;

    const checked = (event.target as HTMLInputElement).checked;
    this.curation.genderTargets = checked
      ? [...new Set([...this.curation.genderTargets, target])]
      : this.curation.genderTargets.filter((value) => value !== target);
  }

  saveCuration(): void {
    if (!this.product || this.curationSaving) return;
    if (this.curation.enabledForApp && !this.mappingComplete()) {
      this.curationError = 'Per abilitare il prodotto nell’app devi associare categoria e sottocategoria ComeMiVesto.';
      return;
    }

    const input: AffiliateProductUpdateInput = {};
    if (this.curation.enabledForApp !== (this.product.enabledForApp !== false)) {
      input.enabledForApp = this.curation.enabledForApp;
    }
    if (this.curation.category !== this.product.category) input.category = this.curation.category;
    if (this.curation.subcategory !== this.product.subcategory) input.subcategory = this.curation.subcategory;
    if (!this.sameValues(this.curation.genderTargets, this.product.genderTargets ?? [])) {
      input.genderTargets = [...this.curation.genderTargets];
    }
    if (this.curation.normalizedColor !== (this.product.normalizedColor ?? '')) {
      input.normalizedColor = this.curation.normalizedColor;
    }

    if (!Object.keys(input).length) {
      this.curationError = '';
      return;
    }

    this.curationSaving = true;
    this.curationError = '';
    this.affiliateCatalogService.updateProduct(this.product.id, input)
      .pipe(finalize(() => this.curationSaving = false))
      .subscribe({
        next: (product) => {
          this.product = product;
          this.curation = this.curationFromProduct(product);
          this.loadSubcategories(product.category);
          alert('Prodotto aggiornato per ComeMiVesto.', 'Operazione completata');
        },
        error: (error: { status?: number }) => {
          if (error?.status === 409) {
            this.curationError = 'Categoria, sottocategoria o colore non sono validi per la tassonomia ComeMiVesto.';
            return;
          }
          if (error?.status === 401 || error?.status === 403) {
            this.curationError = 'Non sei autorizzato a modificare questo prodotto.';
            return;
          }
          this.curationError = 'Aggiornamento prodotto non riuscito.';
        },
      });
  }

  private loadSubcategories(categoryId: string): void {
    this.subcategories = [];
    if (!categoryId) return;

    this.outfitService.getOutFitCategories(categoryId).subscribe({
      next: (categories) => this.subcategories = categories,
      error: () => this.curationError = 'Impossibile caricare le sottocategorie ComeMiVesto.',
    });
  }

  private async loadGenderOptions(fields: DynamicFormField[]): Promise<void> {
    const select = fields.find((field) => field.name === 'gender')?.selectOptions;
    if (!select) {
      this.genderOptions = [];
      return;
    }

    try {
      const values = select.remote && select.api
        ? await this.formService.getData(select.api)
        : (select.options || []);
      const options = (Array.isArray(values) ? values : values?.data || []).flatMap((item: any) => {
        const rawId = item[select.valueExp || 'id'];
        const label = String(item[select.displayExp || 'value'] ?? rawId ?? '');
        const id = normalizeCatalogGenderTarget(rawId) ?? normalizeCatalogGenderTarget(label);

        return id ? [{ id, value: label }] : [];
      });

      this.genderOptions = [...new Map(options.map((option) => [option.id, option])).values()];
    } catch {
      this.genderOptions = [];
      this.curationError = 'Impossibile caricare la tassonomia gender.';
    }
  }

  private curationFromProduct(product: CatalogProduct): ProductCurationForm {
    return {
      enabledForApp: product.enabledForApp !== false,
      category: product.category ?? '',
      subcategory: product.subcategory ?? '',
      genderTargets: normalizeCatalogGenderTargets(product.genderTargets),
      normalizedColor: product.normalizedColor ?? '',
    };
  }

  private emptyCuration(): ProductCurationForm {
    return {
      enabledForApp: true,
      category: '',
      subcategory: '',
      genderTargets: [],
      normalizedColor: '',
    };
  }

  private sameValues(left: string[], right: string[]): boolean {
    return [...left].sort().join('|') === [...right].sort().join('|');
  }
}
