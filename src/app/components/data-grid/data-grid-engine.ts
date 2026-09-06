import {
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
 * Phase 3 keeps provider-neutral query and paging state here and moves the
 * request/page-state operations that do not depend on Angular rendering.
 *
 * Current ownership:
 * - provider sorting request state
 * - provider global-search request state
 * - provider column-filter request state
 * - opaque continuation / has-more paging state
 * - whether the remote total count is authoritative
 * - provider-neutral GridLoadRequest construction
 * - provider-neutral page-state transitions
 *
 * Still intentionally owned by the components in this phase:
 * - Angular / DOM state
 * - loading flags and timers
 * - visible rows and selection state
 * - local UI sort/search indicators
 * - provider calls and mutation orchestration
 */
export class DataGridEngine<T = any> {
  providerSort: GridSort[] = [];
  providerSearch?: GridSearch;
  providerFilters: GridFilter[] = [];

  remoteContinuation?: unknown;
  remoteHasMore = false;
  remoteTotalCountKnown = false;

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
