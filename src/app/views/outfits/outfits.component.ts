import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne, ToolbarButton, UserProfile } from '../../interface/app.interface';
import { outfit, OutfitsService } from '../../services/outfit.service';
import { UserService } from '../../services/user.service';
import { alert, confirm } from '../../widgets/ui-dialogs';

@Component({ selector: 'app-outfits', standalone: true, imports: [CommonModule, FormsModule, DataGridComponent, AnagraficaWrapperComponent], templateUrl: './outfits.component.html', styleUrl: './outfits.component.scss' })
export class OutfitsComponent {
  private readonly outfitService = inject(OutfitsService);
  private readonly usersService = inject(UserService);
  readonly router = inject(Router);
  outfits: outfit[] = [];
  creators: UserProfile[] = [];
  loading = false;
  error = '';
  filtersOpen = false;
  page = 1;
  limit = 10;
  total = 0;
  filters = { status: '', userId: '', gender: '', category: '', season: '', style: '', search: '' };
  subtitle = `Elenco outfit creati nell'app`;
  colOutfitsGrid: Colonne[] = [{ itemType: 'group', groupDataField: '', data: [
    { type:'campo', colVisible:true, allowEditing:false, dataField:'title', colWidth:'280', colCaption:'Titolo', edit:false, groupDataField:undefined },
    { type:'campoImg', colVisible:true, allowEditing:false, dataField:'imageUrl', colWidth:'130', colCaption:'Immagine', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, dataField:'userName', colWidth:'160', colCaption:'Creator', edit:false, groupDataField:undefined },
    { type:'campoDateTime', colVisible:true, allowEditing:false, dataField:'createdAt', colWidth:'110', colCaption:'Creazione', edit:false, groupDataField:undefined },
    { type:'campo', colVisible:true, allowEditing:false, dataField:'status', colWidth:'100', colCaption:'Stato', edit:false, groupDataField:undefined },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'60', colCaption:'Approva', edit:false, groupDataField:undefined, button:{ text:'', name:'approve', event:'approve', icon:'mdi mdi-check', hint:'Approva' } },
    { type:'campoButton', colVisible:true, allowEditing:false, dataField:'', colWidth:'60', colCaption:'Rifiuta', edit:false, groupDataField:undefined, button:{ text:'', name:'reject', event:'reject', icon:'mdi mdi-close', hint:'Rifiuta' } }
  ] }];
  customToolbarButtons: ToolbarButton[] = [{ id:'toJSON', name:'toJSON', text:'Importa da Jsn', disabled:false, visible:true, icon:'mdi mdi-database-import-outline', widget:'button' }];

  ngOnInit(): void { this.loadCreators(); void this.loadOutfits(); }
  loadCreators(): void { this.usersService.getUsers(100).subscribe({ next: users => this.creators = users, error: () => this.error = 'Impossibile caricare i creator.' }); }
  creatorName(userId: string): string { const user = this.creators.find(item => item.uid === userId); return user?.displayName || user?.email || userId || '—'; }
  async loadOutfits(): Promise<void> {
    this.loading = true; this.error = '';
    try {
      this.outfits = await this.outfitService.getAdminOutfits(this.filters, this.page, this.limit);
      const pagination = this.outfitService.pagination();
      this.page = pagination.page; this.limit = pagination.limit; this.total = pagination.total;
      this.outfits.forEach(item => item.userName = this.creatorName(item.userId));
    } catch { this.error = 'Impossibile caricare gli outfit.'; }
    finally { this.loading = false; }
  }
  applyFilters(): void { this.page = 1; void this.loadOutfits(); }
  resetFilters(): void { this.filters = { status:'', userId:'', gender:'', category:'', season:'', style:'', search:'' }; this.applyFilters(); }
  previous(): void { if (this.page > 1) { this.page--; void this.loadOutfits(); } }
  next(): void { if (this.page * this.limit < this.total) { this.page++; void this.loadOutfits(); } }
  editOutfit(event: any): void { const value = event?.data || event; if (event?.cancel !== undefined) event.cancel = true; this.router.navigate(['/outfit-detail', value.id]); }
  async updateStatus(item: outfit, status: outfit['status']): Promise<void> {
    try { await this.outfitService.updateAdminOutfit(item.id, { status }); item.status = status; alert('Stato outfit aggiornato.', 'Operazione completata'); }
    catch { this.error = 'Aggiornamento stato non riuscito.'; }
  }
  removeOutfit(item: outfit): void { confirm(`Eliminare l’outfit “${item.title}”?`, 'Conferma', yes => { if (yes) void this.deleteConfirmed(item); }); }
  private async deleteConfirmed(item: outfit): Promise<void> { try { await this.outfitService.deleteAdminOutfit(item.id); this.outfits = this.outfits.filter(value => value.id !== item.id); this.total--; } catch { this.error = 'Eliminazione non riuscita.'; } }
  async eventToolbarOutfit(event:any): Promise<void> { const name=event.name||event.id; if(name==='toJSON'){this.loading=true;await this.outfitService.JsonOutfits();await this.loadOutfits();} if(name==='addButton') await this.router.navigate(['/outfit-detail']); }
  gridEvent(event:any): void { if(event.name==='delRows') this.removeOutfit(event.rowData); }
  statusGridEvent(event:any): void { if(event.name==='approve') void this.updateStatus(event.rowData, 'approved'); if(event.name==='reject') void this.updateStatus(event.rowData, 'rifiutato'); }
}
