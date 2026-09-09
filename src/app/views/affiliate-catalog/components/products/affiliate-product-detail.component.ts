import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { AffiliateFeed, AffiliateProgram, CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

export function affiliateProductDetailErrorMessage(status?: number): string {
  if (status === 401 || status === 403) return 'Non sei autorizzato a consultare questo prodotto.';
  if (status === 404) return 'Il prodotto richiesto non è più disponibile.';
  if (status === 0) return 'Backend non raggiungibile. Riprova quando la connessione è disponibile.';
  return 'Impossibile caricare il dettaglio del prodotto affiliato.';
}

@Component({
  selector: 'app-affiliate-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './affiliate-product-detail.component.html',
  styleUrl: '../affiliate-detail-layout.scss',
})
export class AffiliateProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  productId = '';
  product: CatalogProduct | null = null;
  program: AffiliateProgram | null = null;
  loading = false;
  error = '';
  images: string[] = [];

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
}
