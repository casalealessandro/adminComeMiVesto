import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../interface/app.interface';
import { UserService } from '../../services/user.service';

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
  userProfile !: UserProfile;


  constructor(private menuService: MenuService, private router: Router, private userService: UserService,) {
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
    const utnConnesso = this.userService.InfoUtenteConnesso;
    this.userService.getUserProfile(utnConnesso.uid).subscribe((userProfile: UserProfile) => {
      this.userProfile = userProfile;
      console.log('userProfile', userProfile);
    });
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