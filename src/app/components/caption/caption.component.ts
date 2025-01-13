import { Component,Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ToolbarButton } from '../../interface/app.interface';



class _tasto{
  id:any;
  text?:string;
  icon?:string;
  disabled?:boolean;
  image?:string;
  separator?:boolean;
  visible?:boolean | Function;
  hint?:string;
  name?:string
  location?:'before' | 'center' | 'after';
  widget:string = 'button' 
}


@Component({
  selector: 'app-caption',
  standalone:true,
  imports:[CommonModule],
  templateUrl: './caption.component.html',
  styleUrls: ['./caption.component.scss']
})
export class CaptionComponent {


  /** Titolo da mostrare */
  @Input() caption: string='';
  @Input() cssClass: string='';

  @Input() showBreadcrumb?:boolean=false;
  @Input() breadcrumbNavigation?:any;



  /** Specifica che si tratta solo del footer e ne altera lo stile */
  @Input() isFooter: boolean = false;
 
 


  /** Di default si può chiudere (true) */
 @Input() isClosable: boolean = true;
  
 //Mostra i bottone aggiungi
 @Input() addButtonShow: boolean = false;
 //Buttoni aggiuntivi
 @Input() customToolbarButtons!:ToolbarButton[]
 
  /** URL HELPER */
  @Input() help: string = "";
  @Input() idHelper: number = 0;


  @Output() emitHelperClick: EventEmitter<any> = new EventEmitter<any>();
  
  @Output() emitChiusura: EventEmitter<any> = new EventEmitter<any>();
  @Output() emitAddEvent: EventEmitter<any> = new EventEmitter<any>();
  @Output() emitToolbarButtonClick: EventEmitter<any> = new EventEmitter<any>();
  
  
  @Output() emitBreadCrumbClick : EventEmitter<any> = new EventEmitter<any>();
  

  addButton:ToolbarButton =
    {
      id: 'addButton',
      name: 'addButton',
      text: 'Aggiungi',
      disabled: false,
      visible: this.addButtonShow,
      icon:'mdi mdi-pencil-outline',
      widget: 'button'
    }
  
  

  hideShowToolbarMenu(ev: any){

    this.emitChiusura.emit('closeToolbar')
  }

  
  
  onClickCrocetta(ev:any) {
  
    this.emitChiusura.emit(ev);
    
  }

  onClickAddButton(ev:any) {
    
   
    this.emitAddEvent.emit(ev);
    
  }


  showDropdownMenu(ev: any, id: any) {
    
    
    let elememt = document.getElementById(id);

    if(elememt != null){
      if (!elememt.classList.contains('show')) {
        elememt.classList.add('show')
      }
    }

    

  }
 
  hideDropdownMenu(ev: any, id: string) {
    let elememt = document.getElementById(id);
    if(elememt != null){
      elememt.classList.remove('show')
    }
  }

  onBreadCrumbClick(event: any, item: { [x: string]: any; params: { service: any; }; idGroup: any; }, i:number = 0) {
    

    

  }

   onBreadCrumbRemoveClick(event: any,item: { id: any; params: { currentTabId: any; }; },i: number){
    
   
  }

  emitHelpClick(evt: any) {
    // if(this.help>""){
    

  }

  toolbarButtonClick(ev: any) {

    this.emitToolbarButtonClick.emit(ev)
  }
  

  
}


