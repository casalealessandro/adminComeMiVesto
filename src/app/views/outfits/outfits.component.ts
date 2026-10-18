import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { GridDataProvider } from '../../core/data-grid/data-grid-provider';
import { createOutfitsGridProvider } from './outfits-grid.provider';
import { Router } from '@angular/router';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne, UserProfile } from '../../interface/app.interface';
import { outfit, OutfitsService } from '../../services/outfit.service';
import { UserService } from '../../services/user.service';
import { alert, confirm } from '../../widgets/ui-dialogs';

@Component({ selector: 'app-outfits', standalone: true, imports: [CommonModule, DataGridComponent, AnagraficaWrapperComponent], templateUrl: './outfits.component.html', styleUrl: './outfits.component.scss' })
export class OutfitsComponent {
  private readonly outfitService = inject(OutfitsService);
  private readonly usersService = inject(UserService);
  readonly router = inject(Router);
  @ViewChild(DataGridComponent) set outfitGrid(grid: DataGridComponent<outfit> | undefined) {
    this.grid = grid;
    if (grid) { grid.pageSize = 20; grid.providerScrollLoadDelay = 0; queueMicrotask(() => { if (this.grid === grid) void grid.renderGrid(); }); }
  }
  private grid?: DataGridComponent<outfit>;
  readonly dataProvider: GridDataProvider<outfit> = createOutfitsGridProvider(
    this.outfitService, () => this.appliedFilters, id => this.creatorName(id),
    (items, append, total) => {
      this.outfits = append ? [...this.outfits, ...items] : items;
      this.total = total;
      this.loading = false;
    },
    () => { this.error = 'Impossibile caricare gli outfit.'; this.loading = false; },
  );
  private readonly appliedFilters: Record<string, string> = {};
  outfits: outfit[] = [];
  creators: UserProfile[] = [];
  loading = false;
  error = '';
  private readonly busyIds = new Set<string>();
  total = 0;
  subtitle = `Elenco outfit creati nell'app`;
  readonly rowActions: NonNullable<import('../../interface/app.interface').ColData['editorbuttons']> = [
    { id: 'edit', nameEvent: 'onEditEvent', text: 'Modifica', icon: 'mdi mdi-pencil-outline', disabled: false, visible: true, cssClass: null, widget: 'button', position: 'left' },
    { id: 'delete', nameEvent: 'deleteOutfit', text: 'Elimina', icon: 'mdi mdi-trash-can-outline', disabled: false, visible: true, cssClass: null, widget: 'button', position: 'left' }
  ];
  colOutfitsGrid: Colonne[] = [{ itemType: 'group', groupDataField: '', data: [
    { type:'campoImg', colVisible:true, allowEditing:false, dataField:'imageUrl', colWidth:'100', colCaption:'Immagine', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'title', colWidth:'260', colCaption:'Titolo', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, dataField:'userName', colWidth:'180', colCaption:'Creator', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:false, dataField:'genderLabel', colWidth:'100', colCaption:'Genere', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'style', colWidth:'100', colCaption:'Stile', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:false, dataField:'seasonLabel', colWidth:'110', colCaption:'Stagione', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:false, dataField:'occasionLabel', colWidth:'140', colCaption:'Occasione', edit:false, groupDataField:undefined },
    { type:'campoNumber', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'likes', colWidth:'75', colCaption:'Like', edit:false, groupDataField:undefined },
    { type:'campoNumber', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'visits', colWidth:'75', colCaption:'Visite', edit:false, groupDataField:undefined },
    { type:'campoDateTime', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'createdAt', colWidth:'120', colCaption:'Creazione', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'status', colWidth:'105', colCaption:'Stato', edit:false, groupDataField:undefined },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'55', colCaption:'Approva', edit:false, groupDataField:undefined, button:{ text:'', name:'approve', event:'approve', icon:'mdi mdi-check', hint:'Approva' } },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'55', colCaption:'Rifiuta', edit:false, groupDataField:undefined, button:{ text:'', name:'reject', event:'reject', icon:'mdi mdi-close', hint:'Rifiuta' } },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'75', colCaption:'Visibilità', edit:false, groupDataField:undefined, button:{ text:'', name:'toggleSuspend', event:'toggleSuspend', icon:'mdi mdi-pause-circle-outline', hint:'Sospendi / Riattiva' } }
  ] }];

  ngOnInit(): void { this.loadCreators(); }
  loadCreators(): void {
    this.usersService.getUsers(100).subscribe({
      next: users => {
        this.creators = users;
        this.refreshCreatorNames();
      },
      error: () => { this.error = 'Impossibile caricare i nomi dei creator.'; }
    });
  }
  creatorName(userId: string): string {
    const user = this.creators.find(item => item.uid === userId);
    const alias = user?.displayName?.trim();
    const fullName = [user?.nome?.trim(), user?.cognome?.trim()].filter(Boolean).join(' ');
    return alias || fullName || user?.name?.trim() || user?.email || 'Utente non disponibile';
  }
  private refreshCreatorNames(): void {
    this.outfits = this.outfits.map(item => ({ ...item, userName: this.creatorName(String(item.userId ?? '')) }));
    this.grid?.rowsData.update(rows => rows.map(item => ({
      ...item, userName: this.creatorName(String(item.userId ?? ''))
    })));
  }
  async loadOutfits(): Promise<void> {
    if (!this.grid || this.grid.isLoading) return;
    this.error = '';
    await this.grid.renderGrid();
  }
  editOutfit(event: any): void { const value = event?.data || event; if (event?.cancel !== undefined) event.cancel = true; this.router.navigate(['/outfit-detail', value.id]); }
  isBusy(item: outfit): boolean { return this.busyIds.has(String(item.id)); }

  async updateStatus(item: outfit, status: outfit['status']): Promise<void> {
    const id = String(item.id);
    if (!id || this.busyIds.has(id) || item.status === status) return;
    this.busyIds.add(id);
    this.error = '';
    try {
      await this.outfitService.updateAdminOutfit(id, { status });
      await this.loadOutfits();
      alert('Stato outfit aggiornato.', 'Operazione completata');
    } catch {
      this.error = 'Aggiornamento stato non riuscito. L’outfit non è stato modificato.';
    } finally {
      this.busyIds.delete(id);
    }
  }

  toggleSuspension(item: outfit): void {
    if (this.isBusy(item)) return;
    const restoring = item.status === 'suspended';
    // Without a saved previous state, never approve an outfit implicitly.
    const targetStatus: outfit['status'] = restoring ? (item.statusBeforeSuspension || 'pending') : 'suspended';
    const message = restoring
      ? 'Riattivare questo outfit e ripristinare il suo stato precedente?'
      : 'Sospendere questo outfit? Non sarà più visibile nel feed pubblico.';
    confirm(message, 'Conferma', yes => {
      if (yes) void this.updateStatus(item, targetStatus);
    });
  }

  removeOutfit(item: outfit): void {
    if (this.isBusy(item)) return;
    confirm('Eliminare definitivamente questo outfit? L’operazione non è reversibile.', 'Conferma eliminazione', yes => {
      if (yes) void this.deleteConfirmed(item);
    });
  }

  private async deleteConfirmed(item: outfit): Promise<void> {
    const id = String(item.id);
    if (!id || this.busyIds.has(id)) return;
    this.busyIds.add(id);
    this.error = '';
    try {
      await this.outfitService.deleteAdminOutfit(id);

      await this.loadOutfits();
      alert('Outfit eliminato.', 'Operazione completata');
    } catch {
      this.error = 'Eliminazione non riuscita. L’outfit è ancora presente.';
    } finally {
      this.busyIds.delete(id);
    }
  }

  async eventToolbarOutfit(event: any): Promise<void> {
    const name = event.name || event.id;
    if (name === 'addButton') await this.router.navigate(['/outfit-detail']);
  }

  gridEvent(event: any): void {
    // Deletion uses the dedicated action button, not the DataGrid local row removal.
    // Elimina viene gestito esclusivamente dall'azione personalizzata nel menu della riga.
  }

  statusGridEvent(event: any): void {
    const item = event.rowData as outfit;
    if (!item || this.isBusy(item)) return;
    if (event.name === 'approve') void this.updateStatus(item, 'approved');
    if (event.name === 'reject') void this.updateStatus(item, 'rifiutato');
    if (event.name === 'toggleSuspend') this.toggleSuspension(item);
    if (event.name === 'deleteOutfit') this.removeOutfit(item);
  }
}
