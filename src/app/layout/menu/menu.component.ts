import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuService } from '../../services/menu.service';
import { NAVIGATION_ITEMS, NavigationItem } from '../../services/navigation-registry';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports:[CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  // allMenu: Array<{ path: string, label: string,icon:string }> = [];
  

  // private router = inject(Router);

  // constructor() {
  //   this.initializeMenu();
  // }

  // private initializeMenu() {
  //   const routes: Routes = this.router.config;

// Modalità del menu: 'side' (a lato), 'over' (sovrapposto), 'push' (spingendo il contenuto)
  mode: 'side' | 'over' | 'push' = 'side';
  // Funzione passata come input per alternare lo stato del menu
  @Input() toggleMenu: () =>void = () => {};
   // Signal readonly che rappresenta lo stato del menu (collegato al servizio)
  getIsMenuOpen = this.menuService.getIsMenuOpen;

    //Construttore : inietta il servvizio del menu e le voci configurate dall'applicazione
    constructor(
      private menuService: MenuService,
      @Inject(NAVIGATION_ITEMS) public allMenu: readonly NavigationItem[]
    ){}
// metodo per navigare a in percorso specifico e chiudere il menu
    navigateTo(route: string) {
      this.menuService.closeMenu(); // Chiude il menu in modalità overlay
    }
  //metodo per alternare lo stato del menu
    toggleMenuState() {
      this.menuService.toggleMenu();
      console.log('Stato del menu aggiornato:', this.menuService.getIsMenuOpen());
    }

}
