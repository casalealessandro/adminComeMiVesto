import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, finalize, forkJoin } from 'rxjs';
import {
  ColData,
  Colonne,
  DataGridComponent,
  GridDataProvider,
  GridLoadRequest,
  GridPage,
} from '../../../../core/public-api';
import {
  AffiliateProductCursorRequest,
  CatalogTaxonomyRepairResult,
} from '../../models/affiliate-catalog-api.models';
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
  allowFiltering: false,
  dataField,
  colWidth,
  colCaption,
  edit: false,
  groupDataField: undefined,
});

const listOptions = (
  options: any[],
  valueExp: string,
  displayExp: string,
): NonNullable<ColData['lista']> => ({
  options,
  valueExp,
  displayExp,
  multiple: false,
  remote: false,
  parent: null,
});

export interface AffiliateProductGridRow extends CatalogProduct {
  programName: string;
  activeLabel: string;
  categoryLabel: string;
  genderLabel: string;
  sourceFeedCount: number;
}

export interface AffiliateProductsProviderCallbacks {
  onLoadStart?: (append: boolean) => void;
  onPage?: (products: CatalogProduct[], append: boolean, hasMore: boolean) => void;
  onLoadError?: (append: boolean) => void;
  onLoadEnd?: (append: boolean) => void;
}

export function buildAffiliateProductColumns(
  programs: AffiliateProgram[] = [],
  categories: string[] = [],
): Colonne[] {
  const programOptions = [...programs]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((program) => ({ id: program.id, name: program.name }));
  const categoryOptions = [...new Set(categories.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => ({ value: category, label: category }));

  const columns: ColData[] = [
    baseColumn('brand', 'Brand', 130),
    baseColumn('name', 'Prodotto', 230),
    {
      ...baseColumn('affiliateProgramId', 'Programma', 180, 'campoLista'),
      allowFiltering: true,
      lista: listOptions(programOptions, 'id', 'name'),
    },
    {
      ...baseColumn('category', 'Categoria', 150, 'campoLista'),
      allowFiltering: true,
      lista: listOptions(categoryOptions, 'value', 'label'),
    },
    baseColumn('subcategory', 'Sottocategoria', 150),
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

export function buildAffiliateProductRemoteRequest(request: GridLoadRequest): AffiliateProductCursorRequest {
  const exactFilter = (field: string): string | undefined => {
    const filter = request.filters?.find((item) => item.field === field && item.operator === 'eq');
    if (typeof filter?.value !== 'string') return undefined;
    const value = filter.value.trim();
    return value || undefined;
  };

  const cursor = typeof request.continuation === 'string' && request.continuation
    ? request.continuation
    : undefined;
  const q = request.search?.value?.trim() || undefined;
  const category = exactFilter('category');
  const affiliateProgramId = exactFilter('affiliateProgramId');

  return {
    limit: request.pageSize,
    ...(cursor ? { cursor } : {}),
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
    ...(affiliateProgramId ? { affiliateProgramId } : {}),
  };
}

export function createAffiliateProductsProvider(
  service: AffiliateCatalogService,
  programNames: ReadonlyMap<string, string>,
  callbacks: AffiliateProductsProviderCallbacks = {},
): GridDataProvider<AffiliateProductGridRow> {
  return {
    async load(request: GridLoadRequest): Promise<GridPage<AffiliateProductGridRow>> {
      if (request.sort?.length) {
        throw new Error('Remote sorting is not supported by the affiliate products API');
      }

      const append = typeof request.continuation === 'string' && request.continuation.length > 0;
      callbacks.onLoadStart?.(append);

      try {
        const page = await firstValueFrom(service.getProducts(buildAffiliateProductRemoteRequest(request)));
        callbacks.onPage?.(page.data, append, page.pagination.hasMore);
        return {
          items: buildAffiliateProductGridRows(page.data, programNames),
          hasMore: page.pagination.hasMore,
          continuation: page.pagination.nextCursor ?? undefined,
        };
      } catch (error) {
        callbacks.onLoadError?.(append);
        throw error;
      } finally {
        callbacks.onLoadEnd?.(append);
      }
    },
  };
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
  private dataGrid?: DataGridComponent<AffiliateProductGridRow>;

  products: CatalogProduct[] = [];
  gridRows: AffiliateProductGridRow[] = [];
  columns: Colonne[] = [];
  dataProvider?: GridDataProvider<AffiliateProductGridRow>;
  loading = false;
  productsLoading = false;
  loadingMore = false;
  taxonomyLoading = false;
  taxonomyApplying = false;
  taxonomyRepair: CatalogTaxonomyRepairResult | null = null;
  taxonomyError = '';
  error = '';
  loadMoreError = '';
  hasMore = false;

  private programNames = new Map<string, string>();

  @ViewChild(DataGridComponent)
  set productGrid(grid: DataGridComponent<AffiliateProductGridRow> | undefined) {
    this.dataGrid = grid;
    if (!grid || !this.dataProvider) return;

    grid.pageSize = AFFILIATE_PRODUCTS_PAGE_SIZE;
    queueMicrotask(() => void grid.renderGrid());
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (this.loading || this.loadingMore) return;

    this.loading = true;
    this.productsLoading = true;
    this.error = '';
    this.loadMoreError = '';
    this.products = [];
    this.gridRows = [];
    this.hasMore = false;
    this.columns = [];
    this.dataProvider = undefined;

    forkJoin({
      programs: this.affiliateCatalogService.getPrograms(),
      audit: this.affiliateCatalogService.getCatalogAudit(),
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ programs, audit }) => {
          this.programNames = new Map(programs.map((program) => [program.id, program.name]));
          const categories = audit.catalog.categories.map((item) => item.category).filter(Boolean);
          this.columns = buildAffiliateProductColumns(programs, categories);
          this.dataProvider = createAffiliateProductsProvider(
            this.affiliateCatalogService,
            this.programNames,
            {
              onLoadStart: (append) => this.onProviderLoadStart(append),
              onPage: (products, append, hasMore) => this.applyProviderPage(products, append, hasMore),
              onLoadError: (append) => this.onProviderLoadError(append),
              onLoadEnd: (append) => this.onProviderLoadEnd(append),
            },
          );
        },
        error: () => {
          this.productsLoading = false;
          this.error = 'Impossibile inizializzare i filtri del catalogo affiliato.';
        },
      });
  }

  analyzeMissingTaxonomies(): void {
    if (this.taxonomyLoading || this.taxonomyApplying) return;
    this.taxonomyLoading = true;
    this.taxonomyError = '';
    this.affiliateCatalogService
      .repairProductTaxonomies(false)
      .pipe(finalize(() => this.taxonomyLoading = false))
      .subscribe({
        next: (result) => this.taxonomyRepair = result,
        error: () => this.taxonomyError = 'Impossibile analizzare le tassonomie mancanti.',
      });
  }

  applyTaxonomySuggestions(): void {
    if (!this.taxonomyRepair?.suggested || this.taxonomyLoading || this.taxonomyApplying) return;
    this.taxonomyApplying = true;
    this.taxonomyError = '';
    this.affiliateCatalogService
      .repairProductTaxonomies(true)
      .pipe(finalize(() => this.taxonomyApplying = false))
      .subscribe({
        next: (result) => {
          this.taxonomyRepair = result;
          if (result.updated > 0) this.refresh();
        },
        error: () => this.taxonomyError = 'Impossibile applicare le tassonomie proposte.',
      });
  }

  closeTaxonomyRepair(): void {
    if (this.taxonomyLoading || this.taxonomyApplying) return;
    this.taxonomyRepair = null;
    this.taxonomyError = '';
  }

  async loadMore(): Promise<void> {
    if (!this.dataGrid || this.loading || this.loadingMore || !this.hasMore) return;
    await this.dataGrid.loadNextRemotePage();
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

  private onProviderLoadStart(append: boolean): void {
    if (append) {
      this.loadingMore = true;
      this.loadMoreError = '';
      return;
    }

    this.productsLoading = true;
    this.error = '';
  }

  private onProviderLoadError(append: boolean): void {
    if (append) {
      this.loadMoreError = 'Impossibile caricare altri prodotti. Riprova.';
      return;
    }

    this.error = 'Impossibile caricare i prodotti del catalogo affiliato.';
  }

  private onProviderLoadEnd(append: boolean): void {
    if (append) {
      this.loadingMore = false;
      return;
    }

    this.productsLoading = false;
  }

  private applyProviderPage(items: CatalogProduct[], append: boolean, hasMore: boolean): void {
    const combined = append ? [...this.products, ...items] : [...items];
    this.products = Array.from(new Map(combined.map((product) => [product.id, product])).values());
    this.hasMore = hasMore;
    this.gridRows = buildAffiliateProductGridRows(this.products, this.programNames);
  }
}
