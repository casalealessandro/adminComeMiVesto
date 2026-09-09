import {
  GridDataProvider,
  GridFilter,
  GridLoadRequest,
  GridPage,
  GridSearch,
  GridSort,
} from './data-grid-provider';
import { GridDetailDataProvider } from './data-grid-detail-provider';
import { DataGridUtils } from './data-grid-utils';

/**
 * Provider-neutral state and orchestration layer used by `DataGridComponent`.
 *
 * The engine owns normalized remote query state, continuation paging state,
 * provider calls and rollback-friendly snapshots. It intentionally knows
 * nothing about Angular templates, DOM state, emitted UI events or concrete
 * backend technologies such as Firebase, REST, OData or GraphQL.
 *
 * UI concerns such as loading indicators, visible rows, selection, dialogs,
 * scroll positioning and detail expansion remain owned by `DataGridComponent`.
 */
export class DataGridEngine<T = any> {
  providerSort: GridSort[] = [];
  providerSearch?: GridSearch;
  providerFilters: GridFilter[] = [];

  remoteContinuation?: unknown;
  remoteHasMore = false;
  remoteTotalCountKnown = false;

  /**
   * Returns an isolated copy of the active remote sort state for rollback.
   */
  snapshotProviderSort(): GridSort[] {
    return DataGridUtils.cloneSorts(this.providerSort);
  }

  /**
   * Replaces the provider sort state with one normalized sort instruction.
   */
  setProviderSort(field: string, direction: 'asc' | 'desc'): void {
    this.providerSort = [{
      field,
      direction,
    }];
  }

  /**
   * Restores a sort snapshot after a failed provider reload.
   */
  restoreProviderSort(previousSort: GridSort[]): void {
    this.providerSort = previousSort;
  }

  /**
   * Returns an isolated copy of the active global-search state for rollback.
   */
  snapshotProviderSearch(): GridSearch | undefined {
    return DataGridUtils.cloneSearch(this.providerSearch);
  }

  /**
   * Replaces or clears the active provider global-search state.
   */
  setProviderSearch(search: GridSearch | undefined): void {
    this.providerSearch = search;
  }

  /**
   * Restores a global-search snapshot after a failed provider reload.
   */
  restoreProviderSearch(previousSearch: GridSearch | undefined): void {
    this.providerSearch = previousSearch;
  }

  /**
   * Returns isolated copies of the active explicit column filters for rollback.
   */
  snapshotProviderFilters(): GridFilter[] {
    return DataGridUtils.cloneFilters(this.providerFilters);
  }

  /**
   * Replaces the filter for one field while preserving filters for other fields.
   * Passing `undefined` removes the filter for the selected field.
   */
  setProviderColumnFilter(field: string, filter: GridFilter | undefined): void {
    this.providerFilters = this.providerFilters.filter(currentFilter => currentFilter.field !== field);
    if (filter) {
      this.providerFilters.push(filter);
    }
  }

  /**
   * Restores a column-filter snapshot after a failed provider reload.
   */
  restoreProviderFilters(previousFilters: GridFilter[]): void {
    this.providerFilters = previousFilters;
  }

  /**
   * Creates a row through the provider and then performs the caller-owned
   * authoritative reload. A mutation failure prevents the reload from running.
   */
  async createProviderRow(
    provider: GridDataProvider<T>,
    data: Partial<T>,
    reload: () => Promise<void>,
  ): Promise<T> {
    const created = await provider.create!(data);
    await reload();
    return created;
  }

  /**
   * Updates a complete row through the provider and then performs the
   * caller-owned authoritative reload. Row identity remains provider-owned.
   */
  async updateProviderRow(
    provider: GridDataProvider<T>,
    data: T,
    reload: () => Promise<void>,
  ): Promise<T> {
    const updated = await provider.update!(data);
    await reload();
    return updated;
  }

  /**
   * Deletes a complete row through the provider and then performs the
   * caller-owned authoritative reload. No key-field convention is assumed.
   */
  async deleteProviderRow(
    provider: GridDataProvider<T>,
    data: T,
    reload: () => Promise<void>,
  ): Promise<void> {
    await provider.delete!(data);
    await reload();
  }

  /**
   * Loads provider-managed detail rows for the exact parent row supplied by
   * the component. Visual expansion state remains component-owned.
   */
  loadDetailRows<TDetail = unknown>(
    provider: GridDetailDataProvider<T, TDetail>,
    parentRow: T,
  ): Promise<TDetail[]> {
    return provider.load({ parentRow });
  }

  /**
   * Builds one immutable provider request from the current query state.
   *
   * Search, filters and sort arrays are cloned so provider implementations
   * cannot mutate the engine's active state through the request object.
   */
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

  /**
   * Loads the first remote page using the active search/filter/sort state and
   * no continuation token.
   */
  loadInitialPage(provider: GridDataProvider<T>, pageSize: number): Promise<GridPage<T>> {
    return provider.load(this.buildLoadRequest(pageSize));
  }

  /**
   * Loads the next remote page using the current opaque continuation token and
   * preserving the active search/filter/sort state.
   */
  loadContinuationPage(provider: GridDataProvider<T>, pageSize: number): Promise<GridPage<T>> {
    return provider.load(this.buildLoadRequest(pageSize, this.remoteContinuation));
  }

  /**
   * Applies provider paging metadata after the first page and returns the
   * effective total used by the component for visual paging state.
   */
  applyInitialPageState(page: GridPage<T>): number {
    this.remoteContinuation = page.continuation;
    this.remoteHasMore = page.hasMore;
    this.remoteTotalCountKnown = page.totalCount !== undefined;

    return page.totalCount ?? page.items.length;
  }

  /**
   * Applies continuation metadata and returns the effective visual total.
   *
   * An explicit provider `totalCount` is authoritative. Without one, the final
   * page total is the number of loaded rows; while more pages remain, the total
   * never moves backwards below the already known value.
   */
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
