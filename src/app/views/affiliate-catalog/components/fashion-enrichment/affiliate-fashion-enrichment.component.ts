import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { FashionEnrichmentBatch, FashionEnrichmentStatus } from '../../models/affiliate-catalog.models';

@Component({
  selector: 'app-affiliate-fashion-enrichment',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './affiliate-fashion-enrichment.component.html',
})
export class AffiliateFashionEnrichmentComponent implements OnInit {
  private readonly service = inject(AffiliateCatalogService);
  status: FashionEnrichmentStatus | null = null;
  batch: FashionEnrichmentBatch | null = null;
  loading = false;
  processing = false;
  error = '';
  cursor: string | null = null;
  scannedTotal = 0;
  updatedTotal = 0;
  finished = false;

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.loading = true;
    this.error = '';
    this.service.getFashionEnrichmentStatus().pipe(finalize(() => this.loading = false)).subscribe({
      next: (value) => { this.status = value; },
      error: () => { this.error = 'Impossibile leggere le informazioni fashion del catalogo.'; },
    });
  }

  enrichNextBatch(): void {
    if (this.processing) return;
    this.processing = true;
    this.error = '';
    this.service.enrichFashionProducts(100, this.cursor).pipe(finalize(() => this.processing = false)).subscribe({
      next: (value) => {
        this.batch = value;
        this.scannedTotal += value.scanned;
        this.updatedTotal += value.updated;
        this.cursor = value.nextCursor;
        this.finished = !value.nextCursor;
        this.refresh();
      },
      error: () => { this.error = 'Elaborazione non riuscita. Puoi riprovare senza duplicare gli aggiornamenti.'; },
    });
  }

  restart(): void {
    if (this.processing) return;
    this.cursor = null;
    this.finished = false;
    this.scannedTotal = 0;
    this.updatedTotal = 0;
    this.batch = null;
  }

  seasonLabel(season: string): string {
    return ({ SPRING: 'Primavera', SUMMER: 'Estate', AUTUMN: 'Autunno', WINTER: 'Inverno' } as Record<string, string>)[season] ?? season;
  }
}
