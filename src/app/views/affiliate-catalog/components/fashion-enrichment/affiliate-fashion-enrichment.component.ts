import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { confirm } from '../../../../core/dialogs/ui-dialogs';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AuthService } from '../../../../services/auth.service';
import {
  FashionCatalogOverview, FashionCoverage, FashionCatalogExample, FashionMerchantOverview, FashionOverviewJob,
  FashionAiPilotJob, AffiliateFeed, AffiliateProgram, FashionVisionCategoryJob, FashionVisionReviewRow,
  FashionVisionBulkJob, FashionVisionDeferredPage, FashionVisionIssuesPage,
} from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

@Component({
  selector: 'app-affiliate-fashion-enrichment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './affiliate-fashion-enrichment.component.html',
  styleUrl: './affiliate-fashion-enrichment.component.scss',
})
export class AffiliateFashionEnrichmentComponent implements OnInit {
  private readonly service = inject(AffiliateCatalogService);
  private readonly auth = inject(AuthService);
  private readonly popupService = inject(PopUpService);

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
  visionBulkEnabled = false;
  visionBulkJob: FashionVisionBulkJob | null = null;
  visionBulkAccepted = false;
  visionBulkBusy = false;
  visionBulkError = '';
  visionBulkNotice = '';
  visionBulkDeferred: FashionVisionDeferredPage | null = null;
  visionBulkDeferredBusy = false;
  visionBulkIssues: FashionVisionIssuesPage | null = null;
  visionBulkIssuesBusy = false;
  visionCategoryEdits: Record<string, string> = {};
  visionChildrenByCategory: Record<string, Array<{ id: string; categoryName: string }>> = {};
  visionLoadingChildren: Record<string, boolean> = {};
  readonly visionStyles = [
    'CASUAL', 'BUSINESS', 'SPORTY', 'SMART_CASUAL', 'ELEGANT',
    'ALTERNATIVE', 'FESTIVAL', 'CLASSIC', 'TRENDY', 'STREETWEAR',
  ];
  readonly visionSeasons = [
    { id: 'SPRING', label: 'Primavera' }, { id: 'SUMMER', label: 'Estate' },
    { id: 'AUTUMN', label: 'Autunno' }, { id: 'WINTER', label: 'Inverno' },
  ];
  readonly visionSizes = [5, 10, 20, 50];

  get visionBulkRunning(): boolean {
    return !!this.visionBulkJob && ['QUEUED', 'RUNNING', 'STOP_REQUESTED'].includes(this.visionBulkJob.status);
  }
  get visionBulkPreviewReady(): boolean {
    return this.visionBulkJob?.status === 'PREVIEW_READY' &&
      Date.now() - this.visionBulkJob.createdAt <= 15 * 60 * 1000;
  }
  visionBulkStatusLabel(status: FashionVisionBulkJob['status']): string {
    return ({
      PREVIEW_READY: 'Anteprima pronta', QUEUED: 'In coda', RUNNING: 'In analisi',
      STOP_REQUESTED: 'Arresto richiesto', STOPPED: 'Arrestata',
      STOPPED_BUDGET: 'Arrestata per soglia', SUCCESS: 'Completata', FAILED: 'Interrotta',
    } as const)[status];
  }

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
        row.before.category !== (this.visionCategoryEdits[row.productId] ?? row.after.category) ||
        row.before.subcategory !== (this.visionSubcategoryEdits[row.productId] ?? row.after.subcategory) ||
        JSON.stringify(row.before.styles) !== JSON.stringify(this.visionStyleEdits[row.productId] ?? row.after.styles) ||
        JSON.stringify(row.before.seasons) !== JSON.stringify(this.visionSeasonEdits[row.productId] ?? row.after.seasons)
      );
    });
  }
  /** Keep the desktop merchant link; use the existing Core popup for smartphone image inspection. */
  openVisionImageOnMobile(event: MouseEvent, row: FashionVisionReviewRow): void {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 767.98px)').matches) return;
    event.preventDefault();
    if (!row.image) return;

    this.popupService.setNewPopUp(
      'fashion-vision-image-preview',
      'FashionVisionImagePreviewComponent',
      { image: row.image, name: row.name },
      900,
      undefined,
      undefined,
      false,
      true,
      row.name || 'Fotografia prodotto',
      'center',
      true,
    );
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
      this.visionCategoryEdits = {};
    }
    this.visionJob = job;
    for (const row of job?.rows || []) {
      if (!row.after) continue;
      if (!(row.productId in this.visionStyleEdits)) this.visionStyleEdits[row.productId] = [...row.after.styles];
      if (!(row.productId in this.visionSeasonEdits)) this.visionSeasonEdits[row.productId] = [...row.after.seasons];
      if (!(row.productId in this.visionSubcategoryEdits)) this.visionSubcategoryEdits[row.productId] = row.after.subcategory;
      if (!(row.productId in this.visionCategoryEdits)) this.visionCategoryEdits[row.productId] = row.after.category;
    }
  }

  visionRowSubcategories(row: FashionVisionReviewRow): Array<{ id: string; categoryName: string }> {
    const category = this.visionCategoryEdits[row.productId] ?? row.after?.category ?? row.before.category;
    return this.visionChildrenByCategory[category] ??
      (category === this.selectedVisionCategoryId ? this.visionSubcategories : []);
  }

  onVisionRowCategoryChanged(row: FashionVisionReviewRow): void {
    const category = this.visionCategoryEdits[row.productId] || row.before.category;
    // Never carry a child ID from the previous root into a newly selected root.
    this.visionSubcategoryEdits[row.productId] = '';
    if (this.visionChildrenByCategory[category] || this.visionLoadingChildren[category]) return;
    this.visionLoadingChildren[category] = true;
    this.service.getCurationCategories(category)
      .pipe(finalize(() => { delete this.visionLoadingChildren[category]; }))
      .subscribe({
        next: children => { this.visionChildrenByCategory[category] = children; },
        error: () => { this.visionError = 'Impossibile caricare le sottocategorie della categoria selezionata.'; },
      });
  }

  visionMissingDestinationChild(row: FashionVisionReviewRow): boolean {
    const category = this.visionCategoryEdits[row.productId] ?? row.after?.category ?? row.before.category;
    const child = this.visionSubcategoryEdits[row.productId] ?? row.after?.subcategory ?? '';
    return category !== row.before.category &&
      (!child || !this.visionRowSubcategories(row).some(option => option.id === child));
  }

  loadVisionBulkIssues(next = false): void {
    const category = this.selectedVisionCategoryId;
    if (!category || this.visionBulkIssuesBusy) return;
    const after = next ? this.visionBulkIssues?.nextCursor ?? undefined : undefined;
    if (next && !after) return;
    this.visionBulkIssuesBusy = true;
    this.service.getFashionVisionBulkIssues(category, after)
      .pipe(finalize(() => this.visionBulkIssuesBusy = false)).subscribe({
        next: page => {
          if (this.selectedVisionCategoryId !== category) return;
          this.visionBulkIssues = next && this.visionBulkIssues
            ? { rows: [...this.visionBulkIssues.rows, ...page.rows], nextCursor: page.nextCursor }
            : page;
        },
        error: () => { this.visionBulkError = 'Non riesco a caricare i prodotti saltati.'; },
      });
  }

  resumeVisionBulk(): void {
    const job = this.visionBulkJob;
    if (!job || !this.canManageAi || job.status !== 'FAILED' ||
      !job.lastError?.includes('INVALID_CLASSIFICATION') || this.visionBulkBusy) return;
    confirm([
      'Riprendere «' + job.categoryName + '» con il budget già autorizzato?',
      'Conserviamo i prodotti approvati e ignoriamo quello con risposta AI non valida.',
      'Nuove chiamate AI saranno fatturate entro la soglia preventiva residua, riservando costi incerti.',
    ].join('\n'), 'Riprendi analisi completa', (yes: boolean) => {
      if (!yes || this.visionBulkBusy) return;
      this.visionBulkBusy = true;
      this.visionBulkError = '';
      this.service.resumeFashionVisionBulk(job.categoryId, job.runId)
        .pipe(finalize(() => this.visionBulkBusy = false)).subscribe({
          next: updated => {
            this.visionBulkJob = updated;
            this.visionBulkNotice = 'Analisi ripresa: i risultati già approvati rimangono invariati.';
          },
          error: (error: { error?: { message?: string } }) => {
            this.visionBulkError = error.error?.message || 'Impossibile riprendere il job.';
          },
        });
    });
  }

  loadVisionBulkDeferred(next = false): void {
    const category = this.selectedVisionCategoryId;
    if (!category || this.visionBulkDeferredBusy) return;
    const after = next ? this.visionBulkDeferred?.nextCursor ?? undefined : undefined;
    if (next && !after) return;
    this.visionBulkDeferredBusy = true;
    this.service.getFashionVisionBulkDeferred(category, after)
      .pipe(finalize(() => this.visionBulkDeferredBusy = false)).subscribe({
        next: page => {
          if (this.selectedVisionCategoryId !== category) return;
          this.visionBulkDeferred = next && this.visionBulkDeferred
            ? { rows: [...this.visionBulkDeferred.rows, ...page.rows], nextCursor: page.nextCursor }
            : page;
        },
        error: () => { this.visionBulkError = 'Impossibile leggere i risultati da valutare.'; },
      });
  }

  refreshVisionBulk(): void {
    const category = this.selectedVisionCategoryId;
    if (!category || this.visionBulkBusy) return;
    this.visionBulkBusy = true;
    this.service.getFashionVisionBulk(category).pipe(finalize(() => this.visionBulkBusy = false)).subscribe({
      next: job => { if (this.selectedVisionCategoryId === category) this.visionBulkJob = job; },
      error: () => { this.visionBulkError = 'Impossibile caricare lo stato dell\u2019analisi completa.'; },
    });
  }

  prepareVisionBulk(): void {
    const category = this.selectedVisionCategoryId;
    if (!this.canManageAi || !category || !this.visionBulkEnabled || this.visionBulkBusy ||
      this.visionBusy || this.visionBulkRunning || this.visionRunning) return;
    this.visionBulkBusy = true;
    this.visionBulkError = '';
    this.visionBulkNotice = '';
    this.visionBulkDeferred = null;
    this.visionBulkIssues = null;
    this.visionBulkAccepted = false;
    this.service.prepareFashionVisionBulk(category).pipe(finalize(() => this.visionBulkBusy = false)).subscribe({
      next: job => {
        if (this.selectedVisionCategoryId !== category) return;
        this.visionBulkJob = job;
        this.visionBulkNotice = 'Anteprima gratuita pronta. Nessuna chiamata AI avviata.';
      },
      error: (error: { error?: { message?: string } }) => {
        this.visionBulkError = error.error?.message || 'Non è stato possibile preparare l\u2019analisi completa.';
      },
    });
  }

  confirmVisionBulk(): void {
    const job = this.visionBulkJob;
    if (!job || !this.canManageAi || !this.visionBulkAccepted || !this.visionBulkPreviewReady ||
      this.visionBulkBusy || !this.visionBulkEnabled || this.selectedVisionCategoryId !== job.categoryId) return;
    confirm([
      'Avviare la classificazione automatica per tutta la categoria «' + job.categoryName + '»?',
      'Soglia nominale richiesta: €10; limite operativo conservativo del backend: USD ' +
        job.maxBudgetUsd.toFixed(2) + '.',
      'I risultati HIGH conformi saranno APPROVATI AUTOMATICAMENTE e protetti dalla sincronizzazione.',
      'MEDIUM, LOW e prodotti fuori categoria NON saranno modificati.',
      'Il provider fattura in USD: cambio, costi Firebase e chiamate senza usage non sono garantiti nel tetto.',
    ].join('\n'), 'Autorizza analisi completa e approvazione automatica', (yes: boolean) => {
      if (!yes || this.visionBulkBusy || !this.visionBulkAccepted ||
        this.selectedVisionCategoryId !== job.categoryId) return;
      this.visionBulkBusy = true;
      this.visionBulkError = '';
      this.service.confirmFashionVisionBulk(job.categoryId, job.runId)
        .pipe(finalize(() => this.visionBulkBusy = false)).subscribe({
          next: updated => {
            this.visionBulkJob = updated;
            this.visionBulkAccepted = false;
            this.visionBulkNotice = 'Job asincrono avviato. Aggiorna lo stato per vedere i risultati.';
          },
          error: (error: { error?: { message?: string } }) => {
            this.visionBulkError = error.error?.message || 'Non è stato possibile avviare il lavoro.';
          },
        });
    });
  }

  stopVisionBulk(): void {
    const job = this.visionBulkJob;
    if (!job || !this.canManageAi || !this.visionBulkRunning || this.visionBulkBusy) return;
    confirm('Arrestare nuove analisi? Una chiamata già avviata potrebbe essere fatturata e completarsi.',
      'Interrompi analisi completa', (yes: boolean) => {
        if (!yes || this.visionBulkBusy) return;
        this.visionBulkBusy = true;
        this.service.stopFashionVisionBulk(job.categoryId, job.runId)
          .pipe(finalize(() => this.visionBulkBusy = false)).subscribe({
            next: updated => { this.visionBulkJob = updated; },
            error: () => { this.visionBulkError = 'Non è stato possibile richiedere l\u2019arresto.'; },
          });
      });
  }

  onVisionCategoryChanged(): void {
    this.visionJob = null;
    this.visionBulkJob = null;
    this.visionBulkAccepted = false;
    this.visionBulkDeferred = null;
    this.visionBulkIssues = null;
    this.visionBulkError = '';
    this.visionBulkNotice = '';
    this.visionAccepted = false;
    this.visionError = '';
    this.visionNotice = '';
    this.visionStyleEdits = {};
    this.visionSeasonEdits = {};
    this.visionSubcategoryEdits = {};
    this.visionCategoryEdits = {};
    this.visionSubcategories = [];
    this.visionChildrenByCategory = {};
    this.visionLoadingChildren = {};
    const category = this.selectedVisionCategoryId;
    if (!category) return;
    this.service.getCurationCategories(category).subscribe({
      next: children => {
        if (this.selectedVisionCategoryId === category) {
          this.visionSubcategories = children;
          this.visionChildrenByCategory[category] = children;
        }
      },
      error: () => { this.visionError = 'Impossibile caricare le sottocategorie disponibili.'; },
    });
    this.refreshVision();
    this.refreshVisionBulk();
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
    if (!this.canManageAi || !category || this.visionBusy || this.visionRunning || this.visionBulkRunning) return;
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
    if (!job || !this.canManageAi || !this.visionAccepted || !this.visionPreviewReady || this.visionBulkRunning ||
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
    if (action === 'APPROVE' && this.visionMissingDestinationChild(row)) {
      this.visionError = 'Se cambi categoria principale, seleziona una sottocategoria valida prima di approvare.';
      return;
    }
    const submit = () => {
      this.visionBusy = true;
      this.visionError = '';
      this.service.reviewFashionVisionProduct(job.categoryId, {
        runId: job.runId, productId: row.productId, action,
        ...(action === 'APPROVE' ? {
          styles: this.visionStyleEdits[row.productId] ?? row.after?.styles ?? [],
          seasons: this.visionSeasonEdits[row.productId] ?? row.after?.seasons ?? [],
          category: this.visionCategoryEdits[row.productId] ?? row.after?.category ?? row.before.category,
          subcategory: this.visionSubcategoryEdits[row.productId] ?? row.after?.subcategory ?? '',
        } : {}),
      }).pipe(finalize(() => this.visionBusy = false)).subscribe({
        next: updated => { this.acceptVisionJob(updated); this.visionNotice = action === 'APPROVE' ? 'Correzione approvata e registrata.' : 'Proposta rifiutata.'; },
        error: (err: { error?: { message?: string } }) => { this.visionError = err.error?.message || 'Prodotto cambiato o revisione non riuscita. Aggiorna lo stato.'; },
      });
    };
    if (action === 'REJECT') { submit(); return; }
    confirm('Applichi SOLO a questo prodotto la categoria principale, la sottocategoria, gli stili e le stagioni selezionati? Le modifiche vengono bloccate rispetto alle successive sincronizzazioni.', 'Approva classificazione', (approved: boolean) => {
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
    // Only the visual category review is exposed on this page.
    this.service.getCurationCategories().subscribe({
      next: roots => { this.visionCategories = roots; },
      error: () => { this.visionError = 'Impossibile caricare le categorie principali.'; },
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
