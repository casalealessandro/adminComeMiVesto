import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone:true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule]
})


export class HeaderComponent {
  @Output() toggleMenu = new EventEmitter<void>();
  isDropdownOpen = false;
  showProfileInfo = true;

  constructor(private menuService: MenuService, private router: Router) {
    window.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-info')) {
        this.isDropdownOpen = false;
      }
    });
  }

  ngOnInit() {
    this.renderHeader();
    this.checkRoute();

  }
  renderHeader() {
  }
  onToggleMenu() {
    this.menuService.toggleMenu(); 
  }
  toggleDropDown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  logout() {
    console.log('LOGOUT');
    this.router.navigate(['/login']);
  }

  checkRoute() {
    const currentRoute = this.router.url;
    this.showProfileInfo = currentRoute !== '/login';
  }
}