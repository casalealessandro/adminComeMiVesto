import { Component, DestroyRef, TemplateRef, ViewChild, Inject } from '@angular/core';
import { MenuService } from '../menu/menu.service';
import { CommonModule } from '@angular/common';
import { OverlayService } from '../../overlay/overlay.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HEADER_CONFIG, HeaderConfig } from '../contracts/header-config';
import { HEADER_USER_PROVIDER, HeaderUser, HeaderUserProvider } from '../contracts/header-user-provider';

@Component({
  selector: 'app-header',
  standalone:true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule]
})


export class HeaderComponent {

  @ViewChild('dynamicContent', { static: false }) dynamicContent!: TemplateRef<any>;

  userProfile?: HeaderUser;


  constructor(private menuService: MenuService, private overlayService: OverlayService, private destroyRef: DestroyRef, @Inject(HEADER_CONFIG) public headerConfig: HeaderConfig, @Inject(HEADER_USER_PROVIDER) private headerUserProvider: HeaderUserProvider) {

  }

  ngOnInit() {
    this.renderHeader();

  }
  renderHeader() {
    this.headerUserProvider.getUser()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((userProfile: HeaderUser | null) => {
      if (!userProfile) return;
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
    const overlayWidth = 220; // Imposta la larghezza dell'overlay (può essere dinamica se necessario)

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
    await this.headerUserProvider.logout();
  }
}
