import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { ColData, Colonne } from '../../core/data-grid/models/data-grid.models';
import { alert, confirm } from '../../core/dialogs/ui-dialogs';
import { PopUpService } from '../../core/popup/popup.service';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import {
  StaticPageFormContext,
  StaticPageFormResult,
} from './forms/static-page-form-host.component';
import { StaticPage } from './models/static-page.models';
import { StaticPageService } from './services/static-page.service';

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

export function buildStaticPageColumns(): Colonne[] {
  const columns: ColData[] = [
    baseColumn('title', 'Titolo', 260),
    baseColumn('slug', 'Slug', 190),
    baseColumn('version', 'Versione', 100),
    baseColumn('updatedAt', 'Aggiornata', 160, 'campoDateTime'),
    {
      ...baseColumn('', 'Modifica', 72, 'campoButton'),
      button: {
        text: '',
        name: 'edit',
        event: 'edit',
        icon: 'mdi mdi-pencil-outline',
        hint: 'Modifica pagina',
      },
    },
    {
      ...baseColumn('', 'Elimina', 72, 'campoButton'),
      button: {
        text: '',
        name: 'delete',
        event: 'delete',
        icon: 'mdi mdi-delete-outline',
        hint: 'Elimina pagina',
      },
    },
  ];

  return [{ itemType: 'group', groupDataField: '', data: columns }];
}

@Component({
  selector: 'app-static-pages',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent, AnagraficaWrapperComponent],
  templateUrl: './static-pages.component.html',
  styleUrl: './static-pages.component.scss',
})
export class StaticPagesComponent implements OnInit {
  private readonly staticPageService = inject(StaticPageService);
  private readonly popupService = inject(PopUpService);

  pages: StaticPage[] = [];
  filteredPages: StaticPage[] = [];
  columns: Colonne[] = buildStaticPageColumns();
  search = '';
  loading = false;
  deletingId = '';
  error = '';
  readonly subtitle = `Gestisci i contenuti statici utilizzati dall'app ComeMiVesto, come Privacy Policy e Termini e Condizioni.`;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';

    this.staticPageService
      .getPages()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (pages) => {
          this.pages = pages;
          this.applySearch();
        },
        error: () => {
          this.pages = [];
          this.filteredPages = [];
          this.error = 'Impossibile caricare le pagine statiche.';
        },
      });
  }

  applySearch(): void {
    const term = this.search.trim().toLowerCase();
    this.filteredPages = !term
      ? [...this.pages]
      : this.pages.filter((page) => [page.title, page.slug]
          .some((value) => value.toLowerCase().includes(term)));
  }

  openCreate(): void {
    this.openForm({ mode: 'create' });
  }

  eventToolbarStaticPages(event: { name?: string; id?: string }): void {
    const name = event?.name || event?.id;
    if (name === 'addButton') this.openCreate();
  }

  openEdit(page: StaticPage): void {
    if (!page?.id) return;
    this.openForm({ mode: 'edit', page });
  }

  gridAction(event: { name?: string; rowData?: StaticPage }): void {
    if (!event?.rowData) return;
    if (event.name === 'edit') this.openEdit(event.rowData);
    if (event.name === 'delete') this.deletePage(event.rowData);
  }

  deletePage(page: StaticPage): void {
    if (!page?.id || this.deletingId) return;

    confirm(
      `Eliminare la pagina “${page.title}”?`,
      'Conferma eliminazione',
      (confirmed) => {
        if (!confirmed) return;
        this.deletingId = page.id;
        this.error = '';

        this.staticPageService
          .deletePage(page.id)
          .pipe(finalize(() => this.deletingId = ''))
          .subscribe({
            next: () => {
              this.pages = this.pages.filter((item) => item.id !== page.id);
              this.applySearch();
              alert('Pagina eliminata.', 'Operazione completata');
            },
            error: () => this.error = 'Impossibile eliminare la pagina.',
          });
      },
    );
  }

  private openForm(context: StaticPageFormContext): void {
    const guid = `static-page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = context.mode === 'edit' ? 'Modifica pagina statica' : 'Nuova pagina statica';

    this.popupService.setNewPopUp(
      guid,
      'StaticPageFormHostComponent',
      context,
      820,
      undefined,
      undefined,
      false,
      true,
      title,
      'center',
      false,
    );

    void this.popupService.getOutputComponent(guid).then((result: StaticPageFormResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      if (result?.name !== 'saved') return;
      this.refresh();
      alert(
        context.mode === 'edit' ? 'Pagina aggiornata.' : 'Pagina creata.',
        'Operazione completata',
      );
    });
  }
}
