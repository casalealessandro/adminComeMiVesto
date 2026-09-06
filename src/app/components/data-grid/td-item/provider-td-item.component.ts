import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { TdItemComponent } from './td-item.component';

/**
 * Temporary compatibility alias while ProviderDataGridComponent still owns a
 * provider-specific component import. Lookup behavior now lives in the shared
 * TdItemComponent and is activated only when GridLookupRegistry is available.
 */
@Component({
  selector: 'app-td-item',
  templateUrl: './td-item.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./td-item.component.scss'],
})
export class ProviderTdItemComponent extends TdItemComponent {}
