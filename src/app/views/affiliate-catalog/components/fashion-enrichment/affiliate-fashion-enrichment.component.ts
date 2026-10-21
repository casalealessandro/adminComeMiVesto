import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { confirm } from '../../../../core/dialogs/ui-dialogs';
import { AuthService } from '../../../../services/auth.service';
import {
  FashionCatalogOverview, FashionCoverage, FashionCatalogExample, FashionMerchantOverview, FashionOverviewJob,
  FashionAiPilotJob, AffiliateFeed, AffiliateProgram, FashionVisionCategoryJob, FashionVisionReviewRow,
} from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

@Component({
  selector: 'app-affiliate-fashion-enrichment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './affiliate-fashion-enrichment.component.html',
  styleUrl: './affiliate-fashion-enrichment.component.scss',
})
export class AffiliateFashionEnrichmentComponent implements OnInit {
  private readonly service = inject(AffiliateCatalogService);
  private readonly auth = inject(AuthService);

  overview: FashionCatalogOverview | null = null;
  job: FashionOverviewJob | null = null;
  selectedProgramId = '';
  /** The usable-outfit catalogue is the default for all editorial/AI planning. */
  scope: 'usable' | 'all' = 'usable';
  loading = false;
  processing = false;
  error = '';
  notice = '';

  eligibleFeeds: AffiliateFeed[] = [];
  selectedAiFeedId = '';
  aiMaxProducts = 10;
  aiMaxBudgetUsd = 0.10;
  aiJob: FashionAiPilotJob | null = null;
  aiAccepted = false;
  aiBusy = false;
  aiError = '';
  aiNotice = '';
  readonly aiSizes = [5, 10, 20, 50];
  readonly aiBudgets = [0.10, 0.25, 0.50, 1, 2];

  // New visual review is independent of the legacy feed text-only pilot.
  visionCategories: Array<{ id: string; categoryName: string }> = [];
  visionSubcategories: Array<{ id: string; categoryName: string }> = [];
  selectedVisionCategoryId = '';
  visionCount = 10;
  visionBudget = 0.10;
  visionJob: FashionVisionCategoryJob | null = null;
  visionAccepted = false;
  visionBusy = false;
  visionError = '';
  visionNotice = '';
  visionFilter: 'all' | 'changed' | 'pending' | 'reviewed' = 'all';
  visionStyleEdits: Record<string, string[]> = {};
  visionSeasonEdits: Record<string, string[]> = {};
  visionSubcategoryEdits: Record<string, string> = {};
  readonly visionStyles = [
    'CASUAL', 'BUSINESS', 'SPORTY', 'SMART_CASUAL', 'ELEGANT',
    'ALTERNATIVE', 'FESTIVAL', 'CLASSIC', 'TRENDY', 'STREETWEAR',
  ];
  readonly visionSeasons = [
    { id: 'SPRING', label: 'Primavera' }, { id: 'SUMMER', label: 'Estate' },
    { id: 'AUTUMN', label: 'Autunno' }, { id: 'WINTER', label: 'Inverno' },
  ];
  readonly visionSizes = [5, 10, 20, 50];

  get visionRunning(): boolean {
    return this.visionJob?.status === 'QUEUED' || this.visionJob?.status === 'RUNNING';
  }
  get visionPreviewReady(): boolean {
    return this.visionJob?.status === 'PREVIEW_READY' &&
      Date.now() - this.visionJob.previewAt <= 15 * 60 * 1000;
  }
  get visibleVisionRows(): FashionVisionReviewRow[] {
    return (this.visionJob?.rows || []).filter(row => {
      if (this.visionFilter === 'all') return true;
      if (this.visionFilter === 'reviewed') return row.status === 'APPROVED' || row.status === 'REJECTED';
      if (this.visionFilter === 'pending') return row.status === 'READY';
      return !!row.after && (
        row.before.subcategory !== (this.visionSubcategoryEdits[row.productId] ?? row.after.subcategory) ||
        JSON.stringify(row.before.styles) !== JSON.stringify(this.visionStyleEdits[row.productId] ?? row.after.styles) ||
        JSON.stringify(row.before.seasons) !== JSON.stringify(this.visionSeasonEdits[row.productId] ?? row.after.seasons)
      );
    });
  }
  visionStyleLabel(style: string): string {
    const labels: Record<string, string> = {
      CASUAL: 'Casual', BUSINESS: 'Business', SPORTY: 'Sportivo',
      SMART_CASUAL: 'Smart Casual', ELEGANT: 'Elegante', ALTERNATIVE: 'Alternativo',
      FESTIVAL: 'Festival', CLASSIC: 'Classico', TRENDY: 'Trendy', STREETWEAR: 'Streetwear',
    };
    return labels[style] || style;
  }
  visionStatusLabel(status: FashionVisionCategoryJob['status']): string {
    return {
      PREVIEW_READY: 'Anteprima gratuita', QUEUED: 'In coda', RUNNING: 'In analisi',
      SUCCESS: 'Completata', FAILED: 'Interrotta', STOPPED_BUDGET: 'Sospesa per budget',
    }[status];
  }

  private acceptVisionJob(job: FashionVisionCategoryJob | null): void {
    if (job && this.visionJob?.runId !== job.runId) {
      this.visionStyleEdits = {};
      this.visionSeasonEdits = {};
      this.visionSubcategoryEdits = {};
    }
    this.visionJob = job;
    for (const row of job?.rows || []) {
      if (!row.after) continue;
      if (!(row.productId in this.visionStyleEdits)) this.visionStyleEdits[row.productId] = [...row.after.styles];
      if (!(row.productId in this.visionSeasonEdits)) this.visionSeasonEdits[row.productId] = [...row.after.seasons];
      if (!(row.productId in this.visionSubcategoryEdits)) this.visionSubcategoryEdits[row.productId] = row.after.subcategory;
    }
  }

  onVisionCategoryChanged(): void {
    this.visionJob = null;
    this.visionAccepted = false;
    this.visionError = '';
    this.visionNotice = '';
    this.visionStyleEdits = {};
    this.visionSeasonEdits = {};
    this.visionSubcategoryEdits = {};
    this.visionSubcategories = [];
    const category = this.selectedVisionCategoryId;
    if (!category) return;
    this.service.getCurationCategories(category).subscribe({
      next: (children) => { if (this.selectedVisionCategoryId === category) this.visionSubcategories = children; },
      error: () => { this.visionError = 'Impossibile caricare le sottocategorie disponibili.'; },
    });
    this.refreshVision();
  }

  refreshVision(): void {
    const category = this.selectedVisionCategoryId;
    if (!category || this.visionBusy) return;
    this.visionBusy = true;
    this.service.getFashionVisionCategory(category).pipe(finalize(() => this.visionBusy = false)).subscribe({
      next: (job) => { if (category === this.selectedVisionCategoryId) this.acceptVisionJob(job); },
      error: () => { this.visionError = 'Impossibile caricare la revisione visiva.'; },
    });
  }

  previewVision(next = false): void {
    const category = this.selectedVisionCategoryId;
    if (!this.canManageAi || !category || this.visionBusy || this.visionRunning) return;
    const after = next ? this.visionJob?.nextCursor || undefined : undefined;
    if (next && !after) return;
    this.visionBusy = true;
    this.visionAccepted = false;
    this.visionError = '';
    this.visionNotice = '';
    this.service.previewFashionVisionCategory(category, Number(this.visionCount), Number(this.visionBudget), after)
      .pipe(finalize(() => this.visionBusy = false)).subscribe({
        next: (job) => {
          if (category !== this.selectedVisionCategoryId) return;
          this.acceptVisionJob(job);
          this.visionNotice = job.rows.length
            ? 'Campione pronto. Guarda gli articoli e il costo stimato prima di autorizzare le immagini.'
            : 'Nessun prodotto idoneo nel campione esplorato. Nessun costo AI.';
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.visionError = err.error?.message || 'Impossibile creare l’anteprima visiva.';
        },
      });
  }

  confirmVision(): void {
    const job = this.visionJob;
    if (!job || !this.canManageAi || !this.visionAccepted || !this.visionPreviewReady ||
      !job.rows.length || this.visionBusy || job.categoryId !== this.selectedVisionCategoryId) return;
    confirm([
      'Autorizzi l’analisi delle immagini di ' + job.rows.length + ' prodotti della categoria «' + job.categoryName + '»?',
      'Budget preventivo USD ' + job.maxBudgetUsd.toFixed(2) + '.',
      'La spesa reale può superare la stima se una chiamata fallisce o il provider fattura diversamente.',
      'Le immagini dei merchant saranno inviate al servizio AI. Nessun prodotto viene riclassificato senza revisione.',
    ].join('\n'), 'Conferma analisi visiva e spesa', (yes: boolean) => {
      if (!yes || this.visionBusy || this.selectedVisionCategoryId !== job.categoryId) return;
      this.visionBusy = true;
      this.visionError = '';
      this.service.confirmFashionVisionCategory(job.categoryId, job.runId, job.maxBudgetUsd)
        .pipe(finalize(() => this.visionBusy = false)).subscribe({
          next: (updated) => { this.acceptVisionJob(updated); this.visionAccepted = false; this.visionNotice = 'Analisi in corso. Aggiorna lo stato per vedere le proposte.'; },
          error: (err: { error?: { message?: string } }) => { this.visionError = err.error?.message || 'Impossibile avviare analisi.'; },
        });
    });
  }

  reviewVision(row: FashionVisionReviewRow, action: 'APPROVE' | 'REJECT'): void {
    const job = this.visionJob;
    if (!job || !this.canManageAi || row.status !== 'READY' || this.visionBusy) return;
    const submit = () => {
      this.visionBusy = true;
      this.visionError = '';
      this.service.reviewFashionVisionProduct(job.categoryId, {
        runId: job.runId, productId: row.productId, action,
        ...(action === 'APPROVE' ? {
          styles: this.visionStyleEdits[row.productId] ?? row.after?.styles ?? [],
          seasons: this.visionSeasonEdits[row.productId] ?? row.after?.seasons ?? [],
          subcategory: this.visionSubcategoryEdits[row.productId] ?? row.after?.subcategory ?? '',
        } : {}),
      }).pipe(finalize(() => this.visionBusy = false)).subscribe({
        next: updated => { this.acceptVisionJob(updated); this.visionNotice = action === 'APPROVE' ? 'Correzione approvata e registrata.' : 'Proposta rifiutata.'; },
        error: (err: { error?: { message?: string } }) => { this.visionError = err.error?.message || 'Prodotto cambiato o revisione non riuscita. Aggiorna lo stato.'; },
      });
    };
    if (action === 'REJECT') { submit(); return; }
    confirm('Applichi SOLO a questo prodotto la sottocategoria, gli stili e le stagioni selezionati? Le modifiche vengono bloccate rispetto alle successive sincronizzazioni.', 'Approva classificazione', (approved: boolean) => {
      if (approved) submit();
    });
  }

  get canManageAi(): boolean { return this.auth.isAdmin(); }
  get aiRunning(): boolean {
    return this.aiJob?.status === 'QUEUED' || this.aiJob?.status === 'RUNNING';
  }
  get aiPreviewReady(): boolean {
    return this.aiJob?.status === 'PREVIEW_READY'
      && Date.now() - this.aiJob.previewAt <= 15 * 60 * 1000;
  }

  ngOnInit(): void {
    this.refresh();
    this.service.getCurationCategories().subscribe({
      next: roots => { this.visionCategories = roots; },
      error: () => { this.visionError = 'Impossibile caricare le categorie principali.'; },
    });
    forkJoin({ feeds: this.service.getFeeds(), programs: this.service.getPrograms() }).subscribe({
      next: ({ feeds, programs }) => {
        const activePrograms = new Set(programs.filter((p: AffiliateProgram) =>
          p.enabled === true && p.networkStatus === 'ACTIVE').map((p: AffiliateProgram) => p.id));
        this.eligibleFeeds = feeds.filter((feed: AffiliateFeed) =>
          feed.enabled === true && activePrograms.has(feed.affiliateProgramId));
      },
      error: () => { this.aiError = 'Impossibile leggere i feed abilitati per il test AI.'; },
    });
  }

  onAiFeedChanged(): void {
    this.aiJob = null;
    this.aiAccepted = false;
    this.aiError = '';
    this.aiNotice = '';
    this.refreshAiStatus();
  }

  refreshAiStatus(): void {
    if (!this.selectedAiFeedId || this.aiBusy) return;
    this.aiBusy = true;
    this.aiError = '';
    const expectedFeedId = this.selectedAiFeedId;
    this.service.getFashionAiFeedPilot(expectedFeedId)
      .pipe(finalize(() => this.aiBusy = false))
      .subscribe({
        next: (job) => {
          if (this.selectedAiFeedId !== expectedFeedId) return;
          this.aiJob = job;
          this.aiAccepted = false;
        },
        error: () => { this.aiError = 'Impossibile leggere lo stato del test AI.'; },
      });
  }

  previewAiFeed(): void {
    if (!this.canManageAi || !this.selectedAiFeedId || this.aiBusy || this.aiRunning) return;
    this.aiAccepted = false;
    this.aiBusy = true;
    this.aiError = '';
    this.aiNotice = '';
    const expectedFeedId = this.selectedAiFeedId;
    this.service.previewFashionAiFeedPilot(expectedFeedId, Number(this.aiMaxProducts), Number(this.aiMaxBudgetUsd))
      .pipe(finalize(() => this.aiBusy = false))
      .subscribe({
        next: (job) => {
          if (this.selectedAiFeedId !== expectedFeedId) return;
          this.aiJob = job;
          this.aiNotice = job.selectedIds.length
            ? 'Anteprima pronta: nessun token AI è stato ancora consumato. Controlla prodotti e preventivo.'
            : 'Nessun prodotto idoneo trovato nel campione del feed. Nessun costo OpenAI.';
        },
        error: (err: { status?: number; error?: { message?: string } }) => {
          this.aiError = err.status === 409
            ? (err.error?.message || 'Feed non idoneo, sincronizzazione in corso o test già attivo.')
            : 'Impossibile creare l’anteprima. Nessuna chiamata AI avviata.';
        },
      });
  }

  confirmAiFeed(): void {
    const job = this.aiJob;
    if (!this.canManageAi || !job || !this.aiPreviewReady || !this.aiAccepted ||
      !job.selectedIds.length || this.aiBusy || job.feedId !== this.selectedAiFeedId) return;
    const message = [
      'Autorizzi il test OpenAI sul feed «' + job.feedName + '»?',
      'Prodotti: ' + job.selectedIds.length,
      'Soglia preventiva: USD ' + job.maxBudgetUsd.toFixed(2),
      'La fatturazione effettiva può differire dalla stima e una richiesta fallita può comportare addebiti non misurabili.',
      'I risultati sono solo per revisione: non vengono pubblicati negli outfit.',
    ].join('\n');
    confirm(message, 'Conferma spesa AI', (approved: boolean) => {
      if (approved) this.launchConfirmedAi(job);
    });
  }

  private launchConfirmedAi(job: FashionAiPilotJob): void {
    if (this.aiBusy || !this.canManageAi) return;
    this.aiBusy = true;
    this.aiError = '';
    this.service.confirmFashionAiFeedPilot(job.feedId, job.runId, job.maxBudgetUsd)
      .pipe(finalize(() => this.aiBusy = false))
      .subscribe({
        next: (started) => {
          this.aiJob = started;
          this.aiAccepted = false;
          this.aiNotice = 'Test AI avviato in background. Aggiorna lo stato per vedere i consumi.';
        },
        error: (err: { status?: number }) => {
          this.aiError = err.status === 409
            ? 'Anteprima scaduta, feed cambiato o test già in corso: ripeti la verifica.'
            : 'Non è stato possibile avviare il test AI. Controlla lo stato prima di riprovare.';
        },
      });
  }

  aiStatusLabel(status: FashionAiPilotJob['status']): string {
    return {
      PREVIEW_READY: 'Anteprima senza costi', QUEUED: 'In coda',
      RUNNING: 'In elaborazione', SUCCESS: 'Completato',
      FAILED: 'Interrotto per errore', STOPPED_BUDGET: 'Sospeso per budget',
    }[status];
  }



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
