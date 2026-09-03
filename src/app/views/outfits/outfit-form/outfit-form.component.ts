import { Component, inject, signal } from '@angular/core';
import { AnagraficaWrapperComponent } from '../../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { DynamicFormComponent } from '../../../components/dynamic-form/dynamic-form.component';
import { outfit, OutfitsService, Tag } from '../../../services/outfit.service';
import { FotoOutfitPage } from '../foto-outfit/foto-outfit.page';
import { ActivatedRoute, Router,  } from '@angular/router';
import { PopUpService } from '../../../services/popup.service';
import { alert } from '../../../widgets/ui-dialogs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../interface/app.interface';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-outfit-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AnagraficaWrapperComponent, DynamicFormComponent, FotoOutfitPage],
  templateUrl: './outfit-form.component.html',
  styleUrl: './outfit-form.component.scss'
})
export class OutfitFormComponent {
  outfitData = signal<outfit>({} as outfit);
  private activateRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private outFitService = inject(OutfitsService);
  private popUpService = inject(PopUpService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  subtitle: string = "";
  outfitTitle: string = ""
  outfitId: any;
  imageUrl = signal("")
  tags = signal<Tag[]>([]);
  targetUsers: UserProfile[] = [];
  targetUserId = '';



  ngOnInit() {
    this.fetchDataOutfit(); // Recupera i dati all'avvio
    this.userService.getUsers(100).subscribe(users => this.targetUsers = this.authService.isAdmin() ? users : users.filter(user => user.role === 'creator'));
  }

  fetchDataOutfit() {
    this.activateRoute.paramMap.subscribe(async params => {
      this.outfitId = params.get('id');
      if (this.outfitId) {
        // Usare il segnale per ottenere il valore quando cambia
        let resO = await this.outFitService.getAdminOutfitById(this.outfitId)
        this.outfitData.set(resO[0])
        this.imageUrl.set(resO[0].imageUrl);
        this.tags.set(this.outfitData().tags)
      }
    });

  }
  setTags(tagsD: any) {
    this.tags.set(tagsD.tags)
  }
  async submitFormOutfit(event: any) {

    if(event.name == "cancelForm"){
      this.router.navigate(['/outfit-list']);
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
      let awaitRes = await this.outFitService.updateAdminOutfit(formOutfit.id, formOutfit);
      if(awaitRes){
        this.router.navigate(['/outfit-list']);
      }else{
       alert("Si è verificato un errore durante il salvataggio dell'outfit","Errore durante il salvataggio dell'outfit")
      }
    } else {
      if (this.targetUserId) formOutfit.userId = this.targetUserId;
      let awaitRes =await this.outFitService.createAdminOutfit(formOutfit);
      if(awaitRes){
        this.router.navigate(['/outfit-list']);
      }else{
       alert("Si è verificato un errore durante il salvataggio dell'outfit","Errore durante il salvataggio dell'outfit")
      }
    }
  }

  btnInputEvent(event: any) {
    console.log('btnInputEvent',event);
    //this.popUpService()
  }
}
