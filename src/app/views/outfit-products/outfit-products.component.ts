import { Component, inject, signal, Signal } from '@angular/core';
import { AnagraficaWrapperComponent } from "../../layout/anagrafica-wrapper/anagrafica-wrapper.component";
import { DataGridComponent } from "../../components/data-grid/data-grid.component";
import { Colonne, ToolbarButton } from '../../interface/app.interface';
import { Observable } from 'rxjs';
import { OutfitsService, wardrobesItem } from '../../services/outfit.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PopUpService } from '../../services/popup.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-outfit-products',
  standalone: true,
  imports: [CommonModule, AnagraficaWrapperComponent, DataGridComponent],
  templateUrl: './outfit-products.component.html',
  styleUrl: './outfit-products.component.scss'
})
export class OutfitProductsComponent {


  /*
    {
    "outfitCategory": "",
    "link": "https://pdt.tradedoubler.com/click?a(3381907)p(326654)product(44191-0347091683201-I2024)ttid(3)url(https%3A%2F%2Fwww.pullandbear.com%2Fit%2Fcamicia-misto-lino-a-maniche-corte-l03470916%3FcS%3D832)",
    "id": "ec988939-c7d5-409d-ac22-1129c7b0f2b9",
    "color": "G",
    "brend": "Pull&Bear",
    "feedId": 44191,
    "imageUrl": "http://static.pullandbear.net/2/photos/2024/I/0/2/p/3470/916/832/3470916832_4_1_1.jpg?t=1723635023568",
    "gender": "U",
    "price": "35.99",
    "outfitSubCategory": "camicie",
    "name": "Camicia Misto Lino A Maniche Corte"
}
  */

  colProductsGrid: Colonne[]=[
    
      {
        itemType: "group",
        data: [
          {
            type: 'campo',
            edit: false,
            groupDataField: undefined,
            colCaption: 'id',
            dataField: 'id'
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
            edit: false,
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
          },
          {
            type: 'campo',
            edit: false,
            groupDataField: undefined,
            colCaption: 'Brend',
            dataField: 'brend',
          },
          {
            type: 'campoNumber',
            edit: false,
            groupDataField: undefined,
            colCaption: 'Prezzo',
            dataField: 'price',
          },
          {
            type: 'campo',
            edit: false,
            groupDataField: undefined,
            colCaption: 'Prezzo',
            dataField: 'gender',
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

      this.products =  this.outFitService.mySignal();
      this.showGrid = true
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
  gridEvent($event: any) {
    throw new Error('Method not implemented.');
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
}
