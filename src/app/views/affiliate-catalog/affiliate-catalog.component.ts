import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AnagraficaWrapperComponent } from '../../core/layout/anagrafica-wrapper/anagrafica-wrapper.component';

@Component({
  selector: 'app-affiliate-catalog',
  standalone: true,
  imports: [AnagraficaWrapperComponent, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './affiliate-catalog.component.html',
  styleUrl: './affiliate-catalog.component.scss',
})
export class AffiliateCatalogComponent {}
