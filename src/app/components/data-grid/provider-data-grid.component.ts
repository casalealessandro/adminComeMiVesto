import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';

import { CustomScrollbarComponent } from '../custom-scrollbar/custom-scrollbar.component';
import { confirm } from '../../widgets/ui-dialogs';
import {
  buildGridCreateEvent,
  buildGridDeleteEvent,
  buildGridUpdateEvent,
} from './data-grid-crud-event';
import { GridDetailDataProvider } from './data-grid-detail-provider';
import { DataGridEngine } from './data-grid-engine';
import {
  buildGridColumnFilter,
  buildGridSearch,
} from './data-grid-filter-model';
import {
  GridLookupProviderMap,
  GridLookupRegistry,
} from './data-grid-lookup-registry';
import {
  GridDataProvider,
  GridPage,
  GridSort,
} from './data-grid-provider';
import { DataGridComponent } from './data-grid.component';
import { DataGridUtils } from './data-grid-utils';
import { ProviderTdItemComponent } from './td-item/provider-td-item.component';

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
    ProviderTdItemComponent,
    CustomScrollbarComponent,
  ],
  providers: [GridLookupRegistry],
})
export class ProviderDataGridComponent<T = any> extends DataGridComponent {
  private readonly providerLookupRegistry = inject(GridLookupRegistry);
  private readonly gridEngine = new DataGridEngine<T>();
  private registeredLookupProviders: GridLookupProviderMap = {};

  @Input() dataProvider?: GridDataProvider<T>;
  @Input() detailDataProvider?: GridDetailDataProvider<T, any>;

  @Input()
  set lookupProviders(providers: GridLookupProviderMap | undefined) {
    this.registeredLookupProviders = providers ?? {};
    this.providerLookupRegistry.setProviders(this.registeredLookupProviders);
  }

  get lookupProviders(): GridLookupProviderMap {
    return this.registeredLookupProviders;
  }

  get remoteContinuation(): unknown {
    return this.gridEngine.remoteContinuation;
  }

  set remoteContinuation(value: unknown) {
    this.gridEngine.remoteContinuation = value;
  }

  get remoteHasMore(): boolean {
    return this.gridEngine.remoteHasMore;
  }

  set remoteHasMore(value: boolean) {
    this.gridEngine.remoteHasMore = value;
  }

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

  private providerMockItem?: T;
  private providerSearchTimer?: ReturnType<typeof setTimeout>;
  private providerFilterTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private providerScrollElement?: HTMLElement;

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this.providerLookupRegistry.setProviders(this.registeredLookupProviders);
    this.providerLookupRegistry.setRowResolver(rowIndex => this.rowsData()[rowIndex]);
  }

  override ngOnDestroy(): void {
    if (this.providerSearchTimer !== undefined) {
      clearTimeout(this.providerSearchTimer);
      this.providerSearchTimer = undefined;
    }

    this.providerFilterTimers.forEach(timer => clearTimeout(timer));
    this.providerFilterTimers.clear();

    this.providerLookupRegistry.clear();
    this.providerScrollElement = undefined;
    super.ngOnDestroy();
  }

  override buildAndTestQueryString(): Promise<boolean> {
    if (this.dataProvider) {
      return Promise.resolve(true);
    }

    return super.buildAndTestQueryString();
  }

  /**
   * Keep the historic header builder untouched and only refine the recovered
   * provider filter-row visibility after the original columns are built.
   * `showFilter=true` enables the row, while `allowFiltering=false` can still
   * explicitly disable one column as in the original column configuration.
   */
  override async buildHeaderColumns(hCol: any): Promise<boolean> {
    const built = await super.buildHeaderColumns(hCol);

    this.colsHeader.forEach(column => {
      if (!column.dataField) return;

      const originalColumn = DataGridUtils.getOriginalColumn(this.colonne, column.dataField);
      if (originalColumn?.allowFiltering === false) {
        column.search = false;
      }

      const lookup = originalColumn?.customizedOptions?.lookup;
      if (lookup !== undefined) {
        column.customizedOptions = {
          ...(column.customizedOptions ?? {}),
          lookup,
        };
      }
    });

    return built;
  }

  override async loadRemoteRecords(): Promise<boolean> {
    if (!this.dataProvider) {
      return super.loadRemoteRecords();
    }

    this.isLoading = true;

    try {
      const page = await this.gridEngine.loadInitialPage(this.dataProvider, this.pageSize);

      this.applyInitialProviderPage(page);
      return true;
    } catch {
      return false;
    } finally {
      this.isLoading = false;
      this.setProgressCursor(false);
    }
  }

  /**
   * Keep the historic master/detail UX untouched and replace only the remote
   * transport when a detail provider is supplied. `collapse()` still owns the
   * expand/collapse behavior, CSS classes and the decision to load remotely.
   */
  override async renderGridDetailData(detailOptions: any, row: any, index: any): Promise<void> {
    if (!this.detailDataProvider) {
      await super.renderGridDetailData(detailOptions, row, index);
      return;
    }

    const previousShowNullDataDetail = this.showNullDataDetail;
    this.showNullDataDetail = false;

    try {
      const details = await this.gridEngine.loadDetailRows(this.detailDataProvider, row as T)

      this.colsRowDetail[index] = details
      this.showNullDataDetail = details.length == 0
      this.showDetailRow[index] = true

      let eventExpandingRow = {
        cancel: false,
        data: row,
        rowIndex: index,
        expandedData: this.colsRowDetail[index],
        name: 'onRowExpanded'
      }

      this.emittendGridEvent.emit(eventExpandingRow)
    } catch {
      this.showNullDataDetail = previousShowNullDataDetail;
    }
  }

  /**
   * Keep the historic create event flow and order, changing only the event
   * construction so create/edit/delete use the same typed CRUD contract.
   */
  override buttonEmitted(event: any): void {
    if (!this.dataProvider || event != 'addRow') {
      super.buttonEmitted(event);
      return;
    }

    console.log('buttonEmitted-->', event)

    let eventRowClick = buildGridCreateEvent({
      idTable: this.idTable,
      service: this.service,
      component: this
    }, event)

    this.emittendToolbarClick.emit(eventRowClick)
    this.emittendStartEdit.emit(eventRowClick)

    if (!eventRowClick.cancel) {
      this.addRow()
    }
  }

  /**
   * Keep the historic external edit flow intact. The provider bridge only
   * normalizes the emitted payload; it does not move editing back inside the
   * grid and does not call provider.update from the edit button.
   */
  override startEdit(index: any, event: any): void {
    if (!this.dataProvider) {
      super.startEdit(index, event);
      return;
    }

    let eventEditor = buildGridUpdateEvent({
      idTable: this.idTable,
      service: this.service,
      component: this
    }, index, this.rowsData()[index], event)

    this.emittendStartEdit.emit(eventEditor)

    if (eventEditor.cancel) {
      return
    }
  }

  /**
   * Preserve the historic local event flow, while the explicit provider remote
   * path owns the mutation directly as agreed: local emits `delRows`, provider
   * remote mode does not emit it and calls provider.delete instead.
   */
  override async removeRowData(index: any, event: any): Promise<void> {
    if (!this.dataProvider) {
      await super.removeRowData(index, event);
      return;
    }

    confirm('Sei certo di voler eliminare questo record?', 'Attenzione!', res => {
      if (!res) {
        return
      }

      let delEvent = buildGridDeleteEvent({
        idTable: this.idTable,
        service: this.service,
        component: this
      }, index, this.rowsData()[index] as T)

      if (!this.remoteOperation) {
        this.emittendGridEvent.emit(delEvent)

        if (delEvent.cancel) {
          return
        }

        this.deleteRow(index)
        return
      }

      void this.deleteProviderRow(delEvent.rowData as T)
    })
  }

  /**
   * Recover the historic remote-create capability behind the provider contract.
   * As before, a successful mutation is followed by a fresh grid load; unlike
   * the legacy path, the grid does not need to know any endpoint details.
   */
  async createProviderRow(data: Partial<T>): Promise<T | undefined> {
    if (!this.dataProvider?.create || !this.remoteOperation || this.isLoading) {
      return undefined;
    }

    this.isLoading = true;
    this.setProgressCursor(true);

    try {
      return await this.gridEngine.createProviderRow(this.dataProvider, data, async () => {
        this.isLoading = false;
        await this.loadRemoteRecords();
      });
    } catch {
      return undefined;
    } finally {
      this.isLoading = false;
      this.setProgressCursor(false);
    }
  }

  /**
   * Recover the historic remote-update capability without `api`, `id` or
   * `isKeyID` assumptions. The concrete provider owns its update identity and
   * transport rules; the grid only passes the row data through.
   */
  async updateProviderRow(data: T): Promise<T | undefined> {
    if (!this.dataProvider?.update || !this.remoteOperation || this.isLoading) {
      return undefined;
    }

    this.isLoading = true;
    this.setProgressCursor(true);

    try {
      return await this.gridEngine.updateProviderRow(this.dataProvider, data, async () => {
        this.isLoading = false;
        await this.loadRemoteRecords();
      });
    } catch {
      return undefined;
    } finally {
      this.isLoading = false;
      this.setProgressCursor(false);
    }
  }

  /**
   * Recover the historic remote-delete capability without assuming that a row
   * has an `id` field. The provider receives the whole row and decides how the
   * backend identifies and removes it.
   */
  async deleteProviderRow(data: T): Promise<boolean> {
    if (!this.dataProvider?.delete || !this.remoteOperation || this.isLoading) {
      return false;
    }

    this.isLoading = true;
    this.setProgressCursor(true);

    try {
      await this.gridEngine.deleteProviderRow(this.dataProvider, data, async () => {
        this.isLoading = false;
        await this.loadRemoteRecords();
      });
      return true;
    } catch {
      return false;
    } finally {
      this.isLoading = false;
      this.setProgressCursor(false);
    }
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

  private applyInitialProviderPage(page: GridPage<T>): void {
    this.rowsData.set([...page.items]);
    this.totalRecords = this.gridEngine.applyInitialPageState(page);
    this.currentPage = 0;
    this.latestSkipLoaded = 0;
    this.latestScrollTopPosition = 0;
    this.showNullData = page.items.length === 0;
    this.providerMockItem = DataGridUtils.createMockItem(page.items[0]);
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

  private setProgressCursor(loading: boolean): void {
    if (typeof document === 'undefined') return;
    const body = document.getElementsByTagName('body').item(0) as HTMLBodyElement | null;
    if (body) {
      body.style.cursor = loading ? 'progress' : 'auto';
    }
  }
}
