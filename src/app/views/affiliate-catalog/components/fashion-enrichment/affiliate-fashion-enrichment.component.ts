import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  FashionCatalogOverview, FashionCoverage, FashionCatalogExample, FashionMerchantOverview, FashionOverviewJob,
} from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

@Component({
  selector: 'app-affiliate-fashion-enrichment',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './affiliate-fashion-enrichment.component.html',
  styleUrl: './affiliate-fashion-enrichment.component.scss',
})
export class AffiliateFashionEnrichmentComponent implements OnInit {
  private readonly service = inject(AffiliateCatalogService);

  overview: FashionCatalogOverview | null = null;
  job: FashionOverviewJob | null = null;
  selectedProgramId = '';
  /** The usable-outfit catalogue is the default for all editorial/AI planning. */
  scope: 'usable' | 'all' = 'usable';
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
      next: (data) => {
        this.overview = data.snapshot;
        this.job = data.job;
      },
      error: () => { this.error = 'Impossibile recuperare la panoramica fashion.'; },
    });
  }

  requestOverview(): void {
    if (this.processing || this.jobRunning) return;
    this.processing = true;
    this.error = '';
    this.notice = '';
    this.service.refreshFashionOverview().pipe(finalize(() => this.processing = false)).subscribe({
      next: (job) => {
        this.job = job;
        this.notice = 'Analisi del catalogo avviata. Il lavoro prosegue su Firebase anche se chiudi questa pagina.';
      },
      error: (err: { status?: number }) => {
        this.error = err?.status === 409
          ? 'È già in corso una panoramica. Aggiorna lo stato prima di riprovare.'
          : 'Impossibile avviare la panoramica. Nessuna analisi AI è stata avviata.';
      },
    });
  }

  get jobRunning(): boolean {
    return this.job?.status === 'QUEUED' || this.job?.status === 'RUNNING';
  }

  /** Old version-1 snapshots cannot be shown as usable: ask for a new report. */
  get effectiveOverview(): FashionCatalogOverview | null {
    return this.overview?.version === 2 ? this.overview : null;
  }

  get visibleCoverage(): FashionCoverage | null {
    const overview = this.effectiveOverview;
    return overview ? (this.scope === 'usable' ? overview.usable : overview.summary) : null;
  }

  get merchants(): FashionMerchantOverview[] {
    const merchants = this.effectiveOverview?.merchants ?? [];
    return merchants.filter((merchant) =>
      (this.scope === 'all' || merchant.usable.total > 0)
      && (!this.selectedProgramId || merchant.programId === this.selectedProgramId));
  }

  get merchantOptions(): FashionMerchantOverview[] {
    return (this.effectiveOverview?.merchants ?? [])
      .filter((merchant) => this.scope === 'all' || merchant.usable.total > 0);
  }

  setScope(scope: 'usable' | 'all'): void {
    if (this.scope === scope) return;
    this.scope = scope;
    this.selectedProgramId = '';
  }

  coverageForMerchant(merchant: FashionMerchantOverview): FashionCoverage {
    return this.scope === 'usable' ? merchant.usable : merchant;
  }

  examplesForMerchant(merchant: FashionMerchantOverview): FashionCatalogExample[] {
    return this.scope === 'usable' ? merchant.usableExamples : merchant.examples;
  }

  percentage(value: number, total: number): number {
    if (total <= 0 || !Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, Math.round(100 * value / total)));
  }

  isOutdated(merchant: FashionMerchantOverview): boolean {
    return !!this.overview && merchant.lastSuccessfulSyncAt !== null
      && merchant.lastSuccessfulSyncAt > this.overview.generatedAt;
  }

  jobStatus(value: FashionOverviewJob['status']): string {
    return {
      QUEUED: 'In coda', RUNNING: 'In elaborazione', SUCCESS: 'Completato', FAILED: 'Errore',
    }[value];
  }
}
