import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { HeaderComponent } from '../header/header.component';
import { MenuComponent } from '../menu/menu.component';

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ContainerComponent {
  isClose: boolean = false;
  isLogin: boolean = false;
  idTipoUtente: number = -1;

  mode: 'side' | 'over' | 'push' = 'side';
  getIsMenuOpenObservable = this.menuService.getIsMenuOpenObservable;
  isMenuOpen: boolean = false;

  constructor(
    private auth: AuthService,
    private menuService: MenuService,
    private breakpointObserver: BreakpointObserver
  ) {
    effect(() => {
      this.isLogin = !!this.auth.currentUser();
      this.isMenuOpen = this.menuService.isOpenMenu();
    });
  }

  ngOnInit() {
    void this.auth.waitForUser().then(user => this.isLogin = !!user);
    this.updateMenuVisibility(window.innerWidth);

    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large
    ]).subscribe(result => {
      if (result.breakpoints[Breakpoints.XSmall] || result.breakpoints[Breakpoints.Small]) {
        this.mode = 'over';
        this.menuService.closeMenu();
      } else if (result.breakpoints[Breakpoints.Medium]) {
        this.mode = 'side';
        this.menuService.openMenu();
      } else {
        this.mode = 'push';
        this.menuService.openMenu();
      }
    });
  }

  updateMenuVisibility(windowWidth: number) {
    if (windowWidth > 1024) {
      this.menuService.openMenu();
    } else {
      this.menuService.closeMenu();
    }
  }

  toggleMenu(evt: any) {
    this.menuService.toggleMenu();
  }

  closeMenu(): void {
    this.menuService.closeMenu();
  }
}
