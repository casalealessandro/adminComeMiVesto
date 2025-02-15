import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, HostListener, signal, WritableSignal } from '@angular/core';
import { AnagraficaWrapperComponent } from '../anagrafica-wrapper/anagrafica-wrapper.component';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { MenuComponent } from '../menu/menu.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PopupWrapperComponent } from '../../components/modal-popup/modal-popup-wrapper/modal-popup-wrapper.component';
import { OverlayComponent } from '../../components/overlay-component/overlay.component';
import { UserService } from '../../services/user.service';

import {  BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import { MenuService } from '../../services/menu.service';


@Component({
  selector: 'app-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    MenuComponent
  ],
  templateUrl: './container.component.html',
  styleUrl: './container.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Opzionale, se stai usando Web Components
})
export class ContainerComponent {
  isClose: boolean = false;
  isLogin: boolean = false;
  idTipoUtente: number = -1;

// Modalità del menu: 'side' (a lato), 'over' (sovrapposto), 'push' (spingendo il contenuto)
  mode: 'side' | 'over' | 'push' = 'side';
   // Observable che rappresenta lo stato del menu (collegato al servizio)
  getIsMenuOpenObservable = this.menuService.getIsMenuOpenObservable;


  // Signal per tracciare se il menu è aperto o chiuso
  isMenuOpen: boolean = false;



  constructor(private userService: UserService, private menuService: MenuService, private breakpointObserver: BreakpointObserver) {

    effect(() => {
      this.isLogin = this.userService.isLoginUser();
    });
  }

  ngOnInit() {
    this.isLogin = this.userService.isLoggedUser();
    this.updateMenuVisibility(window.innerWidth);
    //osserva i breakpoint (dimensioni dello schermo) per cambiare la modalità del menu
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large])
    .subscribe(result => {
      console.log('result',result)
      if(result.breakpoints[Breakpoints.XSmall] || result.breakpoints[Breakpoints.Small] ) {
        this.mode = 'over'; //modalita overlay per schermi piccoli
        
      }else if ( result.breakpoints[Breakpoints.Medium]) {
        this.mode = 'side';
      }
      else {
        this.mode ='push'; //modalita overlay per schermi grandi 
      }
    });
  }



  /*  // Listener per l'evento resize, per aggiornare la visibilità del menu
   @HostListener('window:resize', ['$event'])
   onResize(event: Event) {
     const windowWidth = (event.target as Window).innerWidth;
     this.updateMenuVisibility(windowWidth);
   } */

  // Funzione per aggiornare lo stato del menu in base alla risoluzione dello schermo
  updateMenuVisibility(windowWidth: number) {
    if (windowWidth > 1024) {
      this.isMenuOpen = true;  // Su desktop, il menu è sempre aperto
    } else {
      this.isMenuOpen = false;  // Su mobile, il menu è chiuso inizialmente
    }

    console.log('' + this.isMenuOpen)
  }

  // Metodo per passare la funzione toggle al componente Header
  toggleMenu(evt: any) {
    this.isMenuOpen = !this.isMenuOpen
  }
}
