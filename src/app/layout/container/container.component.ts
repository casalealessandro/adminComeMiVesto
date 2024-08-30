import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AnagraficaWrapperComponent } from '../anagrafica-wrapper/anagrafica-wrapper.component';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { MenuComponent } from '../menu/menu.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PopupWrapperComponent } from '../../components/modal-popup/modal-popup-wrapper/modal-popup-wrapper.component';



@Component({
  selector: 'app-container',
  standalone:true,
  imports:[
    CommonModule,
    RouterOutlet,
    AnagraficaWrapperComponent,
    FooterComponent,
    HeaderComponent,
    MenuComponent,
    ToolbarComponent,
    PopupWrapperComponent,
    
    
  ],
  templateUrl: './container.component.html',
  styleUrl: './container.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Opzionale, se stai usando Web Components
})
export class ContainerComponent {
  isClose: boolean = false;
  isLogin:boolean = false;
  idTipoUtente: number = -1;
  subMenu: any = null;
  currentMainMenuActive: any;
  showSubMenu: boolean = false;

  
  constructor() {}

  ngOnInit() {

    
  }
  

 
   
}
