import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  FashionCatalogOverview, FashionMerchantOverview, FashionOverviewJob,
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

  get merchants(): FashionMerchantOverview[] {
    const merchants = this.overview?.merchants ?? [];
    return this.selectedProgramId
      ? merchants.filter((m) => m.programId === this.selectedProgramId) : merchants;
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
