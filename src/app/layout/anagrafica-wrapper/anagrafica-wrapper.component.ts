import { Component, Input, OnInit, Output, EventEmitter, ViewChild, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


import { Subscription } from 'rxjs';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { CaptionComponent } from '../../components/caption/caption.component';
import { CommonModule } from '@angular/common';
import { ToolbarButton } from '../../interface/app.interface';



@Component({
  selector: 'app-anagrafica-wrapper',
  standalone:true,
  imports:[CaptionComponent,CommonModule],
  templateUrl: './anagrafica-wrapper.component.html',
  styleUrls: ['./anagrafica-wrapper.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AnagraficaWrapperComponent {

  @ViewChild('toolbarTab', { static: true })  toolbarTab!: ToolbarComponent;

  @Input() caption:string=''
  @Input() anaHeight:number=800
  @Input() subTitle:string=''
  @Input() tip:string=''
  @Input() addButtonShow:boolean=false
  @Input() helpDoc:string=''
  @Input() breadcrumbNavigation:any=[]; 
  @Input() showSpinner:boolean= false; 
  @Input() cssClass:string= ''; 
  @Input() customToolbarButtons!:ToolbarButton[]; 

  @Output() emittChiusura: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittEventButton: EventEmitter<any> = new EventEmitter<any>();
  @Output() emitToolbarLeft: EventEmitter<any> = new EventEmitter<any>();



 

  public timeInterval: any = 0;

  heightWrap!: number;
  itemTabs: any = [];
  showItemsTabs:boolean=false
  private tabSubscription: Subscription | undefined;
  
  constructor() {this.setAutoDismiss()}


  ngAfterViewInit(){
    //this.getWindowHeight()
    
  }

// Metodo per chiudere automaticamente l'alert
private setAutoDismiss(): void {
  setTimeout(() => {
    this.tip = '';
  }, 60000); // 1 minuto (60000 ms)
}


  getWindowHeight() {

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.clientHeight;
  
    // Altezza massima tra l'altezza della finestra e l'altezza del documento

    const heightWin  = Math.max(windowHeight, documentHeight);

    let  headerHeight, footerHeight ,menuHeight;
    headerHeight = document.getElementById('header')!.offsetHeight ;
    footerHeight = 200// document.getElementById('footer')!.offsetHeight;
    setTimeout(() => {
      /* menuHeight = document.getElementById('horizontalMenucontainer')!.offsetHeight 
 
      if(menuHeight == 0){
        menuHeight = 60.5
      } */
     
     
      this.heightWrap = heightWin - headerHeight - footerHeight //- menuHeight ;   
      this.heightWrap = this.heightWrap  - 13;
     }, 300);
   
    
  }
  

 
  onCrocettaClick(evt:any) {

    this.emittChiusura.emit(evt);

  }



  buttonToolbarLeft(event: any) {

    this.emitToolbarLeft.emit(event)

  }

  onAddClick(event:any){
    this.emittEventButton.emit(event)
  }

  onButtonToolbarClick(event:any){
    this.emittEventButton.emit(event)
  }
}
