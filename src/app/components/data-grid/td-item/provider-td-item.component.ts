import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  GridLookupCellConfig,
  GridLookupCellOptions,
  GridLookupRegistry,
} from '../data-grid-lookup-registry';
import { TdItemComponent } from './td-item.component';

/**
 * Provider-only TdItem bridge.
 *
 * It deliberately keeps the original TdItem lifecycle/rendering as the default
 * and resolves a remote display value only when the column explicitly exposes
 * `customizedOptions.lookup` and the provider grid registered a matching
 * lookup provider.
 */
@Component({
  selector: 'app-td-item',
  templateUrl: './td-item.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./td-item.component.scss'],
})
export class ProviderTdItemComponent extends TdItemComponent {
  private readonly lookupRegistry = inject(GridLookupRegistry, { optional: true });

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    void this.resolveProviderLookup();
  }

  async resolveProviderLookup(): Promise<boolean> {
    const lookup = this.colProperty?.customizedOptions?.lookup as GridLookupCellConfig | undefined;

    // Preserve the historic choice made in TdItem: customizedOptions alone
    // never starts a remote lookup. The new provider path is explicit opt-in.
    if (!lookup || !this.lookupRegistry || !this.value) {
      return false;
    }

    const dataField = this.colProperty?.dataField ?? this.dataField;
    if (!dataField) {
      return false;
    }

    const provider = this.lookupRegistry.getProvider(dataField, lookup);
    if (!provider) {
      return false;
    }

    const previousRemoteData = this.remoteData;
    const previousStaticData = this.staticData;
    const previousDisplayExpr = this.displayExpr;

    try {
      const resolvedData = await provider.load({
        value: this.value,
        rowData: this.lookupRegistry.resolveRow(this.rowIndex),
        dataField,
      });

      if (resolvedData === undefined || resolvedData === null) {
        return false;
      }

      const lookupOptions = typeof lookup === 'object'
        ? lookup as GridLookupCellOptions
        : undefined;

      this.remoteData = resolvedData;
      this.displayExpr = lookupOptions?.displayExpr
        ?? this.colProperty?.customizedOptions?.displayExpr
        ?? lookupOptions?.valueExpr
        ?? this.colProperty?.customizedOptions?.valueExpr;

      const displayValue = this.resolveProviderDisplayValue(resolvedData, this.displayExpr);
      this.staticData = this.renderHtmlColumn(displayValue, '');
      return true;
    } catch {
      // Failed provider lookups must not replace the value already rendered by
      // the original TdItemComponent.
      this.remoteData = previousRemoteData;
      this.staticData = previousStaticData;
      this.displayExpr = previousDisplayExpr;
      return false;
    }
  }

  private resolveProviderDisplayValue(data: any, displayExpr?: string): any {
    if (displayExpr && data !== null && typeof data === 'object') {
      return data[displayExpr];
    }

    return data;
  }
}
