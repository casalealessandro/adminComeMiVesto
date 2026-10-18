import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { GridDataProvider } from '../../core/data-grid/data-grid-provider';
import { createOutfitsGridProvider } from './outfits-grid.provider';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne, UserProfile } from '../../interface/app.interface';
import { outfit, outfitCategories, OutfitsService } from '../../services/outfit.service';
import { UserService } from '../../services/user.service';
import { OutfitColor, TaxonomyService } from '../../services/taxonomy.service';
import { FormService } from '../../services/form.service';
import { DynamicFormField } from '../../interface/dynamic-form-field';
import { alert, confirm } from '../../widgets/ui-dialogs';

@Component({ selector: 'app-outfits', standalone: true, imports: [CommonModule, FormsModule, DataGridComponent, AnagraficaWrapperComponent], templateUrl: './outfits.component.html', styleUrl: './outfits.component.scss' })
export class OutfitsComponent {
  private readonly outfitService = inject(OutfitsService);
  private readonly usersService = inject(UserService);
  private readonly taxonomyService = inject(TaxonomyService);
  private readonly formService = inject(FormService);
  readonly router = inject(Router);
  @ViewChild(DataGridComponent) set outfitGrid(grid: DataGridComponent<outfit> | undefined) {
    this.grid = grid;
    if (grid) { grid.pageSize = this.limit; queueMicrotask(() => void grid.renderGrid()); }
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
  private appliedFilters: Record<string, string> = {};
  outfits: outfit[] = [];
  creators: UserProfile[] = [];
  categories: outfitCategories[] = [];
  colors: OutfitColor[] = [];
  taxonomyOptions: Record<'gender' | 'season' | 'style', Array<{ id: string; value: string }>> = { gender: [], season: [], style: [] };
  loading = false;
  error = '';
  filtersOpen = false;
  page = 1;
  limit = 10;
  total = 0;
  filters = { status: '', userId: '', gender: '', category: '', season: '', style: '', color: '', search: '' };
  subtitle = `Elenco outfit creati nell'app`;
  colOutfitsGrid: Colonne[] = [{ itemType: 'group', groupDataField: '', data: [
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'id', colWidth:'160', colCaption:'ID', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'description', colWidth:'200', colCaption:'Descrizione', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'userId', colWidth:'140', colCaption:'UID creator', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'gender', colWidth:'90', colCaption:'Genere', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'style', colWidth:'90', colCaption:'Stile', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'season', colWidth:'90', colCaption:'Stagione', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'outfitCategory', colWidth:'140', colCaption:'Categorie', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'color', colWidth:'110', colCaption:'Colori', edit:false, groupDataField:undefined },
    { type:'campoNumber', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'likes', colWidth:'90', colCaption:'Like', edit:false, groupDataField:undefined },
    { type:'campoNumber', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'visits', colWidth:'90', colCaption:'Visite', edit:false, groupDataField:undefined },
    { type:'campoDateTime', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'updatedAt', colWidth:'110', colCaption:'Aggiornamento', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'title', colWidth:'280', colCaption:'Titolo', edit:false, groupDataField:undefined },
    { type:'campoImg', colVisible:true, allowEditing:false, dataField:'imageUrl', colWidth:'130', colCaption:'Immagine', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, dataField:'userName', colWidth:'160', colCaption:'Creator', edit:false, groupDataField:undefined },
    { type:'campoDateTime', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'createdAt', colWidth:'110', colCaption:'Creazione', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, allowFiltering:true, dataField:'status', colWidth:'100', colCaption:'Stato', edit:false, groupDataField:undefined },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'60', colCaption:'Approva', edit:false, groupDataField:undefined, button:{ text:'', name:'approve', event:'approve', icon:'mdi mdi-check', hint:'Approva' } },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'60', colCaption:'Rifiuta', edit:false, groupDataField:undefined, button:{ text:'', name:'reject', event:'reject', icon:'mdi mdi-close', hint:'Rifiuta' } }
  ] }];

  ngOnInit(): void { this.loadCreators(); this.loadTaxonomies(); }
  loadCreators(): void { this.usersService.getUsers(100).subscribe({ next: users => this.creators = users, error: () => this.error = 'Impossibile caricare i creator.' }); }
  creatorName(userId: string): string { const user = this.creators.find(item => item.uid === userId); return user?.displayName || user?.email || userId || '—'; }
  async loadOutfits(): Promise<void> {
    this.loading = true; this.error = '';
    this.outfits = []; this.total = 0;
    try { await this.grid?.refresh(); }
    finally { this.loading = false; }
  }
  applyFilters(): void {
    this.page = 1;
    this.appliedFilters = { ...this.filters };
    void this.loadOutfits();
  }
  resetFilters(): void {
    this.filters = { status:'', userId:'', gender:'', category:'', season:'', style:'', color:'', search:'' };
    this.applyFilters();
  }
  private loadTaxonomies(): void {
    this.taxonomyService.getColors().subscribe({ next: colors => this.colors = colors, error: () => this.error = 'Impossibile caricare la tassonomia colori.' });
    this.outfitService.getOutFitCategories().subscribe({ next: categories => this.categories = categories, error: () => this.error = 'Impossibile caricare le categorie outfit.' });
    this.formService.getFormFields('outfitForm').subscribe({
      next: fields => void Promise.all((['gender', 'season', 'style'] as const).map(name => this.loadFieldOptions(fields, name))),
      error: () => this.error = 'Impossibile caricare le tassonomie del form outfit.'
    });
  }
  private async loadFieldOptions(fields: DynamicFormField[], name: 'gender' | 'season' | 'style'): Promise<void> {
    const select = fields.find(field => field.name === name)?.selectOptions;
    if (!select) return;
    const values = select.remote && select.api ? await this.formService.getData(select.api) : (select.options || []);
    this.taxonomyOptions[name] = (Array.isArray(values) ? values : values?.data || []).map((item: any) => ({
      id: String(item[select.valueExp || 'id']), value: String(item[select.displayExp || 'value'])
    }));
  }
  async next(): Promise<void> { if (this.outfits.length < this.total) await this.grid?.loadNextRemotePage(); }
  editOutfit(event: any): void { const value = event?.data || event; if (event?.cancel !== undefined) event.cancel = true; this.router.navigate(['/outfit-detail', value.id]); }
  async updateStatus(item: outfit, status: outfit['status']): Promise<void> {
    try { await this.outfitService.updateAdminOutfit(item.id, { status }); item.status = status; await this.loadOutfits(); alert('Stato outfit aggiornato.', 'Operazione completata'); }
    catch { this.error = 'Aggiornamento stato non riuscito.'; }
  }
  removeOutfit(item: outfit): void { confirm(`Eliminare l’outfit “${item.title}”?`, 'Conferma', yes => { if (yes) void this.deleteConfirmed(item); }); }
  private async deleteConfirmed(item: outfit): Promise<void> { try { await this.outfitService.deleteAdminOutfit(item.id); await this.loadOutfits(); } catch { this.error = 'Eliminazione non riuscita.'; } }
  async eventToolbarOutfit(event:any): Promise<void> { const name=event.name||event.id; if(name==='addButton') await this.router.navigate(['/outfit-detail']); }
  gridEvent(event:any): void { if(event.name==='delRows') this.removeOutfit(event.rowData); }
  statusGridEvent(event:any): void { if(event.name==='approve') void this.updateStatus(event.rowData, 'approved'); if(event.name==='reject') void this.updateStatus(event.rowData, 'rifiutato'); }
}
