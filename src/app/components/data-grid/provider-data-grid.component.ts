import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { CustomScrollbarComponent } from '../custom-scrollbar/custom-scrollbar.component';
import { GridLookupRegistry } from './data-grid-lookup-registry';
import { DataGridComponent } from './data-grid.component';
import { TdItemComponent } from './td-item/td-item.component';

/**
 * Temporary compatibility alias while consumers migrate from
 * `app-provider-data-grid` to the single provider-aware `app-data-grid`.
 *
 * Provider-neutral behavior now lives in DataGridComponent + DataGridEngine;
 * this subclass intentionally owns no runtime override.
 */
@Component({
  selector: 'app-provider-data-grid',
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TdItemComponent,
    CustomScrollbarComponent,
  ],
  providers: [GridLookupRegistry],
})
export class ProviderDataGridComponent<T = any> extends DataGridComponent<T> {
  constructor() {
    super();
    this.providerFacadeActive = true;
  }
}
