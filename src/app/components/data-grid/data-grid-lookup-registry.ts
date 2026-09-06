import { Injectable } from '@angular/core';

import { GridLookupDataProvider } from './data-grid-lookup-provider';

export interface GridLookupCellOptions {
  providerKey?: string;
  displayExpr?: string;
  valueExpr?: string;
}

export type GridLookupCellConfig = true | string | GridLookupCellOptions;
export type GridLookupProviderMap = Record<string, GridLookupDataProvider<any, any, any>>;

/**
 * Provider-scoped registry used only by the provider DataGrid path.
 *
 * The original TdItem/DataGrid components stay unaware of provider lookup
 * details. A lookup exists only when the provider grid explicitly registers a
 * provider and the column explicitly opts in through `customizedOptions.lookup`.
 */
@Injectable()
export class GridLookupRegistry {
  private providers: GridLookupProviderMap = {};
  private rowResolver?: (rowIndex: number) => unknown;

  setProviders(providers?: GridLookupProviderMap): void {
    this.providers = providers ?? {};
  }

  setRowResolver(resolver?: (rowIndex: number) => unknown): void {
    this.rowResolver = resolver;
  }

  getProvider(dataField: string, lookup: GridLookupCellConfig): GridLookupDataProvider<any, any, any> | undefined {
    let providerKey = dataField;

    if (typeof lookup === 'string') {
      providerKey = lookup;
    } else if (typeof lookup === 'object' && lookup.providerKey) {
      providerKey = lookup.providerKey;
    }

    return this.providers[providerKey];
  }

  resolveRow(rowIndex: any): unknown {
    if (typeof rowIndex !== 'number') return undefined;
    return this.rowResolver?.(rowIndex);
  }

  clear(): void {
    this.providers = {};
    this.rowResolver = undefined;
  }
}
