import { Component } from '@angular/core';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';

@Component({
  selector: 'app-affiliate-catalog',
  standalone: true,
  imports: [AnagraficaWrapperComponent],
  templateUrl: './affiliate-catalog.component.html',
  styleUrl: './affiliate-catalog.component.scss',
})
export class AffiliateCatalogComponent {}
