import { Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, Inject } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LAYOUT_SESSION_PROVIDER, LayoutSessionProvider } from '../../services/layout-session-provider';

import {  BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import { MenuService } from '../../services/menu.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


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
  isLogin: boolean = false;

// Modalità del menu: 'side' (a lato), 'over' (sovrapposto), 'push' (spingendo il contenuto)
  mode: 'side' | 'over' | 'push' = 'side';


  // Signal per tracciare se il menu è aperto o chiuso
  isMenuOpen: boolean = false;



  constructor(@Inject(LAYOUT_SESSION_PROVIDER) private layoutSessionProvider: LayoutSessionProvider, private menuService: MenuService, private breakpointObserver: BreakpointObserver, private destroyRef: DestroyRef) {

    effect(() => {
      this.isLogin = this.layoutSessionProvider.isAuthenticated();
      this.isMenuOpen = this.menuService.isOpenMenu();
    });
  }

  ngOnInit() {
    void this.layoutSessionProvider.waitForSession().then(isAuthenticated => this.isLogin = isAuthenticated);
    this.updateMenuVisibility(window.innerWidth);
    //osserva i breakpoint (dimensioni dello schermo) per cambiare la modalità del menu
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large])
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(result => {
      console.log('result',result)
      if(result.breakpoints[Breakpoints.XSmall] || result.breakpoints[Breakpoints.Small] ) {
        this.mode = 'over'; //modalita overlay per schermi piccoli
        this.menuService.closeMenu();
      }else if ( result.breakpoints[Breakpoints.Medium]) {
        this.mode = 'side';
        this.menuService.openMenu();
      }
      else {
        this.mode ='push'; //modalita overlay per schermi grandi 
        this.menuService.openMenu();
      }
    });
  }



  // Funzione per aggiornare lo stato del menu in base alla risoluzione dello schermo
  updateMenuVisibility(windowWidth: number) {
    if (windowWidth > 1024) {
      this.menuService.openMenu();
    } else {
      this.menuService.closeMenu();
    }

    console.log('' + this.isMenuOpen)
  }

  closeMenu(): void { this.menuService.closeMenu(); }
}
