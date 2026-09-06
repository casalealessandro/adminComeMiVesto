import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';

import { CustomScrollbarComponent } from '../custom-scrollbar/custom-scrollbar.component';
import {
  buildGridColumnFilter,
  buildGridSearch,
} from './data-grid-filter-model';
import { GridLookupRegistry } from './data-grid-lookup-registry';
import { GridSort } from './data-grid-provider';
import { DataGridComponent } from './data-grid.component';
import { DataGridUtils } from './data-grid-utils';
import { TdItemComponent } from './td-item/td-item.component';

/**
 * Conservative bridge for recovering provider-neutral remote behavior without
 * rewriting the existing DataGridComponent runtime.
 *
 * The original component remains available unchanged. This subclass reuses its
 * template, styles, inputs, outputs and local behavior, adding a provider path
 * in parallel with the inherited legacy AnagraficaService path.
 */
@Component({
  selector: 'app-provider-data-grid',
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TdItemComponent,
    CustomScrollbarComponent,
  ],
  providers: [GridLookupRegistry],
})
export class ProviderDataGridComponent<T = any> extends DataGridComponent<T> {
  private readonly providerDestroyRef = inject(DestroyRef);

  /**
   * Keeps the historic short virtual-loading pause used by the old remote
   * scroll implementation. Tests may set it to 0; consumers do not need to.
   */
  providerScrollLoadDelay = 800;

  /**
   * Preserve the historic 500 ms search delay while allowing isolated tests to
   * set it to 0. The original DataGrid search methods remain untouched.
   */
  providerSearchDebounce = 500;

  /**
   * Column text/number/date filters follow the same short delay historically
   * used by the old filter inputs. Select filters are applied immediately.
   */
  providerFilterDebounce = 500;

  private providerSearchTimer?: ReturnType<typeof setTimeout>;
  private providerFilterTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private providerScrollElement?: HTMLElement;

  constructor() {
    super();
    this.providerFacadeActive = true;

    this.providerDestroyRef.onDestroy(() => {
      if (this.providerSearchTimer !== undefined) {
        clearTimeout(this.providerSearchTimer);
        this.providerSearchTimer = undefined;
      }

      this.providerFilterTimers.forEach(timer => clearTimeout(timer));
      this.providerFilterTimers.clear();

      this.providerScrollElement = undefined;
    });
  }

  /**
   * Keep the original local sort implementation untouched. Only the explicit
   * provider + remoteOperation path turns the same column click into a remote
   * GridSort request.
   */
  override sortColumn(column: string): void {
    if (!this.dataProvider || !this.remoteOperation) {
      super.sortColumn(column);
      return;
    }

    if (this.isLoading) return;

    const previousColumn = this.sortedColumn;
    const previousDirection = this.sortDirection;
    const previousSort = this.gridEngine.snapshotProviderSort();

    if (this.sortedColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortedColumn = column;
      this.sortDirection = 'asc';
    }

    this.gridEngine.setProviderSort(column, this.sortDirection);

    void this.reloadAfterProviderSort(previousColumn, previousDirection, previousSort);
  }

  /**
   * Preserve the old toolbar search entry point. Local/legacy behavior still
   * delegates to DataGridComponent; only provider remote mode uses the new
   * typed global-search request.
   */
  override async toolbarValueChanged(event: { value: any; event: any; }): Promise<void> {
    if (!this.dataProvider || !this.remoteOperation) {
      await super.toolbarValueChanged(event);
      return;
    }

    this.searchText = event?.value == null ? '' : String(event.value);
    this.textEmpty = 'Sto cercando...';
    this.scheduleProviderSearch(this.searchText);
  }

  /**
   * Recover the historic per-column input entry point without changing the
   * original DataGrid method. Provider mode reads the field/type metadata from
   * the filter-row control and keeps one typed filter per column.
   */
  override async searchData(event: any): Promise<void> {
    if (!this.dataProvider || !this.remoteOperation) {
      await super.searchData(event);
      return;
    }

    const target = event?.target as HTMLInputElement | HTMLSelectElement | null;
    const field = target?.dataset?.['gridFilterField'];
    if (!target || !field) return;

    const value = DataGridUtils.resolveProviderFilterInputValue(
      this.colsHeader,
      this.colonne,
      field,
      target.value,
    );

    if (target.tagName === 'SELECT') {
      await this.applyProviderColumnFilter(field, value);
      return;
    }

    this.scheduleProviderColumnFilter(field, value);
  }

  /**
   * Apply global search immediately. This method is intentionally public so the
   * provider path is usable independently from the currently-commented toolbar
   * markup and can be tested without timers.
   */
  async applyProviderSearch(value: string): Promise<boolean> {
    if (!this.dataProvider || !this.remoteOperation) return false;

    const previousSearch = this.gridEngine.snapshotProviderSearch();
    this.searchText = value ?? '';
    this.gridEngine.setProviderSearch(buildGridSearch(
      this.searchText,
      DataGridUtils.getProviderSearchColumns(this.colsHeader, this.colonne),
    ));

    const loaded = await this.loadRemoteRecords();
    if (!loaded) {
      this.gridEngine.restoreProviderSearch(previousSearch);
      return false;
    }

    if (this.providerScrollElement) {
      this.providerScrollElement.scrollTop = 0;
    }

    return true;
  }

  /**
   * Apply or remove one explicit column filter. The request keeps active global
   * search and sorting, while column filters themselves are sent as an AND list.
   */
  async applyProviderColumnFilter(field: string, value: unknown): Promise<boolean> {
    if (!this.dataProvider || !this.remoteOperation || !field) return false;

    const column = DataGridUtils.getProviderFilterColumn(this.colsHeader, this.colonne, field);
    if (!column) return false;

    const previousFilters = this.gridEngine.snapshotProviderFilters();
    const filter = buildGridColumnFilter(value, column);

    this.gridEngine.setProviderColumnFilter(field, filter);

    const loaded = await this.loadRemoteRecords();
    if (!loaded) {
      this.gridEngine.restoreProviderFilters(previousFilters);
      return false;
    }

    if (this.providerScrollElement) {
      this.providerScrollElement.scrollTop = 0;
    }

    return true;
  }

  /**
   * Provider-neutral recovery of the historic remote infinite-scroll flow:
   * keep the near-bottom trigger, mock rows, loading lock and scroll position,
   * replacing only the old $top/$skip transport with opaque continuation.
   */
  override async onScroll(event: Event): Promise<void> {
    if (!this.dataProvider) {
      await super.onScroll(event);
      return;
    }

    const element = event.target as HTMLElement | null;
    if (!element) return;
    this.providerScrollElement = element;

    if (this.isLoading) {
      this.keepScrollPositionWhileLoading(element);
      return;
    }

    if (!this.remoteOperation || !this.remoteHasMore) return;
    if (this.rowsData().length < this.pageSize) return;
    if (!this.isProviderScrollingNearBottom(element)) return;

    await this.loadNextRemotePage();
  }

  async loadNextRemotePage(): Promise<boolean> {
    if (!this.dataProvider || !this.remoteOperation || !this.remoteHasMore || this.isLoading) {
      return false;
    }

    this.isLoading = true;
    this.setProgressCursor(true);

    const insertionIndex = this.rowsData().length;
    const placeholderCount = this.appendProviderPlaceholders();

    try {
      if (this.providerScrollLoadDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.providerScrollLoadDelay));
      }

      const page = await this.gridEngine.loadContinuationPage(this.dataProvider, this.pageSize);

      this.replaceProviderPlaceholders(insertionIndex, placeholderCount, page.items);
      this.currentPage++;
      this.latestSkipLoaded = this.currentPage * this.pageSize;
      this.totalRecords = this.gridEngine.applyContinuationPageState(
        page,
        this.totalRecords,
        this.rowsData().length,
      );

      this.showNullData = false;
      return true;
    } catch {
      this.removeProviderPlaceholders(insertionIndex, placeholderCount);
      return false;
    } finally {
      this.isLoading = false;
      this.setProgressCursor(false);
    }
  }

  private async reloadAfterProviderSort(
    previousColumn: any,
    previousDirection: 'asc' | 'desc',
    previousSort: GridSort[],
  ): Promise<void> {
    const loaded = await this.loadRemoteRecords();

    if (!loaded) {
      this.sortedColumn = previousColumn;
      this.sortDirection = previousDirection;
      this.gridEngine.restoreProviderSort(previousSort);
      return;
    }

    // Sorting starts a fresh remote result set, so also return the visual
    // viewport to the first row when the current scrollbar is available.
    if (this.providerScrollElement) {
      this.providerScrollElement.scrollTop = 0;
    }
  }

  private scheduleProviderSearch(value: string): void {
    if (this.providerSearchTimer !== undefined) {
      clearTimeout(this.providerSearchTimer);
      this.providerSearchTimer = undefined;
    }

    if (this.providerSearchDebounce <= 0) {
      void this.applyProviderSearch(value);
      return;
    }

    this.providerSearchTimer = setTimeout(() => {
      this.providerSearchTimer = undefined;
      void this.applyProviderSearch(value);
    }, this.providerSearchDebounce);
  }

  private scheduleProviderColumnFilter(field: string, value: unknown): void {
    const currentTimer = this.providerFilterTimers.get(field);
    if (currentTimer !== undefined) {
      clearTimeout(currentTimer);
      this.providerFilterTimers.delete(field);
    }

    if (this.providerFilterDebounce <= 0) {
      void this.applyProviderColumnFilter(field, value);
      return;
    }

    const timer = setTimeout(() => {
      this.providerFilterTimers.delete(field);
      void this.applyProviderColumnFilter(field, value);
    }, this.providerFilterDebounce);

    this.providerFilterTimers.set(field, timer);
  }

  private appendProviderPlaceholders(): number {
    if (!this.providerMockItem) return 0;

    let count = this.pageSize;
    if (this.gridEngine.remoteTotalCountKnown) {
      count = Math.min(this.pageSize, Math.max(0, this.totalRecords - this.rowsData().length));
    }

    if (count <= 0) return 0;

    const placeholders = Array.from({ length: count }, () => this.providerMockItem as T);
    this.rowsData.update(rows => [...rows, ...placeholders]);
    return count;
  }

  private replaceProviderPlaceholders(insertionIndex: number, placeholderCount: number, items: T[]): void {
    this.rowsData.update(rows => [
      ...rows.slice(0, insertionIndex),
      ...items,
      ...rows.slice(insertionIndex + placeholderCount),
    ]);
  }

  private removeProviderPlaceholders(insertionIndex: number, placeholderCount: number): void {
    if (placeholderCount <= 0) return;

    this.rowsData.update(rows => [
      ...rows.slice(0, insertionIndex),
      ...rows.slice(insertionIndex + placeholderCount),
    ]);
  }

  private isProviderScrollingNearBottom(element: HTMLElement): boolean {
    const nearBottom = element.scrollTop > 0
      && element.scrollTop >= (element.scrollHeight - element.clientHeight - 10)
      && element.scrollTop >= this.latestScrollTopPosition;

    if (nearBottom) {
      this.latestScrollTopPosition = element.scrollTop;
      element.scrollTop = Math.max(0, element.scrollTop - 10);
      return true;
    }

    return false;
  }

  private keepScrollPositionWhileLoading(element: HTMLElement): void {
    const isAtBottom = element.scrollHeight - element.clientHeight <= Math.floor(element.scrollTop) + 1;
    if (isAtBottom) {
      element.scrollTop = Math.max(0, element.scrollTop - 10);
    }
  }
}
