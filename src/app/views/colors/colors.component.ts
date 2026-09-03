import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OutfitColor, TaxonomyService } from '../../services/taxonomy.service';
import { alert, confirm } from '../../widgets/ui-dialogs';

@Component({ standalone:true, selector:'app-colors', imports:[CommonModule,FormsModule], templateUrl:'./colors.component.html', styleUrl:'./colors.component.scss' })
export class ColorsComponent {
  private api=inject(TaxonomyService); colors:OutfitColor[]=[]; editing:OutfitColor={id:'',value:'',hex:'#000000',parent:null}; loading=false; error='';
  ngOnInit(){this.load()} load(){this.loading=true;this.api.getColors().subscribe({next:v=>{this.colors=v;this.loading=false},error:()=>{this.error='Impossibile caricare i colori.';this.loading=false}})}
  edit(c?:OutfitColor){this.editing=c?{...c}:{id:'',value:'',hex:'#000000',parent:null}}
  save(){if(!/^#[0-9a-f]{6}$/i.test(this.editing.hex)){this.error='Inserisci un HEX valido (es. #000000).';return}this.loading=true;const call=this.colors.some(c=>c.id===this.editing.id)?this.api.updateColor(this.editing.id,this.editing):this.api.createColor(this.editing);call.subscribe({next:()=>{alert('Colore salvato.','Operazione completata');this.edit();this.load()},error:e=>{this.loading=false;this.error=e.status===409?'Il colore è utilizzato e non può essere modificato.':'Salvataggio non riuscito.'}})}
  remove(c:OutfitColor){confirm(`Eliminare il colore ${c.value}?`,'Conferma',yes=>yes&&this.api.deleteColor(c.id).subscribe({next:()=>this.colors=this.colors.filter(x=>x.id!==c.id),error:e=>this.error=e.status===409?'Il colore è utilizzato e non può essere eliminato.':'Eliminazione non riuscita.'}))}
}
