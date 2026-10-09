import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { FashionEnrichmentJob, FashionEnrichmentStatus } from '../../models/affiliate-catalog.models';

@Component({
  selector: 'app-affiliate-fashion-enrichment',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './affiliate-fashion-enrichment.component.html',
})
export class AffiliateFashionEnrichmentComponent implements OnInit {
  private readonly service = inject(AffiliateCatalogService);
  status: FashionEnrichmentStatus | null = null;
  job: FashionEnrichmentJob | null = null;
  loading = false;
  processing = false;
  error = '';

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.loading = true;
    this.error = '';
    this.service.getFashionEnrichmentStatus().pipe(finalize(() => this.loading = false)).subscribe({
      next: (value) => { this.status = value; this.refreshJob(); },
      error: () => { this.error = 'Impossibile leggere le informazioni fashion del catalogo.'; },
    });
  }

  refreshJob(): void {
    this.service.getFashionEnrichmentJob().subscribe({
      next: (job) => { this.job = job; },
      error: () => { this.error = 'Impossibile leggere lo stato dell’elaborazione.'; },
    });
  }

  startAll(): void {
    if (this.processing) return;
    this.processing = true;
    this.error = '';
    this.service.startFashionEnrichmentJob().pipe(finalize(() => this.processing = false)).subscribe({
      next: (value) => { this.job = value; this.refresh(); },
      error: () => { this.error = 'Elaborazione non riuscita. Puoi riprovare senza duplicare gli aggiornamenti.'; },
    });
  }

  get jobRunning(): boolean { return this.job?.status === 'RUNNING' || this.job?.status === 'QUEUED'; }
}
