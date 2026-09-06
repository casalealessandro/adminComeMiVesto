import { Injectable } from '@angular/core';

import {
  GridLookupDataProvider,
  GridLookupRequest,
} from './data-grid-lookup-provider';

/**
 * Configuration accepted by a column that opts into provider-managed lookup.
 */
export interface GridLookupCellOptions {
  /** Provider registry key. Defaults to the column `dataField`. */
  providerKey?: string;
  /** Property displayed when the provider returns an object. */
  displayExpr?: string;
  /** Optional value property retained for compatibility with existing lookup metadata. */
  valueExpr?: string;
  /** Enables registry caching and in-flight request deduplication. */
  cache?: boolean;
  /** Optional stable key used instead of serializing the raw lookup value. */
  cacheKey?: (request: GridLookupRequest<any, any>) => string;
}

export type GridLookupCellConfig = true | string | GridLookupCellOptions;
export type GridLookupProviderMap = Record<string, GridLookupDataProvider<any, any, any>>;

/**
 * Registry that connects explicit DataGrid lookup metadata to lookup providers.
 *
 * The registry owns provider registration, row-context resolution, optional
 * result caching, concurrent-request deduplication and cache invalidation.
 * Lookup remains opt-in: a cell is resolved remotely only when its column has
 * `customizedOptions.lookup` and the matching provider has been registered.
 *
 * Backend details stay inside `GridLookupDataProvider` implementations; the
 * registry never assumes Firebase, REST endpoints, database keys or transport
 * syntax.
 */
@Injectable()
export class GridLookupRegistry {
  private providers: GridLookupProviderMap = {};
  private rowResolver?: (rowIndex: number) => unknown;
  private cache = new Map<string, unknown>();
  private pendingLoads = new Map<string, Promise<unknown>>();
  private cacheVersion = 0;
  private providerCacheVersions = new Map<string, number>();

  /**
   * Replaces the provider map. Changing the map invalidates all cached values
   * so results from a previous provider configuration cannot leak forward.
   */
  setProviders(providers?: GridLookupProviderMap): void {
    const nextProviders = providers ?? {};

    if (this.providers !== nextProviders) {
      this.clearCache();
    }

    this.providers = nextProviders;
  }

  /**
   * Registers the callback used to recover the complete grid row from a visual
   * row index before invoking a lookup provider.
   */
  setRowResolver(resolver?: (rowIndex: number) => unknown): void {
    this.rowResolver = resolver;
  }

  /**
   * Resolves the provider selected by column lookup metadata.
   */
  getProvider(dataField: string, lookup: GridLookupCellConfig): GridLookupDataProvider<any, any, any> | undefined {
    return this.providers[this.resolveProviderKey(dataField, lookup)];
  }

  /**
   * Loads one lookup value through the configured provider.
   *
   * With caching disabled, the request is forwarded directly. With caching
   * enabled, resolved values are reused and concurrent requests for the same
   * cache key share one provider promise.
   */
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

  /**
   * Resolves the current row context for a numeric grid row index.
   */
  resolveRow(rowIndex: any): unknown {
    if (typeof rowIndex !== 'number') return undefined;
    return this.rowResolver?.(rowIndex);
  }

  /**
   * Invalidates cached lookup values globally or only for one provider key.
   *
   * Version counters prevent an in-flight request started before invalidation
   * from repopulating a cache that has already been cleared.
   */
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

  /**
   * Releases providers, row resolver and all cache state when the owning grid
   * is destroyed or reset.
   */
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
