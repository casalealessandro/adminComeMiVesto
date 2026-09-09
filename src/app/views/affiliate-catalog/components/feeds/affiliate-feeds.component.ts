import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { DataGridComponent } from '../../../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../../../core/data-grid/models/data-grid.models';
import { alert } from '../../../../core/dialogs/ui-dialogs';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AuthService } from '../../../../services/auth.service';
import {
  AffiliateFeedFormContext,
  AffiliateFeedFormResult,
} from '../../forms/affiliate-feed-form-host.component';
import { AffiliateFeed, AffiliateProgram } from '../../models/affiliate-catalog.models';
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

export function buildAffiliateFeedColumns(canEdit: boolean): Colonne[] {
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

  if (canEdit) {
    columns.push({
      ...baseColumn('', 'Modifica', 72, 'campoButton'),
      button: {
        text: '',
        name: 'edit',
        event: 'edit',
        icon: 'mdi mdi-pencil-outline',
        hint: 'Modifica feed',
      },
    });
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

  private programNames = new Map<string, string>();

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
          this.programNames = new Map(programs.map((program) => [program.id, program.name]));
          this.applySearch();
        },
        error: () => {
          this.feeds = [];
          this.filteredFeeds = [];
          this.programs = [];
          this.gridRows = [];
          this.programNames.clear();
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
    return this.programNames.get(feed.affiliateProgramId) || feed.affiliateProgramId;
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

  gridAction(event: { name?: string; rowData?: AffiliateFeedGridRow }): void {
    if (event?.name === 'edit' && event.rowData) this.openEdit(event.rowData);
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
