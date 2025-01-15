import { Component, EventEmitter, Input, Output, output, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../../interface/app.interface';
import { UserService } from '../../services/user.service';
import { OverlayService } from '../../services/overlay.service';

@Component({
  selector: 'app-header',
  standalone:true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule]
})


export class HeaderComponent {

  @ViewChild('dynamicContent', { static: false }) dynamicContent!: TemplateRef<any>;

  @Output() toggleMenu = new EventEmitter<void>();

  showProfileInfo = true;
  userProfile !: UserProfile;


  constructor(private menuService: MenuService, private router: Router, private userService: UserService, private overlayService: OverlayService) {
   
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
  
 

  toggleDropDown(event: any): void {
    
    event.stopPropagation();
    //event.preventDefault();
    
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const position = { 
      top: rect.bottom + window.scrollY, // Posiziona l'overlay sotto il bottone
      left: rect.left + window.scrollX
    };
    // Calcola la larghezza della finestra e controlla che l'overlay non esca dal lato destro
    const windowWidth = window.innerWidth;
    const overlayWidth = 40; // Imposta la larghezza dell'overlay (può essere dinamica se necessario)

    // Se l'overlay va fuori dalla finestra, correggiamo la posizione
    if (position.left + overlayWidth > windowWidth) {
      position.left = windowWidth - overlayWidth - 10; // Imposta un piccolo margine
    }

    const data = {
      position: position,
      contentTemplate:this.dynamicContent,
      showBgOverlay:false,
      index:0

    }
    // Creazione dinamica dell'overlay
    this.overlayService.openOverlay(data) 
    
  }

  toggleDropDownF(event: any): void {
    this.overlayService.closeOverlay()
  }

  async logout() {
    console.log('LOGOUT');
    const uid = this.userProfile.uid
    const isLogout = await this.userService.LogOut(uid);
    if(isLogout)
      this.router.navigate(['/login']);
  }

  checkRoute() {
    const currentRoute = this.router.url;
    this.showProfileInfo = currentRoute !== '/login';
  }
}