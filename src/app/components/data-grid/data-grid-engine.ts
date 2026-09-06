import {
  GridDataProvider,
  GridFilter,
  GridLoadRequest,
  GridPage,
  GridSearch,
  GridSort,
} from './data-grid-provider';
import { DataGridUtils } from './data-grid-utils';

/**
 * Stateful orchestration layer for DataGrid behavior.
 *
 * Phase 5 keeps provider-neutral query and paging state here and centralizes
 * the provider sort-state transitions without changing the DataGrid UI flow.
 *
 * Current ownership:
 * - provider sorting request state
 * - provider global-search request state
 * - provider column-filter request state
 * - opaque continuation / has-more paging state
 * - whether the remote total count is authoritative
 * - provider-neutral GridLoadRequest construction
 * - provider-neutral page-state transitions
 * - provider-neutral initial / continuation load calls
 * - provider sort snapshot / set / restore operations
 *
 * Still intentionally owned by the components in this phase:
 * - Angular / DOM state
 * - loading flags and timers
 * - visible rows and selection state
 * - local UI sort/search indicators
 * - visual paging state and placeholder rendering
 * - mutation orchestration
 */
export class DataGridEngine<T = any> {
  providerSort: GridSort[] = [];
  providerSearch?: GridSearch;
  providerFilters: GridFilter[] = [];

  remoteContinuation?: unknown;
  remoteHasMore = false;
  remoteTotalCountKnown = false;

  snapshotProviderSort(): GridSort[] {
    return DataGridUtils.cloneSorts(this.providerSort);
  }

  setProviderSort(field: string, direction: 'asc' | 'desc'): void {
    this.providerSort = [{
      field,
      direction,
    }];
  }

  restoreProviderSort(previousSort: GridSort[]): void {
    this.providerSort = previousSort;
  }

  buildLoadRequest(pageSize: number, continuation?: unknown): GridLoadRequest {
    const request: GridLoadRequest = {
      pageSize,
    };

    if (continuation !== undefined) {
      request.continuation = continuation;
    }

    if (this.providerSearch) {
      request.search = DataGridUtils.cloneSearch(this.providerSearch);
    }

    if (this.providerFilters.length > 0) {
      request.filters = DataGridUtils.cloneFilters(this.providerFilters);
    }

    if (this.providerSort.length > 0) {
      request.sort = DataGridUtils.cloneSorts(this.providerSort);
    }

    return request;
  }

  loadInitialPage(provider: GridDataProvider<T>, pageSize: number): Promise<GridPage<T>> {
    return provider.load(this.buildLoadRequest(pageSize));
  }

  loadContinuationPage(provider: GridDataProvider<T>, pageSize: number): Promise<GridPage<T>> {
    return provider.load(this.buildLoadRequest(pageSize, this.remoteContinuation));
  }

  applyInitialPageState(page: GridPage<T>): number {
    this.remoteContinuation = page.continuation;
    this.remoteHasMore = page.hasMore;
    this.remoteTotalCountKnown = page.totalCount !== undefined;

    return page.totalCount ?? page.items.length;
  }

  applyContinuationPageState(
    page: GridPage<T>,
    currentTotalRecords: number,
    loadedRowCount: number,
  ): number {
    this.remoteContinuation = page.continuation;
    this.remoteHasMore = page.hasMore;

    if (page.totalCount !== undefined) {
      this.remoteTotalCountKnown = true;
      return page.totalCount;
    }

    if (!page.hasMore) {
      return loadedRowCount;
    }

    return Math.max(currentTotalRecords, loadedRowCount);
  }
}
