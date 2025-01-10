import { Component, inject, signal } from '@angular/core';
import { AnagraficaWrapperComponent } from '../../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DynamicFormComponent } from '../../../components/dynamic-form/dynamic-form.component';
import { outfit, OutfitsService, Tag } from '../../../services/outfit.service';
import { FotoOutfitPage } from '../foto-outfit/foto-outfit.page';
import { ActivatedRoute, Router,  } from '@angular/router';
import { PopUpService } from '../../../services/popup.service';
import { alert } from '../../../widgets/ui-dialogs';

@Component({
  selector: 'app-outfit-form',
  standalone: true,
  imports: [AnagraficaWrapperComponent, DynamicFormComponent, FotoOutfitPage],
  templateUrl: './outfit-form.component.html',
  styleUrl: './outfit-form.component.scss'
})
export class OutfitFormComponent {
  outfitData = signal<outfit>({} as outfit);
  private activateRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private outFitService = inject(OutfitsService);
  private popUpService = inject(PopUpService);
  subtitle: string = "";
  outfitTitle: string = ""
  outfitId: any;
  imageUrl = signal("")
  tags = signal<Tag[]>([]);



  ngOnInit() {
    this.fetchDataOutfit(); // Recupera i dati all'avvio
  }

  fetchDataOutfit() {
    this.activateRoute.paramMap.subscribe(async params => {
      this.outfitId = params.get('id');
      if (this.outfitId) {
        // Usare il segnale per ottenere il valore quando cambia
        let resO = await this.outFitService.getOutfitById(this.outfitId)
        this.outfitData.set(resO[0])
        this.imageUrl.set(resO[0].imageUrl);
        this.tags.set(this.outfitData().tags)
      }
    });

  }
  setTags(tagsD: any) {
    this.tags.update(tagsD.tags)
  }
  async submitFormOutfit(event: any) {

    if(event.name == "cancelForm"){
      this.router.navigate(['/outfits']);
      return 
    }

    const inEdit = event.inEdit;
    const formData = event.formData;

    let mappedTag: any[] = [...this.tags()];

    mappedTag = mappedTag.reduce(
      (acc, tag) => {
        // Se l'elemento non è già presente nell'array, aggiungilo
        if (!acc.outfitCategory.includes(tag.outfitCategory)) {
          acc.outfitCategory.push(tag.outfitCategory);
        }
        if (!acc.outfitSubCategory.includes(tag.outfitSubCategory)) {
          acc.outfitSubCategory.push(tag.outfitSubCategory);
        }
        if (!acc.color.includes(tag.color)) {
          acc.color.push(tag.color);
        }
        return acc;
      },
      { outfitCategory: [], outfitSubCategory: [], color: [] }
    );

    let dateCreate = new Date();
    let formOutfit:outfit = formData ;
    formOutfit.tags = this.tags();
    formOutfit = { ...formOutfit, ...mappedTag }
   
    
    // Salva o aggiorna il prodotto nel database  
    if (inEdit) {
      formOutfit.editedAt = new Date().getTime()
      let awaitRes = await this.outFitService.updateInCollection(formOutfit.id, formOutfit);
      if(awaitRes){
        this.router.navigate(['/outfit-list']);
      }else{
       alert("Si è verificato un errore durante il salvataggio dell'outfit","Errore durante il salvataggio dell'outfit")
      }
    } else {
      formOutfit.editedAt = new Date().getTime()
      formOutfit.createdAt = new Date().getTime()
      let awaitRes =await this.outFitService.saveOutfitCollection(undefined, formData);
      if(awaitRes){
        this.router.navigate(['/outfit-list']);
      }else{
       alert("Si è verificato un errore durante il salvataggio dell'outfit","Errore durante il salvataggio dell'outfit")
      }
    }
    //throw new Error('Method not implemented.');
  }

  btnInputEvent(event: any) {
    console.log('btnInputEvent',event);
    //this.popUpService()
  }
}
