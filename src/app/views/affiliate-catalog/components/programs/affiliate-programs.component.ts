import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DataGridComponent } from '../../../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../../../core/data-grid/models/data-grid.models';
import { AuthService } from '../../../../services/auth.service';
import { PopUpService } from '../../../../core/popup/popup.service';
import { alert } from '../../../../core/dialogs/ui-dialogs';
import {
  AffiliateProgramFormContext,
  AffiliateProgramFormResult,
} from '../../forms/affiliate-program-form-host.component';
import { AffiliateProgram } from '../../models/affiliate-catalog.models';
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

export interface AffiliateProgramGridRow extends AffiliateProgram {
  enabledLabel: string;
}

export function buildAffiliateProgramColumns(canEdit: boolean): Colonne[] {
  const columns: ColData[] = [
    baseColumn('name', 'Nome', 220),
    baseColumn('network', 'Network', 130),
    baseColumn('networkProgramId', 'Network Program ID', 165),
    baseColumn('networkStatus', 'Stato network', 115),
    baseColumn('enabledLabel', 'Abilitato', 90),
    baseColumn('defaultAdapterType', 'Adapter', 135),
    baseColumn('market', 'Mercato', 80),
    baseColumn('currency', 'Valuta', 75),
    baseColumn('priceSegment', 'Fascia prezzo', 110),
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
        hint: 'Modifica programma',
      },
    });
  }

  return [{ itemType: 'group', groupDataField: '', data: columns }];
}

export function buildAffiliateProgramGridRows(programs: AffiliateProgram[]): AffiliateProgramGridRow[] {
  return programs.map((program) => ({
    ...program,
    enabledLabel: program.enabled ? 'Sì' : 'No',
  }));
}

@Component({
  selector: 'app-affiliate-programs',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './affiliate-programs.component.html',
  styleUrl: './affiliate-programs.component.scss',
})
export class AffiliateProgramsComponent implements OnInit {
  private readonly affiliateCatalogService = inject(AffiliateCatalogService);
  private readonly popupService = inject(PopUpService);
  readonly auth = inject(AuthService);

  programs: AffiliateProgram[] = [];
  filteredPrograms: AffiliateProgram[] = [];
  gridRows: AffiliateProgramGridRow[] = [];
  columns: Colonne[] = [];
  search = '';
  loading = false;
  error = '';

  ngOnInit(): void {
    this.columns = buildAffiliateProgramColumns(this.auth.isAdmin());
    this.refresh();
  }

  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';

    this.affiliateCatalogService
      .getPrograms()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (programs) => {
          this.programs = programs;
          this.applySearch();
        },
        error: () => {
          this.programs = [];
          this.filteredPrograms = [];
          this.gridRows = [];
          this.error = 'Impossibile caricare i programmi affiliati.';
        },
      });
  }

  applySearch(): void {
    const term = this.search.trim().toLowerCase();
    this.filteredPrograms = !term
      ? [...this.programs]
      : this.programs.filter((program) => [
          program.name,
          program.network,
          program.networkProgramId,
          program.networkStatus,
          program.market,
          program.currency,
          program.priceSegment,
          program.defaultAdapterType,
        ].some((value) => value.toLowerCase().includes(term)));

    this.gridRows = buildAffiliateProgramGridRows(this.filteredPrograms);
  }

  openCreate(): void {
    if (!this.auth.isAdmin()) return;
    this.openForm({ mode: 'create' });
  }

  openEdit(program: AffiliateProgram): void {
    if (!this.auth.isAdmin() || !program?.id) return;
    this.openForm({ mode: 'edit', program });
  }

  gridAction(event: { name?: string; rowData?: AffiliateProgramGridRow }): void {
    if (event?.name === 'edit' && event.rowData) this.openEdit(event.rowData);
  }

  private openForm(context: AffiliateProgramFormContext): void {
    const guid = `affiliate-program-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = context.mode === 'edit' ? 'Modifica programma affiliato' : 'Nuovo programma affiliato';

    this.popupService.setNewPopUp(
      guid,
      'AffiliateProgramFormHostComponent',
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

    void this.popupService.getOutputComponent(guid).then((result: AffiliateProgramFormResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      if (result?.name !== 'saved') return;
      this.refresh();
      alert(
        context.mode === 'edit' ? 'Programma affiliato aggiornato.' : 'Programma affiliato creato.',
        'Operazione completata',
      );
    });
  }
}
