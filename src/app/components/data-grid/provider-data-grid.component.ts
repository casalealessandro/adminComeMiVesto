import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { CustomScrollbarComponent } from '../custom-scrollbar/custom-scrollbar.component';
import { confirm } from '../../widgets/ui-dialogs';
import {
  buildGridCreateEvent,
  buildGridDeleteEvent,
  buildGridUpdateEvent,
} from './data-grid-crud-event';
import {
  buildGridColumnFilter,
  buildGridSearch,
  GridFilterColumnMetadata,
} from './data-grid-filter-model';
import {
  GridDataProvider,
  GridFilter,
  GridFilterOperator,
  GridLoadRequest,
  GridPage,
  GridSearch,
  GridSort,
} from './data-grid-provider';
import { DataGridComponent } from './data-grid.component';
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
})
export class ProviderDataGridComponent<T = any> extends DataGridComponent {
  @Input() dataProvider?: GridDataProvider<T>;

  remoteContinuation?: unknown;
  remoteHasMore = false;

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
  private remoteTotalCountKnown = false;
  private providerSort: GridSort[] = [];
  private providerSearch?: GridSearch;
  private providerFilters: GridFilter[] = [];
  private providerSearchTimer?: ReturnType<typeof setTimeout>;
  private providerFilterTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private providerScrollElement?: HTMLElement;
  private readonly providerScrollListener = (event: Event) => {
    void this.onScroll(event);
  };

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    // The current markup delegates the real scrolling surface to
    // CustomScrollbarComponent. Listen there without changing the original
    // DataGrid template or the reusable scrollbar component.
    const scrollElement = this.dataGridWrapper?.nativeElement.querySelector<HTMLElement>('.scrollbar-container');
    if (scrollElement) {
      this.providerScrollElement = scrollElement;
      scrollElement.addEventListener('scroll', this.providerScrollListener);
    }
  }

  override ngOnDestroy(): void {
    if (this.providerSearchTimer !== undefined) {
      clearTimeout(this.providerSearchTimer);
      this.providerSearchTimer = undefined;
    }

    this.providerFilterTimers.forEach(timer => clearTimeout(timer));
    this.providerFilterTimers.clear();

    this.providerScrollElement?.removeEventListener('scroll', this.providerScrollListener);
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

      const originalColumn = this.getProviderOriginalColumn(column.dataField);
      if (originalColumn?.allowFiltering === false) {
        column.search = false;
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
      const page = await this.dataProvider.load(this.buildProviderLoadRequest());

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
      const created = await this.dataProvider.create(data);
      this.isLoading = false;
      await this.loadRemoteRecords();
      return created;
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
      const updated = await this.dataProvider.update(data);
      this.isLoading = false;
      await this.loadRemoteRecords();
      return updated;
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
      await this.dataProvider.delete(data);
      this.isLoading = false;
      await this.loadRemoteRecords();
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
    const previousSort = this.providerSort.map(sort => ({ ...sort }));

    if (this.sortedColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortedColumn = column;
      this.sortDirection = 'asc';
    }

    this.providerSort = [{
      field: column,
      direction: this.sortDirection,
    }];

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

    const value = this.resolveProviderFilterInputValue(field, target.value);

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

    const previousSearch = this.cloneProviderSearch(this.providerSearch);
    this.searchText = value ?? '';
    this.providerSearch = buildGridSearch(this.searchText, this.getProviderSearchColumns());

    const loaded = await this.loadRemoteRecords();
    if (!loaded) {
      this.providerSearch = previousSearch;
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

    const column = this.getProviderFilterColumn(field);
    if (!column) return false;

    const previousFilters = this.cloneProviderFilters(this.providerFilters);
    const filter = buildGridColumnFilter(value, column);

    this.providerFilters = this.providerFilters.filter(currentFilter => currentFilter.field !== field);
    if (filter) {
      this.providerFilters.push(filter);
    }

    const loaded = await this.loadRemoteRecords();
    if (!loaded) {
      this.providerFilters = previousFilters;
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

      const page = await this.dataProvider.load(this.buildProviderLoadRequest(this.remoteContinuation));

      this.replaceProviderPlaceholders(insertionIndex, placeholderCount, page.items);
      this.currentPage++;
      this.latestSkipLoaded = this.currentPage * this.pageSize;
      this.remoteContinuation = page.continuation;
      this.remoteHasMore = page.hasMore;

      if (page.totalCount !== undefined) {
        this.totalRecords = page.totalCount;
        this.remoteTotalCountKnown = true;
      } else if (!page.hasMore) {
        this.totalRecords = this.rowsData().length;
      } else {
        this.totalRecords = Math.max(this.totalRecords, this.rowsData().length);
      }

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

  private buildProviderLoadRequest(continuation?: unknown): GridLoadRequest {
    const request: GridLoadRequest = {
      pageSize: this.pageSize,
    };

    if (continuation !== undefined) {
      request.continuation = continuation;
    }

    if (this.providerSearch) {
      request.search = this.cloneProviderSearch(this.providerSearch);
    }

    if (this.providerFilters.length > 0) {
      request.filters = this.cloneProviderFilters(this.providerFilters);
    }

    if (this.providerSort.length > 0) {
      request.sort = this.providerSort.map(sort => ({ ...sort }));
    }

    return request;
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
      this.providerSort = previousSort;
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

  private getProviderSearchColumns(): GridFilterColumnMetadata[] {
    return this.colsHeader
      .filter(column => !!column.dataField)
      .map(column => {
        const originalColumn = this.getProviderOriginalColumn(column.dataField);

        return {
          field: column.dataField,
          type: column.type,
          searchable: originalColumn?.search === false ? false : undefined,
          searchOperator: originalColumn?.searchOperator as GridFilterOperator | undefined,
        };
      });
  }

  private getProviderFilterColumn(field: string): GridFilterColumnMetadata | undefined {
    const column = this.colsHeader.find(currentColumn => currentColumn.dataField === field);
    if (!column) return undefined;

    const originalColumn = this.getProviderOriginalColumn(field);

    return {
      field,
      type: column.type,
      filterable: originalColumn?.allowFiltering === false ? false : undefined,
      filterOperator: originalColumn?.filterOperator as GridFilterOperator | undefined,
    };
  }

  private getProviderOriginalColumn(field: string): any {
    for (const group of this.colonne ?? []) {
      if ((group as any)?.dataField === field) {
        return group;
      }

      const data = (group as any)?.data;
      if (!Array.isArray(data)) continue;

      const column = data.find((currentColumn: any) => currentColumn?.dataField === field);
      if (column) return column;
    }

    return undefined;
  }

  private resolveProviderFilterInputValue(field: string, value: string): unknown {
    if (value === '') return '';

    const column = this.colsHeader.find(currentColumn => currentColumn.dataField === field);
    if (column?.type !== 'campoLista') return value;

    const originalColumn = this.getProviderOriginalColumn(field);
    const listOptions = originalColumn?.lista ?? column.customizedOptions;
    const options = listOptions?.options;
    const valueExp = listOptions?.valueExp;

    if (!Array.isArray(options) || !valueExp) return value;

    const selectedOption = options.find((option: any) => String(option?.[valueExp]) === String(value));
    return selectedOption ? selectedOption[valueExp] : value;
  }

  private cloneProviderSearch(search?: GridSearch): GridSearch | undefined {
    if (!search) return undefined;

    return {
      value: search.value,
      conditions: search.conditions.map(condition => ({ ...condition })),
    };
  }

  private cloneProviderFilters(filters: GridFilter[]): GridFilter[] {
    return filters.map(filter => ({ ...filter }));
  }

  private applyInitialProviderPage(page: GridPage<T>): void {
    this.rowsData.set([...page.items]);
    this.remoteContinuation = page.continuation;
    this.remoteHasMore = page.hasMore;
    this.remoteTotalCountKnown = page.totalCount !== undefined;
    this.totalRecords = page.totalCount ?? page.items.length;
    this.currentPage = 0;
    this.latestSkipLoaded = 0;
    this.latestScrollTopPosition = 0;
    this.showNullData = page.items.length === 0;
    this.providerMockItem = this.createProviderMockItem(page.items[0]);
  }

  private createProviderMockItem(item?: T): T | undefined {
    if (!item || typeof item !== 'object') return undefined;

    const mock = { ...(item as Record<string, unknown>) };
    Object.keys(mock).forEach(key => {
      mock[key] = null;
    });

    return mock as T;
  }

  private appendProviderPlaceholders(): number {
    if (!this.providerMockItem) return 0;

    let count = this.pageSize;
    if (this.remoteTotalCountKnown) {
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
