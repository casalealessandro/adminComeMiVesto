import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ADMIN_NAVIGATION } from '../../core/navigation/admin-navigation';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  private readonly menuService = inject(MenuService);

  readonly menuItems = inject(ADMIN_NAVIGATION);
  readonly getIsMenuOpenObservable = this.menuService.getIsMenuOpenObservable;

  navigateTo(): void {
    this.menuService.closeMenu();
  }
}
