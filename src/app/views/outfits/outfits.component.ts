import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { GridDataProvider, GridLoadRequest, GridPage } from '../../components/data-grid/data-grid-provider';
import { Colonne, ColData } from '../../interface/app.interface';
import { outfit, OutfitsService } from '../../services/outfit.service';
import { FormService } from '../../services/form.service';
import { alert, confirm } from '../../widgets/ui-dialogs';
import { OutfitsGridProvider } from './outfits-grid.provider';

type Option = { id: string; value: string };
const statuses: Option[] = [
  { id: 'approved', value: 'Approvato' },
  { id: 'pending', value: 'In attesa' },
  { id: 'rifiutato', value: 'Rifiutato' },
  { id: 'suspended', value: 'Disabilitato' }
];
const field = (type: ColData['type'], dataField: string, colCaption: string, colWidth: string, extras: Partial<ColData> = {}): ColData => ({
  type, dataField, colCaption, colWidth, edit: false, colVisible: true,
  allowEditing: false, groupDataField: undefined, ...extras
});
const listOptions = (options: Option[]) => ({
  multiple: false, remote: false, displayExp: 'value', valueExp: 'id', parent: null, options
});

@Component({
  selector: 'app-outfits',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent, AnagraficaWrapperComponent],
  templateUrl: './outfits.component.html',
  styleUrl: './outfits.component.scss'
})
export class OutfitsComponent implements OnDestroy {
  private readonly outfitService = inject(OutfitsService);
  private readonly formService = inject(FormService);
  private readonly provider = inject(OutfitsGridProvider);
  readonly router = inject(Router);

  private grid?: DataGridComponent<outfit>;
  private requestVersion = 0;
  private mobileSearchTimer?: ReturnType<typeof setTimeout>;
  private readonly busyIds = new Set<string>();

  @ViewChild('outfitsGrid')
  set outfitsGridView(grid: DataGridComponent<outfit> | undefined) {
    this.grid = grid;
    if (!grid) return;
    grid.pageSize = 50;
    queueMicrotask(() => { if (this.grid === grid) void grid.renderGrid(); });
  }

  outfits: outfit[] = [];
  loading = false;
  loadingMore = false;
  hasMore = false;
  gridReady = false;
  error = '';
  search = '';
  subtitle = `Elenco outfit creati nell'app`;

  readonly menuActions: NonNullable<ColData['editorbuttons']> = [
    { id: 'approve', nameEvent: 'approve', text: 'Approva', icon: 'mdi mdi-check',
      disabled: false, visible: true, cssClass: null, widget: 'button', position: 'left' },
    { id: 'disable', nameEvent: 'toggleSuspend', text: 'Disabilita / riabilita', icon: 'mdi mdi-pause-circle-outline',
      disabled: false, visible: true, cssClass: null, widget: 'button', position: 'left' },
    { id: 'delete', nameEvent: 'deleteOutfit', text: 'Elimina', icon: 'mdi mdi-trash-can-outline',
      disabled: false, visible: true, cssClass: null, widget: 'button', position: 'left' },
  ];

  readonly columns: Colonne[] = [{
    itemType: 'group', groupDataField: '', data: [
      field('campoImg', 'imageUrl', 'Immagine', '90', { allowFiltering: false, search: false }),
      field('campo', 'title', 'Titolo outfit', '280'),
      field('campoLista', 'style', 'Stile', '145', { lista: listOptions([]) }),
      field('campoLista', 'occasion', 'Occasione', '160', { lista: listOptions([]) }),
      field('campo', 'userName', 'Utente', '190'),
      field('campoDateTime', 'createdAt', 'Creazione', '145'),
      field('campoLista', 'status', 'Stato', '125', { lista: listOptions(statuses) }),
      // Column 8: domain action menu. Column 9: visible pencil (not another menu).
      field('editorButtons', '', 'Azioni', '65', {
        allowFiltering: false, search: false, editorbuttons: this.menuActions,
      }),
      field('campoButton', '', 'Modifica', '66', {
        allowFiltering: false, search: false, button: {
          text: '', name: 'editOutfit', event: 'editOutfit',
          icon: 'mdi mdi-pencil-outline', hint: 'Modifica outfit'
        }
      })
    ]
  }];

  readonly dataProvider: GridDataProvider<outfit> = {
    load: async (request: GridLoadRequest): Promise<GridPage<outfit>> => {
      const append = request.continuation !== undefined;
      const version = append ? this.requestVersion : ++this.requestVersion;
      if (append) this.loadingMore = true;
      else { this.loading = true; this.error = ''; }
      try {
        const page = await this.provider.load(request);
        if (version === this.requestVersion) {
          const collected = append ? [...this.outfits, ...page.items] : [...page.items];
          this.outfits = Array.from(new Map(collected.map(item => [String(item.id), item])).values());
          this.hasMore = page.hasMore;
        }
        return page;
      } catch {
        if (version === this.requestVersion) this.error = 'Impossibile caricare gli outfit.';
        throw new Error('Outfit grid loading failed');
      } finally {
        if (version === this.requestVersion) {
          if (append) this.loadingMore = false;
          else this.loading = false;
        }
      }
    },
    deleteMany: (items: outfit[]): Promise<void> => this.provider.deleteMany(items)
  };

  ngOnInit(): void { void this.initializeTaxonomies(); }
  ngOnDestroy(): void {
    this.requestVersion++;
    if (this.mobileSearchTimer !== undefined) clearTimeout(this.mobileSearchTimer);
  }

  async initializeTaxonomies(): Promise<void> {
    this.gridReady = false;
    this.error = '';
    try {
      const [styles, occasions] = await Promise.all([
        this.formService.getData('outfitStyles'),
        this.formService.getData('outfitOccasions')
      ]);
      const extract = (response: any): Option[] => {
        const data = Array.isArray(response) ? response : response?.data;
        if (!Array.isArray(data)) throw new Error('Invalid taxonomy');
        return data
          .filter(item => typeof item?.id === 'string' && typeof item?.value === 'string')
          .map(item => ({ id: item.id, value: item.value }));
      };
      for (const [key, options] of [['style', extract(styles)], ['occasion', extract(occasions)]] as const) {
        const col = this.columns[0].data.find(item => item.dataField === key);
        if (col?.lista) col.lista.options = options;
      }
      this.gridReady = true;
    } catch {
      this.error = 'Impossibile caricare stile e occasione. Riprova.';
    }
  }

  refresh(): void { this.error = ''; this.grid?.refresh(); }
  onMobileSearchChange(): void {
    if (this.mobileSearchTimer !== undefined) clearTimeout(this.mobileSearchTimer);
    this.mobileSearchTimer = setTimeout(() => {
      this.mobileSearchTimer = undefined;
      void this.grid?.applyProviderSearch(this.search);
    }, 300);
  }
  async loadMore(): Promise<void> {
    if (!this.grid || this.loading || this.loadingMore || !this.hasMore) return;
    await this.grid.loadNextRemotePage();
  }
  trackById(_index: number, item: outfit): string { return String(item.id); }
  editOutfit(event: any): void {
    const item: outfit = event?.rowData || event?.data || event;
    if (event?.cancel !== undefined) event.cancel = true;
    if (!item?.id) { this.error = 'ID outfit mancante.'; return; }
    void this.router.navigate(['/outfit-detail', String(item.id)]);
  }
  isBusy(item: outfit): boolean { return this.busyIds.has(String(item.id)); }

  async updateStatus(item: outfit, status: outfit['status']): Promise<void> {
    const id = String(item.id || '');
    if (!id || this.busyIds.has(id) || item.status === status) return;
    this.busyIds.add(id);
    this.error = '';
    try {
      await this.outfitService.updateAdminOutfit(id, { status });
      this.refresh();
      alert('Stato outfit aggiornato.', 'Operazione completata');
    } catch {
      this.error = 'Aggiornamento stato non riuscito.';
    } finally {
      this.busyIds.delete(id);
    }
  }

  toggleSuspension(item: outfit): void {
    if (this.isBusy(item)) return;
    const restoring = item.status === 'suspended';
    const target: outfit['status'] = restoring ? (item.statusBeforeSuspension || 'pending') : 'suspended';
    const message = restoring
      ? 'Riabilitare questo outfit ripristinando lo stato precedente?'
      : 'Disabilitare questo outfit? Non sarà più visibile nel feed pubblico.';
    confirm(message, 'Conferma', yes => { if (yes) void this.updateStatus(item, target); });
  }

  removeOutfit(item: outfit): void {
    if (this.isBusy(item)) return;
    confirm('Eliminare definitivamente questo outfit? L’operazione non è reversibile.',
      'Conferma eliminazione', yes => { if (yes) void this.deleteConfirmed(item); });
  }
  private async deleteConfirmed(item: outfit): Promise<void> {
    const id = String(item.id || '');
    if (!id || this.busyIds.has(id)) return;
    this.busyIds.add(id);
    this.error = '';
    try {
      await this.outfitService.deleteAdminOutfit(id);
      this.refresh();
      alert('Outfit eliminato.', 'Operazione completata');
    } catch {
      this.error = 'Eliminazione non riuscita.';
    } finally {
      this.busyIds.delete(id);
    }
  }

  eventToolbarOutfit(event: any): void {
    if ((event.name || event.id) === 'addButton') void this.router.navigate(['/outfit-detail']);
  }
  gridAction(event: any): void {
    const item: outfit = event?.rowData;
    if (!item || this.isBusy(item)) return;
    if (event.name === 'approve') void this.updateStatus(item, 'approved');
    if (event.name === 'toggleSuspend') this.toggleSuspension(item);
    if (event.name === 'deleteOutfit') this.removeOutfit(item);
    if (event.name === 'editOutfit') this.editOutfit(item);
  }
}
