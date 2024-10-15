import { Component, inject } from '@angular/core';
import { Colonne } from '../../interface/app.interface';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { CommonModule } from '@angular/common';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { outfitCategories, OutfitsService } from '../../services/outfit.service';
import { Observable } from 'rxjs';
import { PopUpService } from '../../services/popup.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-outfit-category',
  standalone: true,
  imports: [DataGridComponent, CommonModule, AnagraficaWrapperComponent,],
  templateUrl: './outfit-category.component.html',
  styleUrl: './outfit-category.component.scss'
})
export class OutfitCategoryComponent {
  colOutfitsCategory: Colonne[] = [
    {
      itemType: "group",
      data: [
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: "id",
          colWidth: '50',
          caption: "",
          colCaption: '',
          class: '',
          edit: false,
          groupDataField: undefined,

        },

        {
          type: 'campoImg',
          colVisible: true,
          allowEditing: true,
          dataField: "imageUrl",
          colWidth: '77',
          class: 'outfit-image',
          colCaption: 'Immagine',
          allowFiltering: undefined,
          edit: undefined,
          groupDataField: undefined,

        },

        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: "categoryName",
          colWidth: '200',
          colCaption: 'Categoria',
          edit: undefined,
          groupDataField: undefined,

        },
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: "parentCategory",
          colWidth: '90',
          colCaption: 'Parent',


          edit: undefined,
          groupDataField: undefined,

        },

        {
          type: 'campoLista',
          colVisible: true,
          allowEditing: true,
          dataField: "status",
          colWidth: '110',
          colCaption: 'Stato',
          allowFiltering: undefined,
          
          edit: undefined,
          groupDataField: undefined,
          lista:{
              valueExp:'id',
              displayExp:'value',
              multiple: false,
              parent: null,
              remote:false,
              options: [
                {
                  id:'1',
                  value:'Attivo'
                },
                {
                  id:'0',
                  value:'Non attivo'
                }
              ]
          }
        },
        {
          type: 'campoNumber',
          colVisible: true,
          allowEditing: true,
          dataField: "order",
          colWidth: '70',

          colCaption: 'Ordine',
          edit: undefined,
          groupDataField: undefined,


        },
        {
          type: 'campoDateTime',
          colVisible: true,
          allowEditing: true,
          dataField: "createdAt",
          colWidth: '110',
          caption: "Creazione",
          colCaption: 'Creazione',
          edit: undefined,
          groupDataField: undefined,

        },
        {
          type: 'campoDateTime',
          colVisible: true,
          allowEditing: true,
          dataField: "editedAt",
          colWidth: '110',
          colCaption: 'Ultima modifica',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,

        },

        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: "gender",
          colWidth: '90',
          colCaption: 'Genere',


          edit: undefined,
          groupDataField: undefined,

        },
      ],
      groupDataField: ''
    }
  ]
  outFitService = inject(OutfitsService);
  private route =inject(ActivatedRoute);
  private router=inject(Router);
  outFitCategories$!: Observable<outfitCategories[]>;
  outFitCategories: outfitCategories[] = []
  showGrid: boolean = false;
  showSpinner: boolean = false
  title: string = "Elenco Categorie degli outifi da mostrare nell'app";
  subTitle: string = '';
  selectedCatOutfit: outfitCategories | undefined | any
  propertiesModal= inject ( PopUpService ); 
  categoryId:any=null;

  async ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.categoryId = params.get('id');
      if (this.categoryId) {
        // Usare il segnale per ottenere il valore quando cambia
        
          this.selectedCatOutfit = this.outFitService.mySignal();
          //parentCategory

        this.title = `Elenco delle Sotto Categorie della Categoria:${this.selectedCatOutfit.categoryName}`

        this.outFitCategories$ = this.outFitService.getOutFitCategories(this.categoryId);
      }else{
        this.outFitCategories$ = this.outFitService.getOutFitCategories();
      }
    });
    

    await this.loadOutFitCategories()
    // Carica gli utenti dalla collezione 'users' di Firestore


  }

  async loadOutFitCategories() {
    this.showGrid = false
    this.outFitCategories$.subscribe((categories: outfitCategories[]) => {
      this.outFitCategories = categories;
      this.showGrid = true
    })
  }


  addCategoryOutfit(event: any) {
    //this.selectedCatOutfit =undefined
    let editData 
    if(this.categoryId){
        editData ={
          parentCategory: this.categoryId
        }
    }
    let InstanceData = {
      service: 'outfitCategories',
      idData:editData
    }

    this.createOrEditCategories(InstanceData)
  }

  editCategoryOutfit(event: any) {

    event.cancel = true

    this.selectedCatOutfit = event.data as  outfitCategories;

    
    let InstanceData = {
      service: 'outfitCategories',
      editData: this.selectedCatOutfit
    }

    this.createOrEditCategories(InstanceData)
  }  

  createOrEditCategories(InstanceData:any){

    let guid = Math.random().toString().replace("0.", "");
    this.propertiesModal.setNewPopUp(guid, 'DynamicFormComponent', null, 800, null, InstanceData, false, true, "Modifica Outfit", '', false)


    this.propertiesModal.outputComponent.subscribe(async resulOutputComponent => {
      if (resulOutputComponent.guid == guid && resulOutputComponent.name == 'submitForm') {

        const formData = resulOutputComponent.formData;
        formData.parentCategory = !formData.parentCategory ? '' : formData.parentCategory
        let res;
        let dateEdit = new Date();
        if (resulOutputComponent.inEdit) {
          
          formData.editedAt = dateEdit.getTime();
         res = await this.outFitService.updateOutfitCategories(formData.id, formData)
        } else {
          formData.editedAt = dateEdit.getTime();
          formData.createdAt = dateEdit.getTime()
          res = await this.outFitService.saveOutfitCategories(formData)
        }

        if (res) {
          this.selectedCatOutfit = !this.categoryId ? undefined : this.selectedCatOutfit
          this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
         
          this.outFitCategories$ = this.outFitService.getOutFitCategories(this.categoryId);
          this.loadOutFitCategories()
        }
      }

      if (resulOutputComponent.guid == guid && resulOutputComponent.name == 'cancelForm') {
        this.selectedCatOutfit = !this.categoryId ? undefined : this.selectedCatOutfit
        this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
      }
    })
  }

  async gridEvent(event: any) {
    console.log('gridEvent-->', event);

    const eventName = event.name;
    const rowData: outfitCategories = event.rowData
    switch (eventName) {
      case "delRows":
        const  res = await this.outFitService.removeOutfitCategories(rowData.id);
        if(res){
  
          //this.loadOutFitCategories()
        }
        break;

      default:
        break;
    }
  }

  dblClickRow(event:any){
    const rowData = event.rowData;
    this.outFitService.mySignal.set(event.rowData);
    this.router.navigate(['/outfit-category', rowData.id]) 
  }

}
