import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { GridDataProvider, GridLoadRequest, GridPage } from '../../core/data-grid/data-grid-provider';
import { createOutfitsGridProvider } from './outfits-grid.provider';
import { Router } from '@angular/router';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne, UserProfile } from '../../interface/app.interface';
import { outfit, OutfitsService } from '../../services/outfit.service';
import { UserService } from '../../services/user.service';
import { FormService } from '../../services/form.service';
import { alert, confirm } from '../../widgets/ui-dialogs';

@Component({ selector: 'app-outfits', standalone: true, imports: [CommonModule, DataGridComponent, AnagraficaWrapperComponent], templateUrl: './outfits.component.html', styleUrl: './outfits.component.scss' })
export class OutfitsComponent implements OnDestroy {
  private readonly outfitService = inject(OutfitsService);
  private readonly usersService = inject(UserService);
  private readonly formService = inject(FormService);
  readonly router = inject(Router);
  @ViewChild('outfitsGrid') set outfitGrid(grid: DataGridComponent<outfit> | undefined) {
    this.grid = grid;
    if (grid) {
      grid.pageSize = 20;
      grid.providerScrollLoadDelay = 0;
      queueMicrotask(() => { if (this.grid === grid) void grid.renderGrid(); });
    }
  }
  private grid?: DataGridComponent<outfit>;
  private requestVersion = 0;
  gridReady = false;
  loadingMore = false;
  hasMore = false;
  private readonly remoteProvider = createOutfitsGridProvider(
    this.outfitService, () => ({}), id => this.creatorName(id),
    () => {}, () => {},
  );
  readonly dataProvider: GridDataProvider<outfit> = {
    load: async (request: GridLoadRequest): Promise<GridPage<outfit>> => {
      const append = request.continuation !== undefined;
      const version = append ? this.requestVersion : ++this.requestVersion;
      if (append) this.loadingMore = true;
      else { this.loading = true; this.error = ''; }

      try {
        const page = await this.remoteProvider.load(request);
        if (version === this.requestVersion) {
          const combined = append ? [...this.outfits, ...page.items] : [...page.items];
          this.outfits = Array.from(new Map(combined.map(item => [String(item.id), item])).values());
          this.total = page.totalCount ?? this.outfits.length;
          this.hasMore = !!page.hasMore;
          this.resolveMissingCreators(page.items);
        }
        return page;
      } catch (error) {
        if (version === this.requestVersion) this.error = 'Impossibile caricare gli outfit.';
        throw error;
      } finally {
        if (version === this.requestVersion) {
          if (append) this.loadingMore = false;
          else this.loading = false;
        }
      }
    },
  };
  outfits: outfit[] = [];
  creators: UserProfile[] = [];
  loading = false;
  error = '';
  private readonly busyIds = new Set<string>();
  private readonly requestedCreatorIds = new Set<string>();
  total = 0;
  subtitle = `Elenco outfit creati nell'app`;
  readonly rowActions: NonNullable<import('../../interface/app.interface').ColData['editorbuttons']> = [
    { id: 'edit', nameEvent: 'onEditEvent', text: 'Modifica', icon: 'mdi mdi-pencil-outline', disabled: false, visible: true, cssClass: null, widget: 'button', position: 'left' },
    { id: 'delete', nameEvent: 'deleteOutfit', text: 'Elimina', icon: 'mdi mdi-trash-can-outline', disabled: false, visible: true, cssClass: null, widget: 'button', position: 'left' }
  ];
  colOutfitsGrid: Colonne[] = [{ itemType: 'group', groupDataField: '', data: [
    { type:'campoImg', colVisible:true, allowEditing:false, allowFiltering:false, dataField:'imageUrl', colWidth:'100', colCaption:'Immagine', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'title', colWidth:'260', colCaption:'Titolo', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:false, dataField:'userName', colWidth:'180', colCaption:'Creator', edit:false, groupDataField:undefined },
    { type:'campoLista', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'gender', colWidth:'100', colCaption:'Genere', edit:false, groupDataField:undefined, lista: { multiple:false, remote:false, displayExp:'value', valueExp:'id', options:[{id:'U',value:'Uomo'},{id:'D',value:'Donna'}], parent:null } },
    { type:'campoLista', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'style', colWidth:'130', colCaption:'Stile', edit:false, groupDataField:undefined, lista: { multiple:false, remote:false, displayExp:'value', valueExp:'id', options:[], parent:null } },
    { type:'campoLista', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'season', colWidth:'110', colCaption:'Stagione', edit:false, groupDataField:undefined, lista: { multiple:false, remote:false, displayExp:'value', valueExp:'id', options:[{id:'P',value:'Primavera'},{id:'E',value:'Estate'},{id:'A',value:'Autunno'},{id:'I',value:'Inverno'}], parent:null } },
    { type:'campoLista', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'occasion', colWidth:'140', colCaption:'Occasione', edit:false, groupDataField:undefined, lista: { multiple:false, remote:false, displayExp:'value', valueExp:'id', options:[], parent:null } },
    { type:'campoNumber', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'likes', colWidth:'75', colCaption:'Like', edit:false, groupDataField:undefined },
    { type:'campoNumber', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'visits', colWidth:'75', colCaption:'Visite', edit:false, groupDataField:undefined },
    { type:'campoDateTime', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'createdAt', colWidth:'120', colCaption:'Creazione', edit:false, groupDataField:undefined },
    { type:'campoLista', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'status', colWidth:'105', colCaption:'Stato', edit:false, groupDataField:undefined, lista: { multiple:false, remote:false, displayExp:'value', valueExp:'id', options:[{id:'approved',value:'Approvato'},{id:'pending',value:'In attesa'},{id:'rifiutato',value:'Rifiutato'},{id:'suspended',value:'Sospeso'}], parent:null } },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'55', colCaption:'Approva', edit:false, groupDataField:undefined, button:{ text:'', name:'approve', event:'approve', icon:'mdi mdi-check', hint:'Approva' } },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'55', colCaption:'Rifiuta', edit:false, groupDataField:undefined, button:{ text:'', name:'reject', event:'reject', icon:'mdi mdi-close', hint:'Rifiuta' } },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'75', colCaption:'Visibilità', edit:false, groupDataField:undefined, button:{ text:'', name:'toggleSuspend', event:'toggleSuspend', icon:'mdi mdi-pause-circle-outline', hint:'Sospendi / Riattiva' } }
  ] }];

  ngOnInit(): void {
    this.loadCreators();
    void this.initializeTaxonomyColumns();
  }

  ngOnDestroy(): void {
    this.requestVersion++;
  }

  /** The DataGrid renders list cell labels once; load the taxonomies before mounting it. */
  async initializeTaxonomyColumns(): Promise<void> {
    this.gridReady = false;
    this.error = '';
    try {
      const [stylesResponse, occasionsResponse] = await Promise.all([
        this.formService.getData('outfitStyles'),
        this.formService.getData('outfitOccasions'),
      ]);
      const optionsFrom = (response: any): Array<{ id: string; value: string }> => {
        const values = Array.isArray(response) ? response : response?.data;
        if (!Array.isArray(values)) throw new Error('Risposta tassonomia non valida');
        return values.filter(option => typeof option?.id === 'string' && typeof option?.value === 'string');
      };
      const styles = optionsFrom(stylesResponse);
      const occasions = optionsFrom(occasionsResponse);
      if (!styles.length || !occasions.length) throw new Error('Tassonomie senza opzioni');

      for (const [field, options] of [['style', styles], ['occasion', occasions]] as const) {
        const column = this.colOutfitsGrid[0].data.find(item => item.dataField === field);
        if (column?.lista) column.lista.options = options;
      }
      this.gridReady = true;
    } catch {
      this.error = 'Impossibile caricare le tassonomie Stile/Occasione. Riprova per visualizzare la griglia correttamente.';
    }
  }

  loadCreators(): void {
    this.usersService.getUsers(100).subscribe({
      next: users => {
        this.creators = users;
        this.refreshCreatorNames();
        this.resolveMissingCreators(this.outfits);
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
  private resolveMissingCreators(items: outfit[]): void {
    const known = new Set(this.creators.map(user => user.uid));
    for (const uid of new Set(items.map(item => String(item.userId ?? '')).filter(Boolean))) {
      if (known.has(uid) || this.requestedCreatorIds.has(uid)) continue;
      this.requestedCreatorIds.add(uid);
      this.usersService.getUserProfile(uid).subscribe({
        next: user => {
          if (!user?.uid) return;
          this.creators = [...this.creators.filter(item => item.uid !== user.uid), user];
          this.refreshCreatorNames();
        },
        error: () => { /* Keep a readable fallback instead of exposing the UID. */ }
      });
    }
  }
  private refreshCreatorNames(): void {
    this.outfits = this.outfits.map(item => ({ ...item, userName: this.creatorName(String(item.userId ?? '')) }));
    this.grid?.rowsData.update(rows => rows.map(item => ({
      ...item, userName: this.creatorName(String(item.userId ?? ''))
    })));
  }
  loadOutfits(): void {
    if (!this.grid || this.loading || this.loadingMore) return;
    this.error = '';
    this.grid.refresh();
  }
  editOutfit(event: any): void {
    const item = event?.rowData ?? event?.data ?? event;
    const id = item?.id;
    if (id === null || id === undefined || String(id).trim() === '') {
      this.error = 'Impossibile aprire il dettaglio: ID outfit mancante.';
      return;
    }
    if (event?.cancel !== undefined) event.cancel = true;
    void this.router.navigate(['/outfit-detail', String(id)]);
  }
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


  statusGridEvent(event: any): void {
    const item = event.rowData as outfit;
    if (!item || this.isBusy(item)) return;
    if (event.name === 'approve') void this.updateStatus(item, 'approved');
    if (event.name === 'reject') void this.updateStatus(item, 'rifiutato');
    if (event.name === 'toggleSuspend') this.toggleSuspension(item);
    if (event.name === 'deleteOutfit') this.removeOutfit(item);
  }
}
