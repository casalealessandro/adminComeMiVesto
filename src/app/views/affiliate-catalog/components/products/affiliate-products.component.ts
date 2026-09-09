import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ColData, Colonne, DataGridComponent } from '../../../../core/public-api';
import { AffiliateProgram, CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

export const AFFILIATE_PRODUCTS_PAGE_SIZE = 50;

const baseColumn = (
  dataField: string,
  colCaption: string,
  colWidth: number | string,
  type: ColData['type'] = 'campo',
): ColData => ({
  type,
  colVisible: true,
  allowEditing: false,
  dataField,
  colWidth,
  colCaption,
  edit: false,
  groupDataField: undefined,
});

export interface AffiliateProductGridRow extends CatalogProduct {
  programName: string;
  activeLabel: string;
  categoryLabel: string;
  genderLabel: string;
  sourceFeedCount: number;
}

export function buildAffiliateProductColumns(): Colonne[] {
  const columns: ColData[] = [
    baseColumn('brand', 'Brand', 130),
    baseColumn('name', 'Prodotto', 230),
    baseColumn('programName', 'Programma', 180),
    baseColumn('categoryLabel', 'Categoria', 170),
    baseColumn('normalizedColor', 'Colore', 110),
    baseColumn('genderLabel', 'Target', 150),
    baseColumn('sourceFeedCount', 'Feed', 70, 'campoNumber'),
    baseColumn('activeLabel', 'Attivo', 80),
    baseColumn('lastSeenAt', 'Ultima rilevazione', 145, 'campoDateTime'),
    {
      ...baseColumn('', 'Dettaglio', 76, 'campoButton'),
      button: {
        text: '',
        name: 'detail',
        event: 'detail',
        icon: 'mdi mdi-eye-outline',
        hint: 'Apri dettaglio prodotto',
      },
    },
  ];

  return [{ itemType: 'group', groupDataField: '', data: columns }];
}

export function buildAffiliateProductGridRows(
  products: CatalogProduct[],
  programNames: ReadonlyMap<string, string>,
): AffiliateProductGridRow[] {
  return products.map((product) => ({
    ...product,
    programName: programNames.get(product.affiliateProgramId) || product.affiliateProgramId,
    activeLabel: product.active ? 'Sì' : 'No',
    categoryLabel: [product.category, product.subcategory].filter(Boolean).join(' / ') || '—',
    genderLabel: product.genderTargets?.filter(Boolean).join(', ') || '—',
    sourceFeedCount: product.sourceFeedIds?.length ?? 0,
  }));
}

@Component({
  selector: 'app-affiliate-products',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './affiliate-products.component.html',
  styleUrl: './affiliate-products.component.scss',
})
export class AffiliateProductsComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);
  private readonly router = inject(Router);

  products: CatalogProduct[] = [];
  gridRows: AffiliateProductGridRow[] = [];
  readonly columns = buildAffiliateProductColumns();
  loading = false;
  loadingMore = false;
  error = '';
  loadMoreError = '';
  hasMore = false;
  nextCursor: string | null = null;

  private programNames = new Map<string, string>();

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (this.loading || this.loadingMore) return;

    this.loading = true;
    this.error = '';
    this.loadMoreError = '';

    forkJoin({
      page: this.affiliateCatalogService.getProducts({ limit: AFFILIATE_PRODUCTS_PAGE_SIZE }),
      programs: this.affiliateCatalogService.getPrograms().pipe(
        catchError(() => of([] as AffiliateProgram[])),
      ),
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ page, programs }) => {
          this.programNames = new Map(programs.map((program) => [program.id, program.name]));
          this.applyPage(page.data, page.pagination.nextCursor, page.pagination.hasMore, false);
        },
        error: () => {
          this.products = [];
          this.gridRows = [];
          this.hasMore = false;
          this.nextCursor = null;
          this.error = 'Impossibile caricare i prodotti del catalogo affiliato.';
        },
      });
  }

  loadMore(): void {
    if (this.loading || this.loadingMore || !this.hasMore || !this.nextCursor) return;

    this.loadingMore = true;
    this.loadMoreError = '';
    const cursor = this.nextCursor;

    this.affiliateCatalogService.getProducts({
      limit: AFFILIATE_PRODUCTS_PAGE_SIZE,
      cursor,
    })
      .pipe(finalize(() => this.loadingMore = false))
      .subscribe({
        next: (page) => {
          this.applyPage(page.data, page.pagination.nextCursor, page.pagination.hasMore, true);
        },
        error: () => {
          this.loadMoreError = 'Impossibile caricare altri prodotti. Riprova.';
        },
      });
  }

  programName(product: CatalogProduct): string {
    return this.programNames.get(product.affiliateProgramId) || product.affiliateProgramId;
  }

  productImage(product: CatalogProduct): string | null {
    return product.images?.find((image) => typeof image === 'string' && image.trim().length > 0) || null;
  }

  categoryLabel(product: CatalogProduct): string {
    return [product.category, product.subcategory].filter(Boolean).join(' / ') || '—';
  }

  genderLabel(product: CatalogProduct): string {
    return product.genderTargets?.filter(Boolean).join(', ') || '—';
  }

  materialsLabel(product: CatalogProduct): string {
    return product.materials?.filter(Boolean).join(', ') || '—';
  }

  openDetail(product: CatalogProduct): void {
    if (!product?.id) return;
    void this.router.navigate(['/affiliate-catalog/products', product.id]);
  }

  gridAction(event: { name?: string; rowData?: AffiliateProductGridRow }): void {
    if (event?.name === 'detail' && event.rowData) this.openDetail(event.rowData);
  }

  private applyPage(
    items: CatalogProduct[],
    nextCursor: string | null,
    hasMore: boolean,
    append: boolean,
  ): void {
    const combined = append ? [...this.products, ...items] : [...items];
    this.products = Array.from(new Map(combined.map((product) => [product.id, product])).values());
    this.nextCursor = nextCursor;
    this.hasMore = hasMore;
    this.gridRows = buildAffiliateProductGridRows(this.products, this.programNames);
  }
}
