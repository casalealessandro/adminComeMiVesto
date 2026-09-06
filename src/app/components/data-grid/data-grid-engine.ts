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
 * Phase 7 keeps provider-neutral query and paging state here and centralizes
 * provider sort/search/filter state transitions and CRUD orchestration without
 * changing DataGrid UI behavior.
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
 * - provider sort/search/filter snapshot / set / restore operations
 * - provider create / update / delete orchestration with caller-owned reload
 *
 * Still intentionally owned by the components in this phase:
 * - Angular / DOM state
 * - loading flags and timers
 * - visible rows and selection state
 * - local UI sort/search indicators
 * - visual paging state and placeholder rendering
 * - CRUD confirmation and emitted UI events
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

  snapshotProviderSearch(): GridSearch | undefined {
    return DataGridUtils.cloneSearch(this.providerSearch);
  }

  setProviderSearch(search: GridSearch | undefined): void {
    this.providerSearch = search;
  }

  restoreProviderSearch(previousSearch: GridSearch | undefined): void {
    this.providerSearch = previousSearch;
  }

  snapshotProviderFilters(): GridFilter[] {
    return DataGridUtils.cloneFilters(this.providerFilters);
  }

  setProviderColumnFilter(field: string, filter: GridFilter | undefined): void {
    this.providerFilters = this.providerFilters.filter(currentFilter => currentFilter.field !== field);
    if (filter) {
      this.providerFilters.push(filter);
    }
  }

  restoreProviderFilters(previousFilters: GridFilter[]): void {
    this.providerFilters = previousFilters;
  }

  async createProviderRow(
    provider: GridDataProvider<T>,
    data: Partial<T>,
    reload: () => Promise<void>,
  ): Promise<T> {
    const created = await provider.create!(data);
    await reload();
    return created;
  }

  async updateProviderRow(
    provider: GridDataProvider<T>,
    data: T,
    reload: () => Promise<void>,
  ): Promise<T> {
    const updated = await provider.update!(data);
    await reload();
    return updated;
  }

  async deleteProviderRow(
    provider: GridDataProvider<T>,
    data: T,
    reload: () => Promise<void>,
  ): Promise<void> {
    await provider.delete!(data);
    await reload();
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
