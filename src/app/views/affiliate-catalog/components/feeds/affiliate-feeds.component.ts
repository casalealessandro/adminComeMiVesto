import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, interval, Subscription } from 'rxjs';
import { DataGridComponent } from '../../../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../../../core/data-grid/models/data-grid.models';
import { alert, confirm } from '../../../../core/dialogs/ui-dialogs';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AuthService } from '../../../../services/auth.service';
import {
  AffiliateFeedFormContext,
  AffiliateFeedFormResult,
} from '../../forms/affiliate-feed-form-host.component';
import {
  AffiliateFeed,
  AffiliateFeedCleanupJob,
  AffiliateFeedCleanupMode,
  AffiliateProgram,
  AffiliateSyncRun,
} from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';

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

export interface AffiliateFeedGridRow extends AffiliateFeed {
  enabledLabel: string;
  programName: string;
  adapterTypeLabel: string;
}

export interface AffiliateFeedSyncNotice {
  feedName: string;
  run: AffiliateSyncRun;
}

export function affiliateCleanupIsActive(job: AffiliateFeedCleanupJob): boolean {
  return job.status === 'QUEUED' || job.status === 'PREVIEWING' ||
    job.status === 'RUNNING' || job.status === 'STOP_REQUESTED';
}

export function affiliateCleanupCanStop(job: AffiliateFeedCleanupJob): boolean {
  return job.status === 'QUEUED' || job.status === 'PREVIEWING' || job.status === 'RUNNING';
}

export function affiliateCleanupHasOldProgress(job: AffiliateFeedCleanupJob, now = Date.now()): boolean {
  // This is a warning only. Lack of progress does not prove that the worker has finished.
  return job.status === 'RUNNING' && now - job.updatedAt >= 35 * 60 * 1000;
}

export function affiliateFeedSyncEligibility(
  feed: AffiliateFeed,
  program?: AffiliateProgram,
): string | null {
  if (!feed.enabled) return 'Il feed è disabilitato.';
  if (!program) return 'Il programma affiliato associato non è disponibile.';
  if (!program.enabled) return 'Il programma affiliato è disabilitato.';
  if (program.networkStatus !== 'ACTIVE') return 'Il programma affiliato non è attivo sul network.';
  return null;
}

export function affiliateFeedSyncErrorMessage(status?: number): string {
  if (status === 400) return 'La richiesta di sincronizzazione non è valida.';
  if (status === 401 || status === 403) return 'Non sei autorizzato ad avviare la sincronizzazione.';
  if (status === 404) return 'Il feed affiliato non è più disponibile.';
  if (status === 409) {
    return 'La sincronizzazione non può partire: il feed non è eleggibile oppure esiste già una sincronizzazione attiva.';
  }
  if (status === 0) return 'Backend non raggiungibile. Riprova quando la connessione è disponibile.';
  return 'Avvio della sincronizzazione non riuscito.';
}

export function buildAffiliateFeedColumns(canManage: boolean): Colonne[] {
  const columns: ColData[] = [
    baseColumn('name', 'Nome', 190),
    baseColumn('programName', 'Programma', 190),
    baseColumn('networkFeedId', 'Network Feed ID', 150),
    baseColumn('enabledLabel', 'Abilitato', 90),
    baseColumn('adapterTypeLabel', 'Adapter', 130),
    baseColumn('readMode', 'Lettura', 115),
    baseColumn('locale', 'Locale', 85),
    baseColumn('market', 'Mercato', 80),
    baseColumn('lastSuccessfulSyncAt', 'Ultimo sync OK', 135, 'campoDateTime'),
    baseColumn('updatedAt', 'Aggiornato', 135, 'campoDateTime'),
  ];

  if (canManage) {
    columns.push(
      {
        ...baseColumn('', 'Sync', 72, 'campoButton'),
        button: {
          text: '',
          name: 'sync',
          event: 'sync',
          icon: 'mdi mdi-sync',
          hint: 'Avvia sincronizzazione',
        },
      },
      {
        ...baseColumn('', 'Mapping', 82, 'campoButton'),
        button: {
          text: '',
          name: 'mapping',
          event: 'mapping',
          icon: 'mdi mdi-tune-variant',
          hint: 'Configura mapping feed',
        },
      },
      {
        ...baseColumn('', 'Disattiva', 82, 'campoButton'),
        button: {
          text: '',
          name: 'deactivate-products',
          event: 'deactivate-products',
          icon: 'mdi mdi-package-variant-remove',
          hint: 'Disattiva prodotti del feed',
        },
      },
      {
        ...baseColumn('', 'Elimina prodotti', 94, 'campoButton'),
        button: {
          text: '',
          name: 'delete-products',
          event: 'delete-products',
          icon: 'mdi mdi-delete-sweep-outline',
          hint: 'Elimina i prodotti non utilizzati negli outfit senza cambiare lo stato del feed',
        },
      },
      {
        ...baseColumn('', 'Elimina feed', 90, 'campoButton'),
        button: {
          text: '',
          name: 'delete-feed',
          event: 'delete-feed',
          icon: 'mdi mdi-delete-forever-outline',
          hint: 'Elimina il feed e i prodotti non protetti',
        },
      },
      {
        ...baseColumn('', 'Modifica', 72, 'campoButton'),
        button: {
          text: '',
          name: 'edit',
          event: 'edit',
          icon: 'mdi mdi-pencil-outline',
          hint: 'Modifica feed',
        },
      },
    );
  }

  return [{ itemType: 'group', groupDataField: '', data: columns }];
}

@Component({
  selector: 'app-affiliate-feeds',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './affiliate-feeds.component.html',
  styleUrl: './affiliate-feeds.component.scss',
})
export class AffiliateFeedsComponent implements OnInit, OnDestroy {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);
  private readonly popupService = inject(PopUpService);
  readonly auth = inject(AuthService);

  feeds: AffiliateFeed[] = [];
  filteredFeeds: AffiliateFeed[] = [];
  programs: AffiliateProgram[] = [];
  gridRows: AffiliateFeedGridRow[] = [];
  columns: Colonne[] = [];
  search = '';
  loading = false;
  error = '';
  syncError = '';
  syncNotice: AffiliateFeedSyncNotice | null = null;
  deactivationNotice: { feedName: string } | null = null;
  readonly syncingFeedIds = new Set<string>();
  readonly deactivatingFeedIds = new Set<string>();
  readonly cleaningFeedIds = new Set<string>();
  readonly stoppingFeedIds = new Set<string>();
  cleanupNotice: { feed: AffiliateFeed; job: AffiliateFeedCleanupJob } | null = null;
  cleanupJobs: AffiliateFeedCleanupJob[] = [];
  visibleCleanupJobs: AffiliateFeedCleanupJob[] = [];
  cleanupJobsLoading = false;
  cleanupJobsError = '';
  private cleanupPolling?: Subscription;

  private programsById = new Map<string, AffiliateProgram>();

  ngOnInit(): void {
    this.columns = buildAffiliateFeedColumns(this.auth.isAdmin());
    this.refresh();
    this.cleanupPolling = interval(10000).subscribe(() => {
      if (this.cleanupJobs.some((job) => this.isCleanupActive(job))) this.loadCleanupJobs();
    });
  }

  ngOnDestroy(): void {
    this.cleanupPolling?.unsubscribe();
  }

  isCleanupActive(job: AffiliateFeedCleanupJob): boolean {
    return affiliateCleanupIsActive(job);
  }

  canStopCleanup(job: AffiliateFeedCleanupJob): boolean {
    return this.auth.isAdmin() && affiliateCleanupCanStop(job);
  }

  isStoppingCleanup(feedId: string): boolean {
    return this.stoppingFeedIds.has(feedId);
  }

  hasOldCleanupProgress(job: AffiliateFeedCleanupJob): boolean {
    return affiliateCleanupHasOldProgress(job);
  }

  requestStopCleanup(job: AffiliateFeedCleanupJob): void {
    if (!this.canStopCleanup(job) || this.isStoppingCleanup(job.feedId)) return;
    confirm(
      'Interrompere la pulizia del feed «' + this.cleanupFeedName(job.feedId) +
      '»? I prodotti già eliminati non verranno ripristinati. Il blocco già avviato può ancora terminare; il feed manterrà il suo stato attuale.',
      'Interrompi eliminazione',
      (accepted) => { if (accepted) this.stopCleanup(job); },
    );
  }

  private stopCleanup(job: AffiliateFeedCleanupJob): void {
    if (!this.canStopCleanup(job) || this.isStoppingCleanup(job.feedId)) return;
    this.stoppingFeedIds.add(job.feedId);
    this.affiliateCatalogService.stopFeedCleanup(job.feedId, job.runId)
      .pipe(finalize(() => this.stoppingFeedIds.delete(job.feedId)))
      .subscribe({
        next: (updated) => {
          this.cleanupJobs = this.cleanupJobs.map((current) =>
            current.feedId === updated.feedId ? updated : current);
          this.visibleCleanupJobs = this.visibleCleanupJobs.map((current) =>
            current.feedId === updated.feedId ? updated : current);
          if (this.cleanupNotice?.feed.id === updated.feedId) {
            this.cleanupNotice = { ...this.cleanupNotice, job: updated };
          }
          this.loadCleanupJobs();
        },
        error: (error: { status?: number }) => {
          if (error?.status === 409) {
            this.loadCleanupJobs();
          } else {
            this.cleanupJobsError = 'Impossibile richiedere l’interruzione. Riprova.';
          }
        },
      });
  }

  cleanupFeedName(feedId: string): string {
    return this.feeds.find((feed) => feed.id === feedId)?.name ?? feedId;
  }

  loadCleanupJobs(): void {
    if (this.cleanupJobsLoading) return;
    this.cleanupJobsLoading = true;
    this.cleanupJobsError = '';
    this.affiliateCatalogService.getFeedCleanupJobs()
      .pipe(finalize(() => this.cleanupJobsLoading = false))
      .subscribe({
        next: (jobs) => {
          this.cleanupJobs = jobs;
          const recentCutoff = Date.now() - 60 * 60 * 1000;
          this.visibleCleanupJobs = jobs
            .filter((job) => this.isCleanupActive(job) || (job.updatedAt ?? 0) >= recentCutoff)
            .sort((a, b) => Number(this.isCleanupActive(b)) - Number(this.isCleanupActive(a))
              || b.updatedAt - a.updatedAt);
        },
        error: () => {
          this.cleanupJobsError = 'Impossibile aggiornare le operazioni di pulizia.';
        },
      });
  }

  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    this.loadCleanupJobs();

    forkJoin({
      feeds: this.affiliateCatalogService.getFeeds(),
      programs: this.affiliateCatalogService.getPrograms(),
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ feeds, programs }) => {
          this.feeds = feeds;
          this.programs = programs;
          this.programsById = new Map(programs.map((program) => [program.id, program]));
          this.applySearch();
        },
        error: () => {
          this.feeds = [];
          this.filteredFeeds = [];
          this.programs = [];
          this.gridRows = [];
          this.programsById.clear();
          this.error = 'Impossibile caricare i feed affiliati.';
        },
      });
  }

  applySearch(): void {
    const term = this.search.trim().toLowerCase();
    this.filteredFeeds = !term
      ? [...this.feeds]
      : this.feeds.filter((feed) => [
          feed.name,
          feed.networkFeedId,
          this.programName(feed),
          feed.adapterType,
          feed.readMode,
          feed.locale,
          feed.market,
        ].some((value) => String(value ?? '').toLowerCase().includes(term)));

    this.gridRows = this.filteredFeeds.map((feed) => ({
      ...feed,
      enabledLabel: feed.enabled ? 'Sì' : 'No',
      programName: this.programName(feed),
      adapterTypeLabel: feed.adapterType || 'Predefinito programma',
    }));
  }

  programName(feed: AffiliateFeed): string {
    return this.programsById.get(feed.affiliateProgramId)?.name || feed.affiliateProgramId;
  }

  isSyncing(feedId: string): boolean {
    return this.syncingFeedIds.has(feedId);
  }

  isDeactivating(feedId: string): boolean {
    return this.deactivatingFeedIds.has(feedId);
  }

  isCleaning(feedId: string): boolean {
    return this.cleaningFeedIds.has(feedId);
  }

  cleanupModeLabel(mode: AffiliateFeedCleanupMode): string {
    return mode === 'PRODUCTS_ONLY' ? 'Elimina prodotti' : 'Elimina feed e prodotti';
  }

  cleanupStatusLabel(status: AffiliateFeedCleanupJob['status']): string {
    return {
      QUEUED: 'In coda', PREVIEWING: 'Verifica in corso',
      PREVIEW_READY: 'Verifica pronta', RUNNING: 'Cancellazione in corso',
      STOP_REQUESTED: 'Interruzione richiesta', STOPPED: 'Interrotta',
      SUCCESS: 'Completata', FAILED: 'Errore',
    }[status];
  }

  openCreate(): void {
    if (!this.auth.isAdmin()) return;
    if (!this.programs.length) {
      alert('Crea prima almeno un programma affiliato.', 'Programma richiesto');
      return;
    }
    this.openForm({ mode: 'create' });
  }

  openEdit(feed: AffiliateFeed): void {
    if (!this.auth.isAdmin() || !feed?.id) return;
    this.openForm({
      mode: 'edit',
      feed,
      programName: this.programName(feed),
    });
  }

  openMapping(feed: AffiliateFeed): void {
    if (!this.auth.isAdmin() || !feed?.id) return;
    this.openForm({
      mode: 'edit',
      feed,
      programName: this.programName(feed),
      startInMapping: true,
    });
  }

  requestSync(feed: AffiliateFeed): void {
    if (!this.auth.isAdmin() || !feed?.id || this.isSyncing(feed.id) || this.isDeactivating(feed.id) || this.isCleaning(feed.id)) return;

    const eligibilityError = affiliateFeedSyncEligibility(
      feed,
      this.programsById.get(feed.affiliateProgramId),
    );
    if (eligibilityError) {
      alert(eligibilityError, 'Sincronizzazione non disponibile');
      return;
    }

    confirm(
      'Avviare la sincronizzazione di questo feed? Il processo verrà accodato ed eseguito dal backend.',
      'Avvia sincronizzazione',
      (confirmed) => {
        if (confirmed) this.startSync(feed);
      },
    );
  }

  gridAction(event: { name?: string; rowData?: AffiliateFeedGridRow }): void {
    if (!event?.rowData) return;
    if (event.name === 'sync') {
      this.requestSync(event.rowData);
      return;
    }
    if (event.name === 'mapping') {
      this.openMapping(event.rowData);
      return;
    }
    if (event.name === 'deactivate-products') {
      this.requestDeactivateProducts(event.rowData);
      return;
    }
    if (event.name === 'delete-products') {
      this.requestCleanup(event.rowData, 'PRODUCTS_ONLY');
      return;
    }
    if (event.name === 'delete-feed') {
      this.requestCleanup(event.rowData, 'FEED_AND_PRODUCTS');
      return;
    }
    if (event.name === 'edit') this.openEdit(event.rowData);
  }

  requestCleanup(feed: AffiliateFeed, mode: AffiliateFeedCleanupMode): void {
    if (!this.auth.isAdmin() || !feed?.id ||
      this.isSyncing(feed.id) || this.isDeactivating(feed.id) || this.isCleaning(feed.id)) return;

    if (mode === 'PRODUCTS_ONLY') {
      confirm(
        'Eliminare i prodotti di questo feed? I prodotti usati in qualsiasi outfit saranno conservati. Il feed manterrà il suo stato attuale.',
        'Conferma eliminazione prodotti',
        (confirmed) => { if (confirmed) this.startDirectProductsCleanup(feed); },
      );
      return;
    }

    this.cleaningFeedIds.add(feed.id);
    this.syncError = '';
    this.affiliateCatalogService.getFeedCleanupStatus(feed.id)
      .pipe(finalize(() => this.cleaningFeedIds.delete(feed.id)))
      .subscribe({
        next: (job) => {
          if (job) this.cleanupNotice = { feed, job };
          if (job && (job.status === 'QUEUED' || job.status === 'PREVIEWING' || job.status === 'RUNNING')) {
            alert(
              'Operazione ancora in corso. Puoi chiudere il browser e ricontrollare più tardi.',
              this.cleanupModeLabel(job.mode),
            );
            return;
          }
          if (job?.status === 'PREVIEW_READY' && job.mode === mode &&
              job.previewAt !== null && Date.now() - job.previewAt <= 15 * 60 * 1000) {
            this.confirmCleanupImpact(feed, job);
            return;
          }
          if (job?.status === 'SUCCESS' && job.mode === mode && mode === 'FEED_AND_PRODUCTS') {
            this.refresh();
            alert(
              'Feed e prodotti non protetti eliminati. La lista verrà aggiornata.',
              'Cancellazione completata',
            );
            return;
          }
          confirm(
            'Verificare quanti prodotti e offerte possono essere eliminati insieme alla configurazione del feed? I prodotti presenti negli outfit saranno conservati.',
            'Verifica prima di eliminare',
            (confirmed) => { if (confirmed) this.startCleanupPreview(feed, mode); },
          );
        },
        error: () => { this.syncError = 'Impossibile verificare lo stato della cancellazione del feed.'; },
      });
  }

  private startDirectProductsCleanup(feed: AffiliateFeed): void {
    if (this.isCleaning(feed.id)) return;
    this.cleaningFeedIds.add(feed.id);
    this.syncError = '';
    this.affiliateCatalogService.startFeedProductsCleanup(feed.id)
      .pipe(finalize(() => this.cleaningFeedIds.delete(feed.id)))
      .subscribe({
        next: (job) => {
          this.cleanupNotice = null;
          this.cleanupJobs = [...this.cleanupJobs.filter((existing) => existing.feedId !== feed.id), job];
          this.visibleCleanupJobs = [job, ...this.visibleCleanupJobs.filter((existing) => existing.feedId !== feed.id)];
          this.loadCleanupJobs();
          alert('Eliminazione prodotti avviata in background. Il feed non verrà disabilitato.', 'Pulizia avviata');
        },
        error: (error: { status?: number }) => {
          this.syncError = error?.status === 409
            ? 'Sincronizzazione o pulizia già in corso: riprova al termine.'
            : 'Impossibile avviare la pulizia dei prodotti.';
        },
      });
  }

  private startCleanupPreview(feed: AffiliateFeed, mode: AffiliateFeedCleanupMode): void {
    if (this.isCleaning(feed.id)) return;
    this.cleaningFeedIds.add(feed.id);
    this.affiliateCatalogService.previewFeedCleanup(feed.id, mode)
      .pipe(finalize(() => this.cleaningFeedIds.delete(feed.id)))
      .subscribe({
        next: (job) => {
          this.cleanupNotice = { feed, job };
          alert(
            'Verifica avviata in background, senza cancellare dati. Quando è pronta, premi «Controlla verifica» per vedere numeri e confermare.',
            'Verifica avviata',
          );
        },
        error: (error: { status?: number }) => {
          this.syncError = error?.status === 409
            ? 'Verifica o sincronizzazione già in corso: riprova dopo il completamento.'
            : 'Impossibile avviare la verifica preliminare.';
        },
      });
  }

  checkCleanupNotice(): void {
    if (!this.cleanupNotice) return;
    const { feed, job } = this.cleanupNotice;
    if (job.mode === 'PRODUCTS_ONLY') {
      this.cleaningFeedIds.add(feed.id);
      this.affiliateCatalogService.getFeedCleanupStatus(feed.id)
        .pipe(finalize(() => this.cleaningFeedIds.delete(feed.id)))
        .subscribe({
          next: (updated) => { if (updated) this.cleanupNotice = { feed, job: updated }; this.refresh(); },
          error: () => { this.syncError = 'Impossibile aggiornare lo stato della pulizia.'; },
        });
      return;
    }
    this.requestCleanup(feed, job.mode);
  }

  private confirmCleanupImpact(feed: AffiliateFeed, job: AffiliateFeedCleanupJob): void {
    if (!job.preview) {
      this.syncError = 'Anteprima incompleta. Ripetere la verifica.';
      return;
    }
    const impact = job.preview;
    const examples = impact.outfitExamples.map((outfit) =>
      '• ' + (outfit.title || 'Outfit senza titolo') + ' (' + outfit.id + ')').join('\n');
    const report = [
      'Feed: ' + feed.name,
      'Offerte che verranno eliminate: ' + impact.offers,
      'Prodotti coinvolti: ' + impact.productsAffected,
      'Prodotti da cancellare: ' + impact.productsToDelete,
      'Prodotti da conservare perché presenti in outfit approvati: ' + impact.productsPreservedForOutfits,
      'Prodotti condivisi con altri feed da conservare: ' + impact.productsPreservedForOtherFeeds,
      'Outfit approvati coinvolti: ' + impact.approvedOutfitsAffected,
      examples ? '\nEsempi outfit conservati:\n' + examples : '',
      job.mode === 'PRODUCTS_ONLY'
        ? '\nIl feed rimarrà configurato ma disabilitato.'
        : '\nVerrà eliminata anche la configurazione del feed.',
      '\nL’operazione è irreversibile. Nessun outfit approvato verrà eliminato.',
      '\nCONFERMI LA CANCELLAZIONE?',
    ].filter(Boolean).join('\n');

    confirm(report, this.cleanupModeLabel(job.mode), (confirmed) => {
      if (confirmed) this.confirmCleanup(feed, job);
    });
  }

  private confirmCleanup(feed: AffiliateFeed, job: AffiliateFeedCleanupJob): void {
    if (this.isCleaning(feed.id)) return;
    this.cleaningFeedIds.add(feed.id);
    this.syncError = '';
    this.affiliateCatalogService.confirmFeedCleanup(feed.id, job.mode, job.runId)
      .pipe(finalize(() => this.cleaningFeedIds.delete(feed.id)))
      .subscribe({
        next: (running) => {
          this.cleanupNotice = { feed, job: running };
          alert('Cancellazione accodata sul backend. Puoi chiudere la pagina e controllare più tardi.',
            'Cancellazione avviata');
        },
        error: (error: { status?: number }) => {
          this.syncError = error?.status === 409
            ? 'Il feed è cambiato o la verifica è scaduta. Esegui una nuova anteprima prima di cancellare.'
            : 'Non è stato possibile avviare la cancellazione.';
        },
      });
  }

  requestDeactivateProducts(feed: AffiliateFeed): void {
    if (!this.auth.isAdmin() || !feed?.id || this.isDeactivating(feed.id) || this.isSyncing(feed.id)) return;

    confirm(
      'Prima verrà eseguita una verifica senza modifiche. Vuoi analizzare prodotti, offerte e outfit collegati a questo feed?',
      'Verifica disattivazione feed',
      (confirmed) => {
        if (confirmed) this.runDeactivationDryRun(feed);
      },
    );
  }

  private runDeactivationDryRun(feed: AffiliateFeed): void {
    this.deactivationNotice = null;
    this.syncError = '';
    this.deactivatingFeedIds.add(feed.id);

    this.affiliateCatalogService
      .deactivateFeedProductsDryRun(feed.id)
      .pipe(finalize(() => this.deactivatingFeedIds.delete(feed.id)))
      .subscribe({
        next: (report) => {
          const outfitPreview = report.outfits
            .slice(0, 10)
            .map((outfit) => `• ${outfit.title || 'Outfit senza titolo'} (${outfit.outfitId})`)
            .join('\n');
          const details = [
            `Offerte trovate: ${report.offersFound}`,
            `Offerte attive da disattivare: ${report.activeOffersFound}`,
            `Prodotti coinvolti: ${report.productsAffected}`,
            `Prodotti che verranno disattivati: ${report.productsToDeactivate}`,
            `Prodotti che resteranno attivi tramite altre offerte: ${report.productsRemainingActive}`,
            `Outfit coinvolti: ${report.outfitsAffected}`,
            outfitPreview ? `\nOutfit rilevati:\n${outfitPreview}` : '',
            report.outfitsAffected > 10 || report.outfitsTruncated
              ? '\nElenco parziale: il report completo resta disponibile nella risposta API.'
              : '',
          ].filter(Boolean).join('\n');

          confirm(
            `${details}\n\nConfermi la disattivazione? Gli outfit NON verranno modificati.`,
            'Conferma disattivazione prodotti',
            (confirmed) => {
              if (confirmed) this.applyFeedDeactivation(feed);
            },
          );
        },
        error: () => {
          this.syncError = 'Impossibile verificare l’impatto della disattivazione del feed.';
        },
      });
  }

  private applyFeedDeactivation(feed: AffiliateFeed): void {
    this.deactivationNotice = null;
    this.syncError = '';
    this.deactivatingFeedIds.add(feed.id);

    this.affiliateCatalogService
      .queueFeedProductDeactivation(feed.id)
      .pipe(finalize(() => this.deactivatingFeedIds.delete(feed.id)))
      .subscribe({
        next: () => {
          this.deactivationNotice = { feedName: feed.name };
          alert(
            'Disattivazione avviata in background. Puoi continuare a lavorare: il processo proseguirà lato backend.',
            'Disattivazione avviata',
          );
        },
        error: () => {
          this.syncError = 'Impossibile accodare la disattivazione dei prodotti del feed.';
        },
      });
  }

  private startSync(feed: AffiliateFeed): void {
    if (this.isSyncing(feed.id)) return;

    this.syncError = '';
    this.syncNotice = null;
    this.syncingFeedIds.add(feed.id);

    this.affiliateCatalogService
      .syncFeed(feed.id)
      .pipe(finalize(() => this.syncingFeedIds.delete(feed.id)))
      .subscribe({
        next: (run) => {
          this.syncNotice = { feedName: feed.name, run };
        },
        error: (error: { status?: number }) => {
          this.syncError = affiliateFeedSyncErrorMessage(error?.status);
        },
      });
  }

  private openForm(context: AffiliateFeedFormContext): void {
    const guid = `affiliate-feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = context.startInMapping
      ? 'Configura mapping feed'
      : context.mode === 'edit'
        ? 'Modifica feed affiliato'
        : 'Nuovo feed affiliato';

    this.popupService.setNewPopUp(
      guid,
      'AffiliateFeedFormHostComponent',
      context,
      760,
      undefined,
      undefined,
      false,
      true,
      title,
      'center',
      false,
    );

    void this.popupService.getOutputComponent(guid).then((result: AffiliateFeedFormResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      if (result?.name !== 'saved') return;
      this.refresh();
      alert(
        context.startInMapping
          ? 'Mapping del feed aggiornato.'
          : context.mode === 'edit'
            ? 'Feed affiliato aggiornato.'
            : 'Feed affiliato creato.',
        'Operazione completata',
      );
    });
  }
}
