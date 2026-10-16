import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, finalize, forkJoin, Subscription, timer, exhaustMap } from 'rxjs';
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
  AffiliateUnclassifiedCleanupJob,
} from '../../models/affiliate-catalog-api.models';
import { AuthService } from '../../../../services/auth.service';
import { PopUpService } from '../../../../core/popup/popup.service';
import { alert, confirm } from '../../../../core/dialogs/ui-dialogs';
import { AffiliateProductFormResult } from '../../forms/affiliate-product-form-host.component';
import { AffiliateProgram, CatalogProduct, CatalogSeason, CatalogReclassificationPreview, FashionEnrichmentJob } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

export const AFFILIATE_PRODUCTS_PAGE_SIZE = 50;
export const CATALOG_SEASON_OPTIONS: ReadonlyArray<{ id: CatalogSeason; label: string }> = [
  { id: 'SPRING', label: 'Primavera' },
  { id: 'SUMMER', label: 'Estate' },
  { id: 'AUTUMN', label: 'Autunno' },
  { id: 'WINTER', label: 'Inverno' },
];

export function affiliateProductSeasonsLabel(seasons?: readonly string[]): string {
  if (!seasons?.length) return '—';
  const selected = new Set(seasons);
  const labels = CATALOG_SEASON_OPTIONS.filter((option) => selected.has(option.id)).map((option) => option.label);
  return labels.length ? labels.join(', ') : '—';
}

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
  visibleInAppFilter: 'true' | 'false';
  categoryLabel: string;
  genderLabel: string;
  seasonLabel: string;
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
  canEdit = false,
): Colonne[] {
  const programOptions = [...programs]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((program) => ({ id: program.id, name: program.name }));
  const categoryOptions = [...new Set(categories.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => ({ value: category, label: category }));
  const visibilityOptions = [
    { value: 'true', label: 'Sì' },
    { value: 'false', label: 'No' },
  ];

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
    baseColumn('seasonLabel', 'Stagioni', 190),
    baseColumn('sourceFeedCount', 'Feed', 70, 'campoNumber'),
    baseColumn('activeLabel', 'Attivo catalogo', 110),
    {
      ...baseColumn('visibleInAppFilter', 'Visibile app', 105, 'campoLista'),
      allowFiltering: true,
      lista: listOptions(visibilityOptions, 'value', 'label'),
    },
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

  if (canEdit) {
    columns.push({
      ...baseColumn('', 'Modifica', 76, 'campoButton'),
      button: { text: '', name: 'edit', event: 'edit', icon: 'mdi mdi-pencil-outline', hint: 'Modifica prodotto' },
    });
  }
  if (canEdit) {
    columns.push({
      ...baseColumn('', 'Elimina', 76, 'campoButton'),
      button: { text: '', name: 'delete', event: 'delete',
        icon: 'mdi mdi-delete-outline', hint: 'Elimina prodotto se non utilizzato negli outfit' },
    });
  }
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
    visibleInAppFilter: product.active && product.enabledForApp !== false ? 'true' : 'false',
    categoryLabel: [product.category, product.subcategory].filter(Boolean).join(' / ') || '—',
    genderLabel: product.genderTargets?.filter(Boolean).join(', ') || '—',
    seasonLabel: affiliateProductSeasonsLabel(product.fashionProfile?.seasons),
    sourceFeedCount: product.sourceFeedIds?.length ?? 0,
  }));
}

export function buildAffiliateProductRemoteRequest(request: GridLoadRequest, season?: CatalogSeason): AffiliateProductCursorRequest {
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
  const visibleInAppFilter = exactFilter('visibleInAppFilter');
  const visibleInApp = visibleInAppFilter === 'true'
    ? true
    : visibleInAppFilter === 'false'
      ? false
      : undefined;

  return {
    limit: request.pageSize,
    ...(cursor ? { cursor } : {}),
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
    ...(season ? { season } : {}),
    ...(affiliateProgramId ? { affiliateProgramId } : {}),
    ...(visibleInApp !== undefined ? { visibleInApp } : {}),
  };
}

export function createAffiliateProductsProvider(
  service: AffiliateCatalogService,
  programNames: ReadonlyMap<string, string>,
  callbacks: AffiliateProductsProviderCallbacks = {},
  season?: CatalogSeason,
): GridDataProvider<AffiliateProductGridRow> {
  return {
    async load(request: GridLoadRequest): Promise<GridPage<AffiliateProductGridRow>> {
      if (request.sort?.length) {
        throw new Error('Remote sorting is not supported by the affiliate products API');
      }

      const append = typeof request.continuation === 'string' && request.continuation.length > 0;
      callbacks.onLoadStart?.(append);

      try {
        const page = await firstValueFrom(service.getProducts(buildAffiliateProductRemoteRequest(request, season)));
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
  imports: [CommonModule, DataGridComponent, RouterLink],
  templateUrl: './affiliate-products.component.html',
  styleUrl: './affiliate-products.component.scss',
})
export class AffiliateProductsComponent implements OnInit, OnDestroy {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);
  private readonly popupService = inject(PopUpService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly seasonOptions = CATALOG_SEASON_OPTIONS;
  selectedSeason: CatalogSeason | '' = '';
  private dataGrid?: DataGridComponent<AffiliateProductGridRow>;
  private mobileLoadMoreObserver?: IntersectionObserver;

  products: CatalogProduct[] = [];
  gridRows: AffiliateProductGridRow[] = [];
  columns: Colonne[] = [];
  dataProvider?: GridDataProvider<AffiliateProductGridRow>;
  loading = false;
  productsLoading = false;
  loadingMore = false;
  deletingProducts = false;
  reclassificationPanelOpen = false;
  reclassificationBusy = false;
  reclassificationPreview: CatalogReclassificationPreview | null = null;
  reclassificationJob: FashionEnrichmentJob | null = null;
  reclassificationError = '';
  reclassificationNotice = '';
  private reclassificationPolling?: Subscription;
  cleanupPanelOpen = false;
  cleanupLoading = false;
  cleanupSubmitting = false;
  cleanupJob: AffiliateUnclassifiedCleanupJob | null = null;
  cleanupError = '';
  cleanupConfirmationText = '';
  cleanupBackupConfirmed = false;
  private cleanupPolling?: Subscription;
  error = '';
  loadMoreError = '';
  hasMore = false;

  private programNames = new Map<string, string>();
  private restoredFilters: Record<string, string> = {};

  @ViewChild(DataGridComponent)
  set productGrid(grid: DataGridComponent<AffiliateProductGridRow> | undefined) {
    this.dataGrid = grid;
    if (!grid || !this.dataProvider) return;

    grid.pageSize = AFFILIATE_PRODUCTS_PAGE_SIZE;
    grid.setProviderInitialFilters(this.restoredFilters);
    queueMicrotask(() => void grid.renderGrid());
  }

  @ViewChild('mobileLoadMoreSentinel')
  set mobileLoadMoreSentinel(element: ElementRef<HTMLElement> | undefined) {
    this.mobileLoadMoreObserver?.disconnect();
    this.mobileLoadMoreObserver = undefined;

    if (!element || typeof IntersectionObserver === 'undefined') return;

    this.mobileLoadMoreObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void this.loadMore();
      }
    }, {
      root: null,
      rootMargin: '200px 0px',
      threshold: 0,
    });

    this.mobileLoadMoreObserver.observe(element.nativeElement);
  }

  ngOnInit(): void {
    const affiliateProgramId = this.route.snapshot.queryParamMap.get('affiliateProgramId')?.trim();
    const category = this.route.snapshot.queryParamMap.get('category')?.trim();
    const visibleInApp = this.route.snapshot.queryParamMap.get('visibleInApp')?.trim();
    const season = this.route.snapshot.queryParamMap.get('season')?.trim();
    this.selectedSeason = CATALOG_SEASON_OPTIONS.find((item) => item.id === season)?.id ?? '';

    this.restoredFilters = {
      ...(affiliateProgramId ? { affiliateProgramId } : {}),
      ...(category ? { category } : {}),
      ...(visibleInApp === 'true' || visibleInApp === 'false'
        ? { visibleInAppFilter: visibleInApp }
        : {}),
    };

    this.refresh();
  }

  ngOnDestroy(): void {
    this.mobileLoadMoreObserver?.disconnect();
    this.cleanupPolling?.unsubscribe();
    this.reclassificationPolling?.unsubscribe();
  }

  setSeason(value: string): void {
    const next = CATALOG_SEASON_OPTIONS.find((item) => item.id === value)?.id ?? '';
    if (this.selectedSeason === next) return;
    // Preserve existing grid-side remote filters when recreating the provider.
    for (const field of ['affiliateProgramId', 'category', 'visibleInAppFilter']) {
      const current = this.dataGrid?.providerFilterValue(field);
      if (typeof current === 'string' && current) this.restoredFilters[field] = current;
      else delete this.restoredFilters[field];
    }
    this.selectedSeason = next;
    this.refresh();
  }

  refresh(): void {
    if (this.loading || this.loadingMore) return;

    this.dataGrid?.clearSelectedRows();
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
      categories: this.affiliateCatalogService.getProductCategories(),
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ programs, categories }) => {
          this.programNames = new Map(programs.map((program) => [program.id, program.name]));
          this.columns = buildAffiliateProductColumns(programs, categories, this.auth.isAdmin());
          this.dataProvider = createAffiliateProductsProvider(
            this.affiliateCatalogService,
            this.programNames,
            {
              onLoadStart: (append) => this.onProviderLoadStart(append),
              onPage: (products, append, hasMore) => this.applyProviderPage(products, append, hasMore),
              onLoadError: (append) => this.onProviderLoadError(append),
              onLoadEnd: (append) => this.onProviderLoadEnd(append),
            },
            this.selectedSeason || undefined,
          );
        },
        error: () => {
          this.productsLoading = false;
          this.error = 'Impossibile inizializzare i filtri del catalogo affiliato.';
        },
      });
  }

  openReclassificationPanel(): void {
    if (!this.auth.isAdmin()) return;
    this.reclassificationPanelOpen = true;
    this.refreshReclassificationStatus();
  }

  closeReclassificationPanel(): void {
    this.reclassificationPanelOpen = false;
    this.reclassificationPolling?.unsubscribe();
    this.reclassificationPolling = undefined;
    this.reclassificationError = '';
    this.reclassificationNotice = '';
    this.reclassificationPreview = null;
  }

  get reclassificationRunning(): boolean {
    return this.reclassificationJob?.status === 'QUEUED' || this.reclassificationJob?.status === 'RUNNING';
  }

  private setReclassificationJob(job: FashionEnrichmentJob | null): void {
    const previous = this.reclassificationJob;
    this.reclassificationJob = job;
    if (this.reclassificationRunning) {
      this.startReclassificationPolling();
    } else {
      this.reclassificationPolling?.unsubscribe();
      this.reclassificationPolling = undefined;
      if (job?.mode === 'RECLASSIFY' && job.status === 'SUCCESS' && previous?.status === 'RUNNING') {
        this.refresh();
      }
    }
  }

  refreshReclassificationStatus(): void {
    if (!this.reclassificationPanelOpen) return;
    this.affiliateCatalogService.getCatalogReclassificationJob().subscribe({
      next: (job) => this.setReclassificationJob(job),
      error: () => { this.reclassificationError = 'Impossibile leggere lo stato della riclassificazione.'; },
    });
  }

  private startReclassificationPolling(): void {
    if (!this.reclassificationPanelOpen || this.reclassificationPolling) return;
    this.reclassificationPolling = timer(4000, 4000).pipe(
      exhaustMap(() => this.affiliateCatalogService.getCatalogReclassificationJob()),
    ).subscribe({
      next: (job) => this.setReclassificationJob(job),
      error: () => {
        this.reclassificationError = 'Impossibile aggiornare lo stato. Riprova manualmente.';
        this.reclassificationPolling?.unsubscribe();
        this.reclassificationPolling = undefined;
      },
    });
  }

  previewReclassification(): void {
    if (!this.auth.isAdmin() || !this.reclassificationPanelOpen || this.reclassificationBusy || this.reclassificationRunning) return;
    this.reclassificationPreview = null;
    this.reclassificationError = '';
    this.reclassificationNotice = '';
    this.reclassificationBusy = true;
    this.affiliateCatalogService.previewCatalogReclassification()
      .pipe(finalize(() => this.reclassificationBusy = false))
      .subscribe({
        next: (preview) => { this.reclassificationPreview = preview; },
        error: () => { this.reclassificationError = 'Impossibile calcolare l’anteprima. Nessun prodotto è stato modificato.'; },
      });
  }

  confirmReclassification(): void {
    const preview = this.reclassificationPreview;
    if (!this.auth.isAdmin() || !preview || this.reclassificationBusy || this.reclassificationRunning) return;
    confirm(
      'Applicare i dizionari attivi al catalogo completo? L’anteprima riguarda solo i primi '
      + preview.sampleLimit + ' prodotti. I campi già classificati e le modifiche manuali saranno rispettati. '
      + 'Non vengono modificati prezzi, offerte, immagini o disponibilità.',
      'Conferma riclassificazione prodotti',
      (accepted) => { if (accepted) this.launchReclassification(preview.version); },
    );
  }

  private launchReclassification(version: string): void {
    if (this.reclassificationBusy || !this.reclassificationPanelOpen || !this.auth.isAdmin()
        || this.reclassificationPreview?.version !== version || this.reclassificationRunning) return;
    this.reclassificationBusy = true;
    this.reclassificationError = '';
    this.affiliateCatalogService.startCatalogReclassification(version)
      .pipe(finalize(() => this.reclassificationBusy = false))
      .subscribe({
        next: (job) => {
          this.reclassificationPreview = null;
          this.reclassificationNotice = 'Riclassificazione avviata. Puoi chiudere la pagina e consultare lo stato in seguito.';
          this.setReclassificationJob(job);
        },
        error: (error: { status?: number }) => {
          this.reclassificationError = error.status === 409
            ? 'Dizionari modificati o job già in corso: aggiorna lo stato e ripeti l’anteprima.'
            : 'Avvio non riuscito. Nessun nuovo job confermato; verifica lo stato prima di riprovare.';
        },
      });
  }

  reclassificationValue(field: string, value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (field === 'fashionProfile' && typeof value === 'object' && !Array.isArray(value)) {
      const profile = value as { styleAffinities?: string[]; seasons?: string[]; fit?: string };
      const styles = profile.styleAffinities?.join(', ') || 'non identificati';
      const seasons = profile.seasons?.join(', ') || 'non determinate';
      return 'Stili: ' + styles + ' · Stagioni: ' + seasons + ' · Fit: ' + (profile.fit || 'UNKNOWN');
    }
    return Array.isArray(value) ? value.join(', ') : String(value);
  }

  /** Opens the already existing job if the page was refreshed: opening never starts deletion. */
  openCleanupPanel(): void {
    if (!this.auth.isAdmin()) return;
    this.cleanupPanelOpen = true;
    this.fetchCleanupStatus(true);
  }

  closeCleanupPanel(): void {
    this.cleanupPanelOpen = false;
    this.cleanupPolling?.unsubscribe();
    this.cleanupPolling = undefined;
    this.cleanupError = '';
    this.cleanupConfirmationText = '';
    this.cleanupBackupConfirmed = false;
  }

  refreshCleanupStatus(): void {
    if (this.cleanupPanelOpen && !this.cleanupLoading && !this.cleanupSubmitting) {
      this.fetchCleanupStatus(true);
    }
  }

  private fetchCleanupStatus(showLoading: boolean): void {
    if (!this.cleanupPanelOpen) return;
    if (showLoading) this.cleanupLoading = true;
    this.affiliateCatalogService.getUnclassifiedCleanupStatus()
      .pipe(finalize(() => { if (showLoading) this.cleanupLoading = false; }))
      .subscribe({
        next: (job) => {
          if (!this.cleanupPanelOpen) return;
          this.cleanupError = '';
          this.setCleanupJob(job);
        },
        error: (error: { status?: number }) => {
          if (!this.cleanupPanelOpen) return;
          this.cleanupError = this.cleanupApiError(error, 'Impossibile leggere lo stato della bonifica.');
          this.stopCleanupPolling();
        },
      });
  }

  private setCleanupJob(job: AffiliateUnclassifiedCleanupJob | null): void {
    const previous = this.cleanupJob;
    if (previous?.runId !== job?.runId || (previous?.status !== 'PREVIEW_READY' && job?.status === 'PREVIEW_READY')) {
      this.cleanupConfirmationText = '';
      this.cleanupBackupConfirmed = false;
    }
    this.cleanupJob = job;

    if (job?.status === 'PREVIEWING' || job?.status === 'RUNNING' || job?.status === 'STOP_REQUESTED') {
      this.startCleanupPolling();
    } else {
      this.stopCleanupPolling();
    }
    if (job?.status === 'SUCCESS' && previous?.status === 'RUNNING') {
      this.refresh();
    }
  }

  private startCleanupPolling(): void {
    if (this.cleanupPolling || !this.cleanupPanelOpen) return;
    this.cleanupPolling = timer(4000, 4000)
      .pipe(exhaustMap(() => this.affiliateCatalogService.getUnclassifiedCleanupStatus()))
      .subscribe({
        next: (job) => {
          if (this.cleanupPanelOpen) {
            this.cleanupError = '';
            this.setCleanupJob(job);
          }
        },
        error: (error: { status?: number }) => {
          if (this.cleanupPanelOpen) {
            this.cleanupError = this.cleanupApiError(error, 'Impossibile aggiornare lo stato della bonifica.');
          }
          this.stopCleanupPolling();
        },
      });
  }

  private stopCleanupPolling(): void {
    this.cleanupPolling?.unsubscribe();
    this.cleanupPolling = undefined;
  }

  requestCleanupPreview(): void {
    if (!this.auth.isAdmin() || !this.cleanupPanelOpen || this.cleanupSubmitting
      || this.cleanupLoading || this.isCleanupActive()) return;
    this.cleanupSubmitting = true;
    this.cleanupError = '';
    this.cleanupConfirmationText = '';
    this.cleanupBackupConfirmed = false;
    this.affiliateCatalogService.previewUnclassifiedCleanup()
      .pipe(finalize(() => this.cleanupSubmitting = false))
      .subscribe({
        next: (job) => this.setCleanupJob(job),
        error: (error: { status?: number }) =>
          this.cleanupError = this.cleanupApiError(error, 'Impossibile avviare l’anteprima della bonifica.'),
      });
  }

  isCleanupActive(): boolean {
    return ['PREVIEWING', 'RUNNING', 'STOP_REQUESTED'].includes(this.cleanupJob?.status ?? '');
  }

  canConfirmCleanup(): boolean {
    return this.auth.isAdmin() && this.cleanupPanelOpen && !this.cleanupLoading && !this.cleanupSubmitting
      && this.cleanupJob?.status === 'PREVIEW_READY'
      && this.cleanupJob.preview.eligible > 0
      && this.cleanupBackupConfirmed && this.cleanupConfirmationText.trim().toUpperCase() === 'ELIMINA';
  }

  confirmCleanupDeletion(): void {
    if (!this.canConfirmCleanup()) return;
    const job = this.cleanupJob!;
    confirm(
      `La bonifica eliminerà fino a ${job.preview.eligible} prodotti non classificati, ${job.preview.variants} varianti e ${job.preview.offers} offerte. I prodotti protetti saranno conservati. Hai verificato il backup Firestore? L'operazione è irreversibile.`,
      'Conferma definitiva bonifica catalogo',
      (accepted) => { if (accepted) this.executeCleanupDeletion(job.runId); },
    );
  }

  private executeCleanupDeletion(runId: string): void {
    if (!this.canConfirmCleanup() || this.cleanupJob?.runId !== runId) return;
    this.cleanupSubmitting = true;
    this.cleanupError = '';
    this.affiliateCatalogService.confirmUnclassifiedCleanup(runId)
      .pipe(finalize(() => this.cleanupSubmitting = false))
      .subscribe({
        next: (job) => {
          this.cleanupConfirmationText = '';
          this.cleanupBackupConfirmed = false;
          this.setCleanupJob(job);
        },
        error: (error: { status?: number }) =>
          this.cleanupError = this.cleanupApiError(error, 'Impossibile confermare la bonifica.'),
      });
  }

  requestCleanupStop(): void {
    const job = this.cleanupJob;
    if (!this.auth.isAdmin() || !this.cleanupPanelOpen || !job
      || !['PREVIEWING', 'RUNNING'].includes(job.status) || this.cleanupSubmitting) return;
    this.cleanupSubmitting = true;
    this.cleanupError = '';
    this.affiliateCatalogService.stopUnclassifiedCleanup(job.runId)
      .pipe(finalize(() => this.cleanupSubmitting = false))
      .subscribe({
        next: (updated) => this.setCleanupJob(updated),
        error: (error: { status?: number }) =>
          this.cleanupError = this.cleanupApiError(error, 'Impossibile richiedere l’arresto della bonifica.'),
      });
  }

  private cleanupApiError(error: { status?: number }, fallback: string): string {
    if (error?.status === 404) return 'Funzione non disponibile: verifica che il backend aggiornato sia stato distribuito.';
    if (error?.status === 409) return 'Operazione non consentita: anteprima scaduta, tassonomia modificata o sincronizzazione in corso. Aggiorna lo stato ed eventualmente ripeti l’anteprima.';
    if (error?.status === 403) return 'Non disponi dei permessi di amministratore per questa operazione.';
    return fallback;
  }

  async loadMore(): Promise<void> {
    if (!this.dataGrid || this.loading || this.loadingMore || !this.hasMore) return;
    await this.dataGrid.loadNextRemotePage();
  }

  trackByProductId(_index: number, product: CatalogProduct): string {
    return product.id;
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

  seasonLabel(product: CatalogProduct): string {
    return affiliateProductSeasonsLabel(product.fashionProfile?.seasons);
  }

  materialsLabel(product: CatalogProduct): string {
    return product.materials?.filter(Boolean).join(', ') || '—';
  }

  async openDetail(product: CatalogProduct): Promise<void> {
    if (!product?.id) return;

    const queryParams = {
      affiliateProgramId: this.dataGrid?.providerFilterValue('affiliateProgramId') || null,
      category: this.dataGrid?.providerFilterValue('category') || null,
      visibleInApp: this.dataGrid?.providerFilterValue('visibleInAppFilter') || null,
      ...(this.selectedSeason ? { season: this.selectedSeason } : {}),
    };

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    await this.router.navigate(
      ['/affiliate-catalog/products', product.id],
      { queryParamsHandling: 'preserve' },
    );
  }

  dataGridSelectedCount(): number {
    return this.dataGrid?.getSelectedRows().length ?? 0;
  }

  confirmDeleteSingleProduct(product: CatalogProduct): void {
    if (product?.id) this.confirmDeleteProducts([product.id]);
  }

  deleteSelectedProducts(): void {
    if (!this.auth.isAdmin() || this.deletingProducts) return;
    const ids = this.dataGrid?.getSelectedRows().map((row) => row.id) ?? [];
    this.confirmDeleteProducts(ids);
  }

  private confirmDeleteProducts(productIds: string[]): void {
    const ids = [...new Set(productIds)];
    if (!this.auth.isAdmin() || this.deletingProducts || !ids.length) return;
    if (ids.length > 50) {
      alert('Puoi eliminare al massimo 50 prodotti per operazione. Riduci la selezione.', 'Selezione troppo ampia');
      return;
    }
    confirm(
      `Eliminare ${ids.length} prodotti selezionati? I prodotti presenti negli outfit o condivisi tra feed saranno conservati. L'operazione non può essere annullata.`,
      'Conferma eliminazione prodotti',
      (accepted) => { if (accepted) this.executeDeleteProducts(ids); },
    );
  }

  private executeDeleteProducts(ids: string[]): void {
    this.deletingProducts = true;
    this.affiliateCatalogService.deleteSelectedProducts(ids)
      .pipe(finalize(() => this.deletingProducts = false))
      .subscribe({
        next: (result) => {
          this.dataGrid?.clearSelectedRows();
          alert(`Eliminati: ${result.deleted}. Protetti dagli outfit: ${result.protectedByOutfits}. Condivisi con altri feed: ${result.sharedAcrossFeeds}. Non trovati: ${result.notFound}.`,
            'Eliminazione prodotti completata');
          this.refresh();
        },
        error: (error: { status?: number }) => {
          alert(error?.status === 409
            ? 'Un feed associato è in sincronizzazione o pulizia. Attendi e riprova.'
            : 'Impossibile completare l’eliminazione dei prodotti.', 'Errore eliminazione');
        },
      });
  }

  gridAction(event: { name?: string; rowData?: AffiliateProductGridRow }): void {
    if (event?.name === 'detail' && event.rowData) void this.openDetail(event.rowData);
    if (event?.name === 'edit' && event.rowData) this.openEdit(event.rowData);
    if (event?.name === 'delete' && event.rowData) this.confirmDeleteProducts([event.rowData.id]);
  }

  openEdit(product: CatalogProduct): void {
    if (!this.auth.isAdmin() || !product?.id) return;
    const guid = `affiliate-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.popupService.setNewPopUp(
      guid, 'AffiliateProductFormHostComponent', { productId: product.id },
      920, undefined, undefined, false, true,
      'Modifica prodotto', 'center', false,
    );
    void this.popupService.getOutputComponent(guid).then((result: AffiliateProductFormResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      if (result?.name !== 'saved') return;
      // Preserve only scalar remote filter values; providerFilterValue returns unknown.
      const filters: Record<string, string> = {};
      for (const field of ['affiliateProgramId', 'category', 'visibleInAppFilter']) {
        const value = this.dataGrid?.providerFilterValue(field);
        if (typeof value === 'string' && value) filters[field] = value;
      }
      this.restoredFilters = filters;
      this.refresh();
      alert('Prodotto aggiornato per ComeMiVesto.', 'Operazione completata');
    });
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
