import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
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
export class AffiliateFeedsComponent implements OnInit {
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
  readonly syncingFeedIds = new Set<string>();

  private programsById = new Map<string, AffiliateProgram>();

  ngOnInit(): void {
    this.columns = buildAffiliateFeedColumns(this.auth.isAdmin());
    this.refresh();
  }

  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';

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

  requestSync(feed: AffiliateFeed): void {
    if (!this.auth.isAdmin() || !feed?.id || this.isSyncing(feed.id)) return;

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
    if (event.name === 'edit') this.openEdit(event.rowData);
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
    const title = context.mode === 'edit' ? 'Modifica feed affiliato' : 'Nuovo feed affiliato';

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
        context.mode === 'edit' ? 'Feed affiliato aggiornato.' : 'Feed affiliato creato.',
        'Operazione completata',
      );
    });
  }
}
