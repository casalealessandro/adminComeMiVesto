import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, input, Input, Output,Signal } from '@angular/core';
import { Router, Routes } from '@angular/router';
import {  BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  isMenuOpen = false;
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
   // Observable che rappresenta lo stato del menu (collegato al servizio)
  getIsMenuOpenObservable = this.menuService.getIsMenuOpenObservable;

// Definizione delle voci di menu
     allMenu = [
      { path: 'dashboard', label: 'Dashboard', icon:'mdi mdi-view-dashboard-outline' },
      { path: 'utenti', label:'Utenti Registrati',icon:'mdi mdi-account-multiple-outline' },
    
      { path: 'form-list', label:'Gestione form e viste',icon:'mdi mdi-cog-outline' },
      { path: 'outfit-list', label:'Lista outfit ',icon:'mdi mdi-wardrobe-outline' },
      { path: 'outfit-category', label:'Lista categorie outfit ',icon:'mdi mdi-wardrobe-outline' },
      { path: 'outfit-product-list', label:'Gestione prodotti e feed',icon:'mdi mdi-tshirt-v-outline' }, 
    ]; // }
    //Construttore : inietta il servvizio del menu e il breakpointObserver
    constructor(
      private menuService: MenuService,
      private breakpointObserver: BreakpointObserver
    ){}
    //metodo eseguito al momento dell'inizializzazione del componente
    ngOnInit(): void {
      this.menuService.getIsMenuOpenObservable.subscribe((isOpen) => {
        this.isMenuOpen = isOpen;
      });
    }
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

