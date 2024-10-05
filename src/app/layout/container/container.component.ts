import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, signal, WritableSignal } from '@angular/core';
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
  


  // Signal per tracciare se il menu è aperto o chiuso
  isMenuOpen: boolean= false;

  
  constructor() {}

  ngOnInit() {

    this.updateMenuVisibility(window.innerWidth);
  }
  

 
  // Listener per l'evento resize, per aggiornare la visibilità del menu
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const windowWidth = (event.target as Window).innerWidth;
    this.updateMenuVisibility(windowWidth);
  }

  // Funzione per aggiornare lo stato del menu in base alla risoluzione dello schermo
  updateMenuVisibility(windowWidth: number) {
    if (windowWidth > 1024) {
      this.isMenuOpen = true;  // Su desktop, il menu è sempre aperto
    } else {
      this.isMenuOpen = false;  // Su mobile, il menu è chiuso inizialmente
    }

    console.log(''+this.isMenuOpen )
  }
   
  // Metodo per passare la funzione toggle al componente Header
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen
  }
}
