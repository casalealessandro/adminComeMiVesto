import { Component, EventEmitter, inject, Output, signal, Signal } from '@angular/core';
import { AnagraficaWrapperComponent } from "../../layout/anagrafica-wrapper/anagrafica-wrapper.component";
import { DataGridComponent } from "../../components/data-grid/data-grid.component";
import { Colonne, ToolbarButton } from '../../interface/app.interface';
import { Observable } from 'rxjs';
import { OutfitsService, wardrobesItem } from '../../services/outfit.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PopUpService } from '../../services/popup.service';
import { CommonModule } from '@angular/common';
import { DynamicFormComponent } from "../../components/dynamic-form/dynamic-form.component";

@Component({
  selector: 'app-outfit-products',
  standalone: true,
  imports: [CommonModule, AnagraficaWrapperComponent, DataGridComponent, DynamicFormComponent],
  templateUrl: './outfit-products.component.html',
  styleUrl: './outfit-products.component.scss'
})
export class OutfitProductsComponent {

  @Output() selectProduct = new EventEmitter<wardrobesItem>();
  
  colProductsGrid: Colonne[]=[
    
      {
        itemType: "group",
        data: [
          {
            type: 'campo',
            edit: false,
            groupDataField: undefined,
            colCaption: 'id',
            dataField: 'id',
            colWidth:40,
          },
          {
            type: 'campoImg',
            colVisible: true,
            allowEditing: true,
            dataField: "imageUrl",
            colWidth:50,
            class: 'outfit-image',
            colCaption: 'Immagine',
            allowFiltering: undefined,
            edit: undefined,
            groupDataField: undefined,
  
          },
          {
            type: 'campo',
            edit: false,
            colWidth: 90,
            groupDataField: undefined,
            colCaption: 'Prodotto',
            dataField: 'name'
          },
          {
            type: 'campo',
            edit: false,
            groupDataField: undefined,
            colCaption: 'Categoria',
            dataField: 'outfitSubCategory',
            colWidth: 90,
          },
          {
            type: 'campo',
            edit: false,
            groupDataField: undefined,
            colCaption: 'Brend',
            dataField: 'brend',
            colWidth: 70,
          },
          {
            type: 'campoNumber',
            edit: false,
            groupDataField: undefined,
            colCaption: 'Prezzo',
            dataField: 'price',
            colWidth: 50,
            format:"#.##"
            
          },
          {
            type: 'campoLista',
            edit: false,
            groupDataField: undefined,
            colCaption: 'Genere',
            dataField: 'gender',
            colWidth: 50,
            lista: {
              displayExp: 'name',
              valueExp: 'id',
              options: [
                {id:'U', name: 'Uomo'},
                {id:'D', name: 'Donna'},
              ],
              multiple: false,
              remote:false,
              parent: null,
              
            }
          },
        ],
        groupDataField: ''
      }    
     
    
  ];
  outFitService = inject(OutfitsService);
  private route =inject(ActivatedRoute);
  private router=inject(Router);
  popupModal=inject(PopUpService);
  products$: Observable<wardrobesItem[]> = this.outFitService.getProducts();
  products!:wardrobesItem[];
 
  subtitle: string="Elenco dei prodotti disponibili nell'app";
  showGrid: boolean = false;
  customToolbarButtons: ToolbarButton[] = [
    {
      id: 'toFeed',
      name: 'toFeed',
      text: 'Mostra prodotti da feed',
      disabled: false,
      visible: true,
      icon:'mdi mdi-database-import-outline',
      widget: 'button'
    }
  ];
  selectedProdOutfit: any;



  ngOnInit(): void {
    this.loadProduct();


  }

  loadProduct(): void {
    this.showGrid = false
    this.products$.subscribe(async res => {
      
      this.outFitService.setMySignal(res);

      this.products =  this.outFitService.mySignal()
      /* this.products.forEach(ress=>{
        try {
          this.outFitService.updateProductOutfit(ress.id, ress);  
        } catch (error) {
          console.error(error);
        }
        
      }) */
      this.showGrid = true
    });
  }
  repairImages(products:wardrobesItem[]) {
    // Funzione per aggiornare gli URL delle immagini

    return products.map((product:wardrobesItem) => {
      if (product.imageUrl) { // check if ImageUrl is defined
        return {
          ...product, // copia tutte le altre proprietà
          imageUrl: product.imageUrl.replace('http://', 'https://') // sostituzione
        };
      } else {
        return product; // return the product as is if ImageUrl is undefined
      }
    });
  }


  
  editProduct(event: any) {
    event.cancel = true

    this.selectedProdOutfit = event.data
  
    let InstanceData = {
      service: 'outfitProducts',
      editData: event.data
    }

    this.createOrEditCategories(InstanceData)
  }  

  createOrEditCategories(InstanceData:any){

    let guid = Math.random().toString().replace("0.", "");
    this.popupModal.setNewPopUp(guid, 'DynamicFormComponent', null, 800, null, InstanceData, false, true, "Modifica Prodotto", '', false)


    this.popupModal.outputComponent.subscribe(async resulOutputComponent => {
      if (resulOutputComponent.guid == guid && resulOutputComponent.name == 'submitForm') {

        const formData = resulOutputComponent.formData;
        
        let res;
        let dateEdit = new Date();
        if (resulOutputComponent.inEdit) {
     
          formData.createdAt = dateEdit.getTime()
          formData.editedAt = dateEdit.getTime();
          res = this.outFitService.updateProductOutfit(formData.id, formData)
          if(res){
            this.loadProduct()
          }
        } else {
          formData.editedAt = dateEdit.getTime();
          formData.createdAt = dateEdit.getTime()
          //res = await this.outFitService.saveOutfitCategories(formData)
        }

        if (res) {
          
          this.popupModal.destroyCurrentOpenPopUpByGuid(guid);
         
          this.loadProduct()
        }
      }

      if (resulOutputComponent.guid == guid && resulOutputComponent.name == 'cancelForm') {
       
        this.popupModal.destroyCurrentOpenPopUpByGuid(guid);
      }
    })
  }
  async gridEvent(event: any) {
    
    // Gestione eventi nel griglia 
    console.log('Grid Event:', event);
    if (event.name === 'onRowOnlyClick') {
      this.selectProduct.emit(event)
    }

    if (event.name === 'delRows') {
      const rowData = event.rowData
      let resp = await this.outFitService.removeProductOutfit(rowData.id)
      if(resp)
        this.loadProduct()
    }

  }

  async eventToolbarProduct(evt: any) {
    const name = evt.name || evt.id
    switch (name) {
      case 'toFeed':
        this.showFeedProductComponent()
        break;
    
      default:
        break;
    }
  }

  showFeedProductComponent(){
    let guid = Math.random().toString().replace("0.", "");
      let InstanceData = {}
      
      this.popupModal.setNewPopUp(guid, 'ProductFromFeedComponent', null, 1000, null, InstanceData, true, true, "Importa Prodotti",'',true)
      
  
      this.popupModal.outputComponent.subscribe(async resulOutputComponent=>{
        if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'stochiudendo'){

          this.loadProduct()
        }

      })
           
  }

  filterProduct(evt:any){
    console.log(this.products)
    console.log('filterProduct',evt)
    if(evt.name ==="cancelForm"){
      this.loadProduct();
      evt.form.reset();
      return
    }
    const formData = evt.formData as wardrobesItem;

    if(formData.gender){ 

      this.products = this.products.filter(p=>p.gender === formData.gender);
      
    }
    
    if(formData.outfitSubCategory){ 

      this.products = this.products.filter(p=>p.outfitSubCategory === formData.outfitSubCategory);
      return
    }

    

    if(formData.outfitCategory){ 

      this.products = this.products.filter(p=>p.outfitCategory == formData.outfitCategory);
    }
  }
}
