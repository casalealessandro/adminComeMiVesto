import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PopUpService } from '../../services/popup.service';
import { outfit, OutfitsService } from '../../services/outfit.service';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne, ToolbarButton, UserProfile } from '../../interface/app.interface';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';




@Component({
  selector: 'app-outfits',
  standalone: true,
  imports: [CommonModule,DataGridComponent,AnagraficaWrapperComponent],
  templateUrl: './outfits.component.html',
  styleUrl: './outfits.component.scss'
})



export class OutfitsComponent {

  private outfitService=inject(OutfitsService)
  showGrid:boolean = false;
  showSpinner:boolean=false;
  // Lista degli aoutfit creati e presenti su DB
  
  outfits = this.outfitService.resultsSignal();
  selectedOutfit: outfit | undefined;
  
  subtitle: string = `Elenco outfit creati nell' app`;
  
  propertiesModal= inject ( PopUpService ); 
  router= inject ( Router ); 

  colOutfitsGrid:Colonne[]=[
    {
      itemType: "group",
      data: [
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: "title",
          colWidth: '300',
          caption: "Titolo",
        
          colCaption: 'Titolo',
          class:'outfit-title',
          edit: false,
          groupDataField: undefined,
      
        },

        {
          type: 'campoImg',
          colVisible: true,
          allowEditing: true,
          dataField: "imageUrl",
          colWidth: '150',
          class:'outfit-image',
        
          colCaption: 'Immagine',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,
          
        },
    /*     {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: "userId",
          colWidth: '120',
          caption: "utente",
        
          colCaption: 'Utente',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,
          
        }, */
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: "userName",
          colWidth: '120',
          caption: "utente",
        
          colCaption: 'Utente',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,
          
        },
        {
          type: 'campoDateTime',
          colVisible: true,
          allowEditing: true,
          dataField: "createdAt",
          colWidth: '70',
          caption: "Creazione",
        
          colCaption: 'Creazione',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,
          
        },
        {
          type: 'campoDateTime',
          colVisible: true,
          allowEditing: true,
          dataField: "editedAt",
          colWidth: '70',
        
          colCaption: 'Modifica',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,
          
        },
        {
          type: 'campo',
          colVisible: true,
          allowEditing: true,
          dataField: "status",
          colWidth: '80',
          caption: "Stato",
        
          colCaption: 'Stato',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,
          
        },
        {
          type: 'campoButton',
          colVisible: true,
          allowEditing: true,
          dataField: "",
          colWidth: '40',
          caption: "Approva",
          colCaption: 'Stato',
          allowFiltering: undefined,
          labelAlignment: undefined,
          edit: undefined,
          groupDataField: undefined,
          button: {
            text: '',
            name: 'cambiaStato',
            class:'customBrightness',
            location: 'after',
            event: "cambiaStato",
            hint: "Approva l'outfit",
            icon: "mdi mdi-shield-check",
          },
          
        }
      ],
      groupDataField: ''
    }
  ];

  customToolbarButtons: ToolbarButton[] = [
    {
      id: 'toJSON',
      name: 'toJSON',
      text: 'Importa da Jsn',
      disabled: false,
      visible: true,
      icon:'mdi mdi-database-import-outline',
      widget: 'button'
    },
    {
      id: 'testLogin',
      name: 'login',
      text: 'Login',
      disabled: false,
      visible: true,
      icon:'mdi mdi-database-import-outline',
      widget: 'button'
    }
  ];

   async ngOnInit(){
        
    await this.loadOutfits()
    // Carica gli utenti dalla collezione 'users' di Firestore

    
  }

  ngAfterViewInit(){
    //this.colOutfitsGrid = 
  }

  async loadOutfits(){
    this.showGrid = false
    let newOutfits = await this.outfitService.getOutfits(undefined,[{
    
      field: 'createdAt',
      by: 'desc'
    }]);
    this.outfits =  newOutfits;
    // Usa Promise.all per risolvere tutte le Promises restituite da getUserInfo
      const outfitPromises = this.outfits.map(async (outfit) => {
        const userInfo = await this.getUserInfo(outfit.userId);
        outfit['userName'] = !userInfo.displayName ? userInfo.email : userInfo.displayName ; // Imposta il nome utente o altra informazione utile
        return outfit; // Torna l'outfit modificato
    });

    // Aspetta che tutte le Promises siano risolte
    await Promise.all(outfitPromises);
    this.showGrid = true
  }


  async getUserInfo(userId:string): Promise<Partial<UserProfile>> {
    let userInfo: UserProfile[] = await this.outfitService.getOutfitUser(userId);
    return userInfo[0];
  }

  async eventToolbarOutfit(evt:any) {
    const name = evt.name || evt.id;
    console.log('eventToolbarOutfit',name)
    switch (name) {
      case 'toJSON':
        this.showSpinner= true
        let cc = await  this.outfitService.JsonOutfits()
        if(cc){
          this.showSpinner= false;
          this.loadOutfits()
        }
        break;
      case 'addButton':
        this.router.navigate(['/outfit-detail']);
        //this.editOutfit();
        break  
      case 'login':
       this.outfitService.login()
        break  
      default:
        break;
    }
    //throw new Error('Method not implemented.');
  }

  editOutfit(event?: any) {
    if(typeof event != 'undefined' && event){
      event.cancel = true;
      this.selectedOutfit = event.data as outfit;
      this.router.navigate(['/outfit-detail',this.selectedOutfit.id]);
      return
    }
   


    let guid = Math.random().toString().replace("0.", "");
      let InstanceData = {
        service:'outfitFormAdmin',
        editData:this.selectedOutfit
      }
      
      this.propertiesModal.setNewPopUp(guid, 'DynamicFormComponent', null, 800, null, InstanceData, false, true, "Modifica Outfit",'',false)
      
  
      this.propertiesModal.outputComponent.subscribe(async resulOutputComponent=>{
        if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'submitForm'){
           
          const formData = resulOutputComponent.formData;
          let res;
          let dateEdit = new Date();
          if(resulOutputComponent.inEdit){
            const color = !formData.color ? [] : formData.color
            formData.color = color
            formData.editedAt =  dateEdit.getTime()
            res = await this.outfitService.updateInCollection(this.selectedOutfit?.id,formData)
          }else{
            formData.createdAt =  dateEdit.getTime()
            res = await  this.outfitService.saveOutfitCollection(undefined,formData)
          }
          
          if(res){
            this.selectedOutfit = undefined
            this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
            this.loadOutfits()
          }
        }
  
        if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'cancelForm'){
          this.selectedOutfit = undefined
          this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
        }
      })
  }



  gridEvent(event: any){
    console.log('gridEvent-->',event);

    const eventName = event.name;
    const rowData:outfit = event.rowData
    switch (eventName) {
      case "delRows":
        this.removeOutfit(rowData.id)
        break;
    
      default:
        break;
    }
  }

  async approveOutfit(event: any){
    console.log('approveOutfit',event)
    if(event.name == "cambiaStato"){
      const rowData:outfit = event.rowData
      if(rowData.status != "approved")
        rowData.status = 'approved'
        const   res = await this.outfitService.updateInCollection(rowData?.id,rowData);
        if(res){
          this.showGrid = false;
          this.loadOutfits()
        }
    }
    //formData.editedAt =  dateEdit.getTime()
    //
  }

  async removeOutfit(id: any){
  
    if(id){
     
        const  res = await this.outfitService.removeOutfit(id);
        if(res){
  
          this.loadOutfits()
        }
    }
    //formData.editedAt =  dateEdit.getTime()
    //
  }
}
