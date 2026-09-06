import { Injectable } from '@angular/core';

import {
  GridLookupDataProvider,
  GridLookupRequest,
} from './data-grid-lookup-provider';

export interface GridLookupCellOptions {
  providerKey?: string;
  displayExpr?: string;
  valueExpr?: string;
  cache?: boolean;
  cacheKey?: (request: GridLookupRequest<any, any>) => string;
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
  private cache = new Map<string, unknown>();
  private pendingLoads = new Map<string, Promise<unknown>>();
  private cacheVersion = 0;
  private providerCacheVersions = new Map<string, number>();

  setProviders(providers?: GridLookupProviderMap): void {
    const nextProviders = providers ?? {};

    if (this.providers !== nextProviders) {
      this.clearCache();
    }

    this.providers = nextProviders;
  }

  setRowResolver(resolver?: (rowIndex: number) => unknown): void {
    this.rowResolver = resolver;
  }

  getProvider(dataField: string, lookup: GridLookupCellConfig): GridLookupDataProvider<any, any, any> | undefined {
    return this.providers[this.resolveProviderKey(dataField, lookup)];
  }

  async load(
    dataField: string,
    lookup: GridLookupCellConfig,
    request: GridLookupRequest<any, any>,
  ): Promise<unknown> {
    const providerKey = this.resolveProviderKey(dataField, lookup);
    const provider = this.providers[providerKey];
    if (!provider) return undefined;

    const lookupOptions = typeof lookup === 'object'
      ? lookup as GridLookupCellOptions
      : undefined;

    if (!lookupOptions?.cache) {
      return provider.load(request);
    }

    const cacheKey = this.buildCacheKey(providerKey, dataField, request, lookupOptions);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const pendingLoad = this.pendingLoads.get(cacheKey);
    if (pendingLoad) {
      return pendingLoad;
    }

    const currentCacheVersion = this.cacheVersion;
    const currentProviderCacheVersion = this.providerCacheVersions.get(providerKey) ?? 0;

    const loadPromise = provider.load(request)
      .then(result => {
        const sameCacheVersion = currentCacheVersion === this.cacheVersion;
        const sameProviderCacheVersion = currentProviderCacheVersion === (this.providerCacheVersions.get(providerKey) ?? 0);

        if (sameCacheVersion && sameProviderCacheVersion && result !== undefined && result !== null) {
          this.cache.set(cacheKey, result);
        }
        return result;
      })
      .finally(() => {
        if (this.pendingLoads.get(cacheKey) === loadPromise) {
          this.pendingLoads.delete(cacheKey);
        }
      });

    this.pendingLoads.set(cacheKey, loadPromise);
    return loadPromise;
  }

  resolveRow(rowIndex: any): unknown {
    if (typeof rowIndex !== 'number') return undefined;
    return this.rowResolver?.(rowIndex);
  }

  clearCache(providerKey?: string): void {
    if (!providerKey) {
      this.cacheVersion++;
      this.providerCacheVersions.clear();
      this.cache.clear();
      this.pendingLoads.clear();
      return;
    }

    this.providerCacheVersions.set(
      providerKey,
      (this.providerCacheVersions.get(providerKey) ?? 0) + 1,
    );

    const prefix = `${providerKey}|`;

    Array.from(this.cache.keys())
      .filter(key => key.startsWith(prefix))
      .forEach(key => this.cache.delete(key));

    Array.from(this.pendingLoads.keys())
      .filter(key => key.startsWith(prefix))
      .forEach(key => this.pendingLoads.delete(key));
  }

  clear(): void {
    this.providers = {};
    this.rowResolver = undefined;
    this.clearCache();
  }

  private resolveProviderKey(dataField: string, lookup: GridLookupCellConfig): string {
    if (typeof lookup === 'string') {
      return lookup;
    }

    if (typeof lookup === 'object' && lookup.providerKey) {
      return lookup.providerKey;
    }

    return dataField;
  }

  private buildCacheKey(
    providerKey: string,
    dataField: string,
    request: GridLookupRequest<any, any>,
    lookupOptions: GridLookupCellOptions,
  ): string {
    const customCacheKey = lookupOptions.cacheKey?.(request);
    if (customCacheKey !== undefined && customCacheKey !== null && customCacheKey !== '') {
      return `${providerKey}|${dataField}|${customCacheKey}`;
    }

    return `${providerKey}|${dataField}|${this.serializeCacheValue(request.value)}`;
  }

  private serializeCacheValue(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
