import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AnagraficaWrapperComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent {

}
