import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { AffiliateFeed, AffiliateProgram, AffiliateSyncRun } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  affiliateSyncStatusBadgeClass,
  affiliateSyncStatusLabel,
} from './affiliate-sync-runs.component';

export function affiliateSyncRunDetailErrorMessage(status?: number): string {
  if (status === 401 || status === 403) return 'Non sei autorizzato a consultare questa sincronizzazione.';
  if (status === 404) return 'La sincronizzazione richiesta non è più disponibile.';
  if (status === 0) return 'Backend non raggiungibile. Riprova quando la connessione è disponibile.';
  return 'Impossibile caricare il dettaglio della sincronizzazione.';
}

@Component({
  selector: 'app-affiliate-sync-run-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './affiliate-sync-run-detail.component.html',
  styleUrl: '../affiliate-detail-layout.scss',
})
export class AffiliateSyncRunDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);

  runId = '';
  run: AffiliateSyncRun | null = null;
  program: AffiliateProgram | null = null;
  feed: AffiliateFeed | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')?.trim() ?? '';
    if (!id) {
      this.error = 'Identificativo sincronizzazione non valido.';
      return;
    }
    this.runId = id;
    this.load();
  }

  load(): void {
    if (!this.runId || this.loading) return;

    this.loading = true;
    this.error = '';

    this.affiliateCatalogService.getSyncRun(this.runId)
      .pipe(
        switchMap((run) => forkJoin({
          run: of(run),
          program: this.affiliateCatalogService.getProgram(run.affiliateProgramId).pipe(
            catchError(() => of(null as AffiliateProgram | null)),
          ),
          feed: this.affiliateCatalogService.getFeed(run.affiliateFeedId).pipe(
            catchError(() => of(null as AffiliateFeed | null)),
          ),
        })),
        finalize(() => this.loading = false),
      )
      .subscribe({
        next: ({ run, program, feed }) => {
          this.run = run;
          this.program = program;
          this.feed = feed;
        },
        error: (error: { status?: number }) => {
          this.run = null;
          this.program = null;
          this.feed = null;
          this.error = affiliateSyncRunDetailErrorMessage(error?.status);
        },
      });
  }

  programName(): string {
    if (!this.run) return '—';
    return this.program?.name || this.run.affiliateProgramId;
  }

  feedName(): string {
    if (!this.run) return '—';
    return this.feed?.name || this.run.affiliateFeedId;
  }

  statusLabel(): string {
    return this.run ? affiliateSyncStatusLabel(this.run.status) : '—';
  }

  statusBadgeClass(): string {
    return this.run ? affiliateSyncStatusBadgeClass(this.run.status) : 'text-bg-secondary';
  }
}
