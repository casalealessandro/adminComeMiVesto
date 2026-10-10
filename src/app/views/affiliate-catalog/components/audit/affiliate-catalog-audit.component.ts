import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  CatalogAnalytics, CatalogAnalyticsCategory, CatalogAnalyticsCounts, CatalogAnalyticsFeed,
  CatalogAnalyticsScope, FashionOverviewJob, FashionOverviewResponse,
} from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

export function auditPercentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

const ZERO_COUNTS: CatalogAnalyticsCounts = {
  total: 0, active: 0, taxonomyComplete: 0,
  missingCategory: 0, missingSubcategory: 0, invalidCategory: 0, invalidSubcategory: 0,
  withImages: 0, withGender: 0, withColor: 0,
  fashionV2: 0, fashionLegacy: 0, fashionMissing: 0, fashionLocked: 0,
  withSeasons: 0, withStyles: 0, withFit: 0, withVisualWeight: 0,
};

@Component({
  selector: 'app-affiliate-catalog-audit',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './affiliate-catalog-audit.component.html',
  styleUrl: './affiliate-catalog-audit.component.scss',
})
export class AffiliateCatalogAuditComponent implements OnInit {
  private readonly service = inject(AffiliateCatalogService);

  overview: FashionOverviewResponse | null = null;
  scope: 'usable' | 'all' = 'usable';
  selectedProgramId = '';
  selectedFeedId = '';
  loading = false;
  processing = false;
  error = '';
  notice = '';

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.service.getFashionOverview().pipe(finalize(() => this.loading = false)).subscribe({
      next: (overview) => { this.overview = overview; },
      error: () => { this.error = 'Impossibile caricare la panoramica del catalogo.'; },
    });
  }

  recalculate(): void {
    if (this.processing || this.jobRunning) return;
    this.processing = true;
    this.notice = '';
    this.error = '';
    this.service.refreshFashionOverview().pipe(finalize(() => this.processing = false)).subscribe({
      next: (job) => {
        this.overview = { ...this.overview, job, snapshot: this.overview?.snapshot ?? null };
        this.notice = 'Analisi avviata in background. Puoi chiudere questa pagina; aggiorna la visualizzazione per leggere il risultato.';
      },
      error: (error: { status?: number }) => {
        this.error = error.status === 409
          ? 'Esiste già una panoramica in elaborazione.'
          : 'Non è stato possibile avviare la panoramica.';
      },
    });
  }

  get job(): FashionOverviewJob | null { return this.overview?.job ?? null; }
  get jobRunning(): boolean { return this.job?.status === 'QUEUED' || this.job?.status === 'RUNNING'; }
  get report(): CatalogAnalytics | null {
    const analytics = this.overview?.snapshot?.analytics;
    return analytics?.version === 1 ? analytics : null;
  }
  get generatedAt(): number | null { return this.report ? this.overview?.snapshot?.generatedAt ?? null : null; }
  get isOutdated(): boolean {
    return !!this.generatedAt && !!this.report?.feeds.some((feed) =>
      feed.lastSuccessfulSyncAt !== null && feed.lastSuccessfulSyncAt > this.generatedAt!);
  }

  setScope(value: 'usable' | 'all'): void { this.scope = value; }
  setProgram(id: string): void { this.selectedProgramId = id; this.selectedFeedId = ''; }
  setFeed(id: string): void { this.selectedFeedId = id; }

  get visibleFeeds(): CatalogAnalyticsFeed[] {
    return (this.report?.feeds ?? []).filter((feed) =>
      !this.selectedProgramId || feed.programId === this.selectedProgramId);
  }

  get source(): CatalogAnalyticsScope | null {
    if (!this.report) return null;
    if (this.selectedFeedId) return this.report.feeds.find((feed) => feed.feedId === this.selectedFeedId) ?? null;
    if (this.selectedProgramId) return this.report.programs.find((program) => program.programId === this.selectedProgramId) ?? null;
    return this.report.total;
  }

  get counts(): CatalogAnalyticsCounts {
    return this.source?.[this.scope] ?? ZERO_COUNTS;
  }

  get categories(): CatalogAnalyticsCategory[] {
    return (this.report?.categories ?? [])
      .filter((category) => category.subcategoryId === null)
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'it'));
  }

  childrenFor(id: string): CatalogAnalyticsCategory[] {
    return (this.report?.categories ?? [])
      .filter((category) => category.parentCategoryId === id)
      .sort((a, b) => (a.subcategoryName ?? '').localeCompare(b.subcategoryName ?? '', 'it'));
  }

  categoryCounts(category: CatalogAnalyticsCategory): CatalogAnalyticsCounts {
    if (!this.report) return ZERO_COUNTS;
    const sourceType = this.selectedFeedId ? 'feed' : this.selectedProgramId ? 'program' : null;
    if (!sourceType) return category[this.scope];
    const sourceId = sourceType === 'feed' ? this.selectedFeedId : this.selectedProgramId;
    const taxonomyId = category.subcategoryId ?? category.categoryId;
    const segment = this.report.categorySegments.find((item) =>
      item.sourceType === sourceType && item.sourceId === sourceId && item.taxonomyId === taxonomyId);
    return segment?.[this.scope] ?? ZERO_COUNTS;
  }

  feedCounts(feed: CatalogAnalyticsFeed): CatalogAnalyticsCounts { return feed[this.scope]; }
  feedStatus(feed: CatalogAnalyticsFeed): string {
    if (!feed.networkActive) return 'Programma non attivo';
    return feed.enabled ? 'Attivo' : 'Feed disabilitato';
  }
  missingTaxonomy(counts: CatalogAnalyticsCounts): number {
    return counts.total - counts.taxonomyComplete;
  }
  percentage(value: number, total: number): number { return auditPercentage(value, total); }
}
