import { AfterViewInit, Component, ComponentRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, Type, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { PopUpService } from '../../../services/popup.service';
import { CaptionComponent } from '../../caption/caption.component';
import { CommonModule } from '@angular/common';

export interface infoPopUp{
  popUpWidth: string; 
  showCaptionHeader: boolean;
  showCaptionFooter: boolean; 
  title: any; 
  isClosable:boolean;
  class: any;
  componentName: any; 
  accessoringData: any;
  position: string; 
  dataToSend: any; 
  id: any; 
  instancedData: any; 
}


@Component({
  selector: 'app-modal-popup-content',
  templateUrl: './modal-popup-content.component.html',
  standalone:true,
  imports:[CaptionComponent,CommonModule],
  styleUrls: ['./modal-popup-content.component.scss']
})

export class NicaPopupContentComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() infoPopUp!:infoPopUp;
  @Input() index: any;
  @Input() componentName!: string;
  @Input() classePopup: any;
  @Output() outputEmit: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno

  // @ViewChild('containerComponent', { static: false, read: ViewContainerRef }) containerComponent: ViewContainerRef;
  @ViewChild("containerComponent", { static: true, read: ViewContainerRef })
  containerComponent!: ViewContainerRef;
  component: any
  componentRef!: Array<ComponentRef<any>>;
  showCaptionHeader: boolean = false;
  showCaptionFooter: boolean = false;
  isPanelVisible: boolean = false;
  zIndex: number = 500;
  zIndexModalDialog!: number;
  classFade: any;
  popUpWidth: any = null
  accessoringData: any;
  titlePopUp: any;
  idPopUp: any;
  isClosablePopUp:boolean=false
  position='center'
  constructor(

    private popUpService: PopUpService
  ) { }


  ngOnChanges(changes: SimpleChanges) {
    //console.log('changes-->',changes)
    if (this.infoPopUp.popUpWidth) {
      this.popUpWidth = this.infoPopUp.popUpWidth + 'px';
    }
    if (this.infoPopUp.showCaptionHeader) {
      this.showCaptionHeader = this.infoPopUp.showCaptionHeader ;
    }
    if (this.infoPopUp.showCaptionFooter) {
      this.showCaptionFooter = this.infoPopUp.showCaptionFooter ;
    }
    if (this.infoPopUp.title) {
      this.titlePopUp = this.infoPopUp.title ;
    }

    if(this.infoPopUp.class){
      this.classFade = this.infoPopUp.class
      
    }

  }
  get getMaxZIndex() {
    let element  = document.querySelectorAll('.modal');
    let allZIndex: number[] = []
    element.forEach(el=>{
      if(!el.classList.contains('modal-dialog')){
        allZIndex.push(parseFloat(window.getComputedStyle(el).zIndex))
      }
    })

    return Math.max(...allZIndex);

    return Math.max(
      ...Array.from(document.querySelectorAll('div.dx-overlay-content'), el =>
       
        parseFloat(window.getComputedStyle(el).zIndex),
      ).filter(zIndex => !Number.isNaN(zIndex)),
      0,
    );
  }
  async ngOnInit() {
    //https://interactjs.io/docs/draggable/

    this.isPanelVisible = true;
    //per ricordarsi di quello che è stato...
   /*  if(this.getMaxZIndex > 1501){
      this.zIndex = this.getMaxZIndex + 1;
    }
    */

    
    

    this.zIndexModalDialog = this.getMaxZIndex +1;
    /*
     Create a style element
    const style = document.createElement('style');

    // Define CSS rules
    const css =  '::ng-deep.dx-overlay-wrapper { z-index:'+ this.zIndexModalDialog +'!important; }';

    // Add CSS rules to the style element
    style.appendChild(document.createTextNode(css));

    // Append the style element to the document head
    document.head.appendChild(style);
    */

    const componentName = this.infoPopUp.componentName

    this.accessoringData = this.infoPopUp.accessoringData

    this.position = this.infoPopUp.position;

    
    /*const imported = await import(`'../'${component}`)  // Array.from(this._componentFactoryResolver['_factories'].keys());
    const factoryClass = <Type<any>> inject()
    if(typeof factoryClass == 'undefined'){
      
      alert("Attenzione c'è stato un problema")
      return
    }*/
    //const componentFactory: ComponentFactory<any> = this._componentFactoryResolver.resolveComponentFactory(factoryClass);

    //this.containerComponent.remove()

    let component = this.popUpService.getComponentByName(componentName)
    let instComponent = this.containerComponent.createComponent(component)
    instComponent.instance['itemData'] = this.infoPopUp.dataToSend;


    instComponent.instance['cssClass'] = 'modal-content '
    
    
    this.componentName = componentName;

    this.idPopUp = this.infoPopUp.id;
    if (this.infoPopUp.popUpWidth) {
      this.popUpWidth = this.infoPopUp.popUpWidth + 'px';
    }
    if (this.infoPopUp.showCaptionHeader) {
      this.showCaptionHeader = this.infoPopUp.showCaptionHeader ;
    }
    if (this.infoPopUp.showCaptionFooter) {
      this.showCaptionFooter = this.infoPopUp.showCaptionFooter ;
    }
    if (this.infoPopUp.title) {
      this.titlePopUp = this.infoPopUp.title ;
    }

    if(this.infoPopUp.class){
      this.classFade = this.infoPopUp.class
      /* for(let i= 0;document.getElementsByClassName("modal").length;i++){

        //es. aggiunta classe per fadein
        document.getElementsByClassName("modal").item(i).classList.add(this.infoPopUp.class);


      } */

    }

    this.isClosablePopUp = typeof this.infoPopUp.isClosable != 'undefined' ? this.infoPopUp.isClosable : false;


    const instancedComponent = instComponent.instance
    
    

    if(typeof this.infoPopUp.instancedData != 'undefined'){
        
      const instancedDatas = this.infoPopUp.instancedData
      for(let instancedData in instancedDatas){
       instancedComponent[instancedData] = instancedDatas[instancedData];

//       console.log('Event-->'+instancedData);
       
      }
      
      //console.log('Event-->'+instancedComponent)
    }

    for (let allEvent in instancedComponent) {
      
                

      if (instComponent.instance[allEvent] instanceof EventEmitter) {

       

        (instComponent.instance[allEvent] as EventEmitter<any>).subscribe(
         
          (res) => {
           
            try{
              let newRes
              if(typeof res == 'boolean'){
                newRes = {
                  componentName:componentName,
                  accessoringData:this.accessoringData,
                  guid:this.idPopUp,
                  name:allEvent
                }
                res = newRes
              }else{
                res.componentName = componentName;
                res.accessoringData = this.accessoringData;
                res.guid = this.idPopUp
                 if(typeof res.name =='undefined'){
                  res.name = allEvent
                 } 
              }
              
            }catch(ex){

              //console.error("WHHOOOPPPSSS DEVI METTERE IL DISCO NEL TUO COMPUTER");
            }
            finally{
              this.popUpService.setOutputComponent(res)


            }

          }
        )

      }
    }

    /* (instComponent.instance.onAllEvent as EventEmitter<any>).subscribe(

      (res) => {
        res.componentName = component;
        res.accessoringData = this.accessoringData
        this.popUpService.setOutputComponent(res)

      }
    )

 */

    //var myModal = new bootstrap.Modal(document.getElementById('myModal'), options)

  }
 


  ngAfterViewInit() {




  }

  emettiChiusura($event: any){

    
    if(!this.idPopUp){
      this.popUpService.destroyCurrentOpenPopUp(this.componentName);
    }else{
      this.popUpService.destroyCurrentOpenPopUpByGuid(this.idPopUp);
    }
    
    this.popUpService.destroyOutputComponent();


  }
  /*
   

    const componentFactory: ComponentFactory<any> = this._componentFactoryResolver.resolveComponentFactory(factoryClass);


    setTimeout(() => {


      this.componentRef = this.containerComponent.createComponent(componentFactory);
      this.componentRef.instance.itemData = dataToSend;


      (this.componentRef.instance.emittendSelectionMultipleRow as EventEmitter<any>).subscribe(

        (res) => {

          let e = res;
          let component = res.component;
          let key = component.dataField;
          let newItem;
          let masterKey = this.masterKey;
          this.datasource[this.currEditIndx][key] = null;

          let indx = 0;
          if (typeof masterKey != 'undefined') {
            if (!this.datasource[this.currEditIndx][masterKey]) {
              this.dynamicGridComponent.instance.editCell(this.currEditIndx, masterKey)
              this.isPanelVisible = false;
              //this.onEditCanceled(e)
              return
            }

          }

          let dataSourceCheck = this.datasource.filter(ress => ress[masterKey] != null)


          for (let x in dataSourceCheck) {
            e.data.map(res => {
              if (dataSourceCheck[x][masterKey] == res[masterKey]) {
                indx++
              }
            })


          }
          let valueCheck
          if ((indx > 0)) {
            valueCheck = dataSourceCheck[indx][masterKey]
            notify({
              message: 'Valore: ' + valueCheck + ' è già presente!',
              height: 55,
              width: 450,
              position: 'center center'

            }, 'warning', 3000);
            //this.dynamicGridComponent.instance.editCell(this.currEditIndx, campo.dataField)
            this.dynamicGridComponent.instance.cellValue(this.currEditIndx, masterKey, null)
            //const element = this.dynamicGridComponent.instance.getCellElement(this.currEditIndx, campo.dataField)
            //this.dynamicGridComponent.instance.focus(element);

            return

          }

          if (e.data.length > 0) {

            newItem = { ...this.datasource[this.currEditIndx], [key]: e.data }

            this.datasource[this.currEditIndx] = newItem;

            this.dynamicGridComponent.instance.cellValue(this.currEditIndx, campo.dataField, e.data);

          } else {
            newItem = { ...this.datasource[this.currEditIndx], [key]: '' }
            this.datasource[this.currEditIndx] = newItem;
            this.dynamicGridComponent.instance.cellValue(this.currEditIndx, campo.dataField, null);

            this._overlaySidePanelService.close();
            this.dynamicGridComponent.instance.editCell(this.currEditIndx, campo.dataField)

            const element = this.dynamicGridComponent.instance.getCellElement(this.currEditIndx, campo.dataField)
            this.dynamicGridComponent.instance.focus(element);
            return

          }

         

          let related = e.related;

          if (related) {
            e.component.dynamic.related.forEach((value, key) => {

              this.datasource[this.currEditIndx][value] = related[value];
              //this.dynamicGridComponent.instance.cellValue(this.currEditIndx, campo.dataField, related[value]);
            })

          }



          if (e.name == 'saveMultipleSelectionsRowGrid') {
            this.isPanelVisible = false;
            this.containerComponent.clear();
            this.onEditCanceled(e);
            this.dynamicGridComponent.instance.saveEditData()
          }

        }
      );


      (this.componentRef.instance.emittendSelectionRow as EventEmitter<any>).subscribe(


        (res) => {

          let e = res;
          let valueExpr = e.component.dynamic.valueExpr != '' ? e.component.dynamic.valueExpr : e.component.dynamic.displayExpr
          let displayExpr = e.component.dynamic.displayExpr
          let value


          let masterKey = this.masterKey;
          let index = 0

          if (Array.isArray(e.data)) {

            value = e.data;

          } else {
            if (Array.isArray(displayExpr)) {
              value = e.data['displayExpr'].join(' - ');
            } else {
              value = e.data[valueExpr];
            }
          }




          let descrizione = '';

          if (e.component.dynamic.valueExpr != '') {
            descrizione = e.data[displayExpr]
          }

          let dataSourceCheck = this.datasource.filter(ress => ress[masterKey] != null)
          let indx = 0


          if (typeof masterKey != 'undefined') {
            if (masterKey != '') {
              if (!this.datasource[this.currEditIndx][masterKey] && campo.dataField != masterKey) {
                this.dynamicGridComponent.instance.editCell(this.currEditIndx, masterKey)
                this.isPanelVisible = false;
                //this.onEditCanceled(e)
                return
              }
            }


          }

          for (let x in dataSourceCheck) {
            //console.log(this.datasource[x][masterKey])
            if (dataSourceCheck[x][masterKey] == value) {
              indx++
              index = parseInt(x)
            }

          }
          let valueCheck
          if ((indx > 0)) {

            valueCheck = dataSourceCheck[index][masterKey]
            notify({
              message: 'Valore: ' + value + ' è già presente!',
              height: 55,
              width: 450,
              position: 'center center'

            }, 'warning', 3000);


            return

          }


          let key = e.component.dataField;

        

          let related = e.component.dynamic.related

          const keyVariable = key;
          const valueArray = value;

          const newItem = { ...this.datasource[this.currEditIndx], [keyVariable]: valueArray };

          this.datasource[this.currEditIndx] = newItem

          this.dynamicGridComponent.instance.cellValue(this.currEditIndx, campo.dataField, valueArray)

          if (e.component.costantValue) {

            e.component.costantValue.forEach(values => {
              this.datasource[this.currEditIndx][values.key] = values.value;
            })

          }
          if (e.data.related) {

            let rel = e.data.related
            let newItem;
            let newItemDesc;
            related.forEach((values, key) => {
              let arrayValue = values.split('|')
              if (arrayValue.length > 1) {
                newItem = { ...this.datasource[this.currEditIndx], [arrayValue[1]]: rel[arrayValue[1]] };

                this.dynamicGridComponent.instance.cellValue(this.currEditIndx, arrayValue[1], rel[arrayValue[1]])
              } else {
                newItem = { ...this.datasource[this.currEditIndx], [values]: rel[values] };
                this.dynamicGridComponent.instance.cellValue(this.currEditIndx, values, rel[values])

              }


              this.datasource[this.currEditIndx] = newItem

            })

          }


          this.isPanelVisible = false;
          this.containerComponent.clear();
          this.dynamicGridComponent.instance.saveEditData()
          this.onEditCanceled(e)
        }

      );


      (this.componentRef.instance.emittedToolbarEvent as EventEmitter<any>).subscribe(
        (res) => {


          if (res == 'close') {


            if (this.containerComponent) {

              //console.warn('stoo chiudendo nidificato',this.isPanelVisible)

              this.containerComponent.clear();

            }

            this.isPanelVisible = false;
          }



        }
      )


    }, 500);


  
  */

}
