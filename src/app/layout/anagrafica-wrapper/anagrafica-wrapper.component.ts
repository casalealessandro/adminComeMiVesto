import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';


import { CaptionComponent } from '../../components/caption/caption.component';
import { CommonModule } from '@angular/common';
import { ToolbarButton } from '../../components/caption/toolbar-button';



@Component({
  selector: 'app-anagrafica-wrapper',
  standalone:true,
  imports:[CaptionComponent,CommonModule],
  templateUrl: './anagrafica-wrapper.component.html',
  styleUrls: ['./anagrafica-wrapper.component.scss']
})
export class AnagraficaWrapperComponent implements OnDestroy {

  @Input() caption:string=''
  @Input() anaHeight:number=800
  @Input() subTitle:string=''
  @Input() tip:string=''
  @Input() addButtonShow:boolean=false
  @Input() showSearchInput:boolean=false
  @Input() showButtonInput:boolean=false
  @Input() helpDoc:string=''
  @Input() breadcrumbNavigation:any=[]; 
  @Input() showSpinner:boolean= false; 
  @Input() cssClass:string= ''; 
  @Input() customToolbarButtons!:ToolbarButton[]; 

  @Output() emittChiusura: EventEmitter<any> = new EventEmitter<any>();
  @Output() emittEventButton: EventEmitter<any> = new EventEmitter<any>();
  @Output() emitEventSearchInput: EventEmitter<any> = new EventEmitter<any>();
  @Output() emitEventButtonInputChange: EventEmitter<any> = new EventEmitter<any>();
  
  public timeInterval: ReturnType<typeof setTimeout> | undefined;
  
  constructor() {this.setAutoDismiss()}

  ngOnDestroy(): void {
    if (this.timeInterval !== undefined) {
      clearTimeout(this.timeInterval);
    }
  }

  // Metodo per chiudere automaticamente l'alert
  private setAutoDismiss(): void {
    this.timeInterval = setTimeout(() => {
      this.tip = '';
    }, 60000); // 1 minuto (60000 ms)
  }

  onCrocettaClick(evt:any) {
    this.emittChiusura.emit(evt);
  }

  onAddClick(event:any){
    this.emittEventButton.emit(event)
  }

  onButtonToolbarClick(event:any){
    this.emittEventButton.emit(event)
  }

  onSearchInputChange(event:any){
    this.emitEventSearchInput.emit(event);
  }

  onButtonInputChange(event:any){
    this.emitEventButtonInputChange.emit(event);
  }
}
