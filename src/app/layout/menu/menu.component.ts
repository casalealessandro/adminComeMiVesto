import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  allMenu: Array<{ path: string, label: string,icon:string }> = [];
  private router = inject(Router);

  constructor() {
    this.initializeMenu();
  }

  private initializeMenu() {
    const routes: Routes = this.router.config;

    this.allMenu = [
      { path: 'dashboard', label: 'Dashboard', icon:'mdi mdi-view-dashboard-outline' },
      { path: 'utenti', label:'Utenti Registrati',icon:'mdi mdi-account-multiple-outline' },
      { path: 'form-list', label:'Gestione form e viste',icon:'mdi mdi-cog-outline' },
    ]

  }


}
