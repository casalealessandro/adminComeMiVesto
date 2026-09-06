import { GridFilter, GridSearch, GridSort } from './data-grid-provider';

/**
 * Stateful orchestration layer for DataGrid behavior.
 *
 * Phase 2 starts moving provider-neutral query state here without changing the
 * existing DataGrid loading, rendering or public runtime contracts.
 *
 * Current ownership:
 * - provider sorting request state
 * - provider global-search request state
 * - provider column-filter request state
 * - opaque continuation / has-more paging state
 * - whether the remote total count is authoritative
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
}
