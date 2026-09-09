import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ColData, Colonne, DataGridComponent } from '../../../../core/public-api';
import {
  AffiliateFeed,
  AffiliateProgram,
  AffiliateSyncRun,
  AffiliateSyncRunStatus,
} from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

export const AFFILIATE_SYNC_RUNS_PAGE_SIZE = 50;

const STATUS_LABELS: Record<AffiliateSyncRunStatus, string> = {
  QUEUED: 'In coda',
  RUNNING: 'In esecuzione',
  SUCCESS: 'Completata',
  PARTIAL: 'Parziale',
  FAILED: 'Fallita',
  ABORTED: 'Interrotta',
};

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

export interface AffiliateSyncRunGridRow extends AffiliateSyncRun {
  programName: string;
  feedName: string;
  statusLabel: string;
  productsLabel: string;
  variantsLabel: string;
  errorsCount: number;
}

export function affiliateSyncStatusLabel(status: AffiliateSyncRunStatus): string {
  return STATUS_LABELS[status];
}

export function buildAffiliateSyncRunColumns(): Colonne[] {
  const columns: ColData[] = [
    baseColumn('statusLabel', 'Stato', 120),
    baseColumn('feedName', 'Feed', 190),
    baseColumn('programName', 'Programma', 180),
    baseColumn('startedAt', 'Avvio', 145, 'campoDateTime'),
    baseColumn('completedAt', 'Completamento', 145, 'campoDateTime'),
    baseColumn('recordsRead', 'Record letti', 105, 'campoNumber'),
    baseColumn('productsLabel', 'Prodotti + / ~', 130),
    baseColumn('variantsLabel', 'Varianti + / ~', 130),
    baseColumn('offersUpdated', 'Offerte', 90, 'campoNumber'),
    baseColumn('productsMissing', 'Mancanti', 95, 'campoNumber'),
    baseColumn('errorsCount', 'Errori', 80, 'campoNumber'),
  ];

  return [{ itemType: 'group', groupDataField: '', data: columns }];
}

export function buildAffiliateSyncRunGridRows(
  runs: AffiliateSyncRun[],
  programNames: ReadonlyMap<string, string>,
  feedNames: ReadonlyMap<string, string>,
): AffiliateSyncRunGridRow[] {
  return runs.map((run) => ({
    ...run,
    programName: programNames.get(run.affiliateProgramId) || run.affiliateProgramId,
    feedName: feedNames.get(run.affiliateFeedId) || run.affiliateFeedId,
    statusLabel: affiliateSyncStatusLabel(run.status),
    productsLabel: `${run.productsCreated} / ${run.productsUpdated}`,
    variantsLabel: `${run.variantsCreated} / ${run.variantsUpdated}`,
    errorsCount: run.errors?.length ?? 0,
  }));
}

@Component({
  selector: 'app-affiliate-sync-runs',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  templateUrl: './affiliate-sync-runs.component.html',
  styleUrl: './affiliate-sync-runs.component.scss',
})
export class AffiliateSyncRunsComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  runs: AffiliateSyncRun[] = [];
  gridRows: AffiliateSyncRunGridRow[] = [];
  readonly columns = buildAffiliateSyncRunColumns();
  loading = false;
  loadingMore = false;
  error = '';
  loadMoreError = '';
  hasMore = false;
  nextCursor: string | null = null;

  private programNames = new Map<string, string>();
  private feedNames = new Map<string, string>();

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (this.loading || this.loadingMore) return;

    this.loading = true;
    this.error = '';
    this.loadMoreError = '';

    forkJoin({
      page: this.affiliateCatalogService.getSyncRuns({ limit: AFFILIATE_SYNC_RUNS_PAGE_SIZE }),
      programs: this.affiliateCatalogService.getPrograms().pipe(
        catchError(() => of([] as AffiliateProgram[])),
      ),
      feeds: this.affiliateCatalogService.getFeeds().pipe(
        catchError(() => of([] as AffiliateFeed[])),
      ),
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ page, programs, feeds }) => {
          this.programNames = new Map(programs.map((program) => [program.id, program.name]));
          this.feedNames = new Map(feeds.map((feed) => [feed.id, feed.name]));
          this.applyPage(page.data, page.pagination.nextCursor, page.pagination.hasMore, false);
        },
        error: () => {
          this.runs = [];
          this.gridRows = [];
          this.hasMore = false;
          this.nextCursor = null;
          this.error = 'Impossibile caricare la cronologia delle sincronizzazioni affiliate.';
        },
      });
  }

  loadMore(): void {
    if (this.loading || this.loadingMore || !this.hasMore || !this.nextCursor) return;

    this.loadingMore = true;
    this.loadMoreError = '';
    const cursor = this.nextCursor;

    this.affiliateCatalogService.getSyncRuns({
      limit: AFFILIATE_SYNC_RUNS_PAGE_SIZE,
      cursor,
    })
      .pipe(finalize(() => this.loadingMore = false))
      .subscribe({
        next: (page) => {
          this.applyPage(page.data, page.pagination.nextCursor, page.pagination.hasMore, true);
        },
        error: () => {
          this.loadMoreError = 'Impossibile caricare altre sincronizzazioni. Riprova.';
        },
      });
  }

  programName(run: AffiliateSyncRun): string {
    return this.programNames.get(run.affiliateProgramId) || run.affiliateProgramId;
  }

  feedName(run: AffiliateSyncRun): string {
    return this.feedNames.get(run.affiliateFeedId) || run.affiliateFeedId;
  }

  statusLabel(run: AffiliateSyncRun): string {
    return affiliateSyncStatusLabel(run.status);
  }

  statusBadgeClass(run: AffiliateSyncRun): string {
    switch (run.status) {
      case 'SUCCESS': return 'text-bg-success';
      case 'FAILED': return 'text-bg-danger';
      case 'PARTIAL': return 'text-bg-warning';
      case 'RUNNING': return 'text-bg-primary';
      case 'QUEUED': return 'text-bg-info';
      case 'ABORTED': return 'text-bg-secondary';
    }
  }

  errorsCount(run: AffiliateSyncRun): number {
    return run.errors?.length ?? 0;
  }

  private applyPage(
    items: AffiliateSyncRun[],
    nextCursor: string | null,
    hasMore: boolean,
    append: boolean,
  ): void {
    const combined = append ? [...this.runs, ...items] : [...items];
    this.runs = Array.from(new Map(combined.map((run) => [run.id, run])).values());
    this.nextCursor = nextCursor;
    this.hasMore = hasMore;
    this.gridRows = buildAffiliateSyncRunGridRows(this.runs, this.programNames, this.feedNames);
  }
}
