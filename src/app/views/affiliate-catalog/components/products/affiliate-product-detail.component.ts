import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { DynamicFormComponent } from '../../../../core/forms/dynamic-form/dynamic-form.component';
import { alert } from '../../../../widgets/ui-dialogs';
import { AffiliateProductUpdateInput } from '../../models/affiliate-catalog-api.models';
import { AffiliateFeed, AffiliateProgram, CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

export const AFFILIATE_PRODUCT_CURATION_FORM = 'affiliateProductCurationForm';

export function affiliateProductDetailErrorMessage(status?: number): string {
  if (status === 401 || status === 403) return 'Non sei autorizzato a consultare questo prodotto.';
  if (status === 404) return 'Il prodotto richiesto non è più disponibile.';
  if (status === 0) return 'Backend non raggiungibile. Riprova quando la connessione è disponibile.';
  return 'Impossibile caricare il dettaglio del prodotto affiliato.';
}

export type CatalogGenderTarget = 'U' | 'D';

export interface AffiliateProductCurationFormData {
  category: string;
  subcategory: string;
  normalizedColor: string;
  genderTargets: CatalogGenderTarget[];
}

export interface AffiliateProductCurationFormEvent {
  name: 'submitForm' | 'cancelForm';
  formData: Record<string, unknown>;
}

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

export function buildAffiliateProductCurationFormData(product: CatalogProduct): AffiliateProductCurationFormData {
  return {
    category: product.category ?? '',
    subcategory: product.subcategory ?? '',
    normalizedColor: product.normalizedColor ?? '',
    genderTargets: normalizeCatalogGenderTargets(product.genderTargets),
  };
}

export function buildAffiliateProductCurationUpdate(
  product: CatalogProduct,
  enabledForApp: boolean,
  formData: Record<string, unknown>,
): AffiliateProductUpdateInput {
  const category = String(formData['category'] ?? '').trim();
  const subcategory = String(formData['subcategory'] ?? '').trim();
  const normalizedColor = String(formData['normalizedColor'] ?? '').trim();
  const rawGenderTargets = Array.isArray(formData['genderTargets']) ? formData['genderTargets'] : [];
  const genderTargets = normalizeCatalogGenderTargets(rawGenderTargets);
  const currentGenderTargets = normalizeCatalogGenderTargets(product.genderTargets);

  const input: AffiliateProductUpdateInput = {};

  if (enabledForApp !== (product.enabledForApp !== false)) input.enabledForApp = enabledForApp;
  if (category !== (product.category ?? '')) input.category = category;
  if (subcategory !== (product.subcategory ?? '')) input.subcategory = subcategory;
  if (normalizedColor !== (product.normalizedColor ?? '')) input.normalizedColor = normalizedColor;
  if (!sameValues(genderTargets, currentGenderTargets)) input.genderTargets = genderTargets;

  return input;
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return [...left].sort().join('|') === [...right].sort().join('|');
}

@Component({
  selector: 'app-affiliate-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DynamicFormComponent],
  templateUrl: './affiliate-product-detail.component.html',
  styleUrl: '../affiliate-detail-layout.scss',
})
export class AffiliateProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  readonly curationFormId = AFFILIATE_PRODUCT_CURATION_FORM;

  productId = '';
  product: CatalogProduct | null = null;
  program: AffiliateProgram | null = null;
  loading = false;
  error = '';
  images: string[] = [];

  enabledForApp = true;
  curationData: AffiliateProductCurationFormData | null = null;
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
    this.curationData = null;

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
        })),
        finalize(() => this.loading = false),
      )
      .subscribe({
        next: ({ product, program, feeds }) => {
          this.product = product;
          this.program = program;
          this.images = (product.images ?? []).filter((image) => typeof image === 'string' && image.trim().length > 0);
          this.feedNames = new Map(feeds.map((feed) => [feed.id, feed.name]));
          this.enabledForApp = product.enabledForApp !== false;
          this.curationData = buildAffiliateProductCurationFormData(product);
        },
        error: (error: { status?: number }) => {
          this.product = null;
          this.program = null;
          this.images = [];
          this.curationData = null;
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

  handleCurationForm(event: AffiliateProductCurationFormEvent): void {
    if (event.name !== 'submitForm' || !this.product || this.curationSaving) return;

    const category = String(event.formData['category'] ?? '').trim();
    const subcategory = String(event.formData['subcategory'] ?? '').trim();
    if (this.enabledForApp && (!category || !subcategory)) {
      this.curationError = 'Per abilitare il prodotto nell’app devi associare categoria e sottocategoria ComeMiVesto.';
      return;
    }

    const input = buildAffiliateProductCurationUpdate(this.product, this.enabledForApp, event.formData);
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
          this.enabledForApp = product.enabledForApp !== false;
          this.curationData = buildAffiliateProductCurationFormData(product);
          alert('Prodotto aggiornato per ComeMiVesto.', 'Operazione completata');
        },
        error: (error: { status?: number }) => {
          if (error?.status === 400) {
            this.curationError = 'I dati della classificazione non rispettano il contratto ComeMiVesto.';
            return;
          }
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
}
