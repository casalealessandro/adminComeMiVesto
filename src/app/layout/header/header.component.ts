import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserProfile } from '../../interface/app.interface';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { OverlayService } from '../../services/overlay.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule]
})
export class HeaderComponent {
  @ViewChild('dynamicContent', { static: false }) dynamicContent!: TemplateRef<any>;

  showProfileInfo = true;
  userProfile?: UserProfile;

  constructor(
    private menuService: MenuService,
    private router: Router,
    private userService: UserService,
    private auth: AuthService,
    private overlayService: OverlayService
  ) {}

  ngOnInit(): void {
    this.renderHeader();
    this.checkRoute();
  }

  renderHeader(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.userService.getUserProfile(user.uid).subscribe((userProfile: UserProfile) => {
      this.userProfile = userProfile;
    });
  }

  onToggleMenu(): void {
    this.menuService.toggleMenu();
  }

  toggleDropDown(event: any): void {
    event.stopPropagation();

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const position = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    };

    const overlayWidth = 220;
    if (position.left + overlayWidth > window.innerWidth) {
      position.left = window.innerWidth - overlayWidth - 10;
    }

    this.overlayService.openOverlay({
      position,
      contentTemplate: this.dynamicContent,
      showBgOverlay: false,
      index: 0
    });
  }

  toggleDropDownF(_event: any): void {
    this.overlayService.closeOverlay();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  checkRoute(): void {
    this.showProfileInfo = this.router.url !== '/login';
  }
}
