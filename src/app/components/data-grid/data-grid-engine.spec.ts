import { DataGridEngine } from './data-grid-engine';

describe('DataGridEngine query state', () => {
  it('should start with an empty provider query and paging state', () => {
    const engine = new DataGridEngine();

    expect(engine.providerSort).toEqual([]);
    expect(engine.providerSearch).toBeUndefined();
    expect(engine.providerFilters).toEqual([]);
    expect(engine.remoteContinuation).toBeUndefined();
    expect(engine.remoteHasMore).toBeFalse();
    expect(engine.remoteTotalCountKnown).toBeFalse();
  });

  it('should keep provider query and paging state isolated per engine instance', () => {
    const first = new DataGridEngine();
    const second = new DataGridEngine();

    first.providerSort = [{ field: 'name', direction: 'asc' }];
    first.providerSearch = {
      value: 'anna',
      conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
    };
    first.providerFilters = [{ field: 'active', operator: 'eq', value: true }];
    first.remoteContinuation = { token: 'page-2' };
    first.remoteHasMore = true;
    first.remoteTotalCountKnown = true;

    expect(second.providerSort).toEqual([]);
    expect(second.providerSearch).toBeUndefined();
    expect(second.providerFilters).toEqual([]);
    expect(second.remoteContinuation).toBeUndefined();
    expect(second.remoteHasMore).toBeFalse();
    expect(second.remoteTotalCountKnown).toBeFalse();
  });

  it('should snapshot, set and restore provider sort state without sharing the snapshot', () => {
    const engine = new DataGridEngine();
    engine.providerSort = [{ field: 'age', direction: 'desc' }];

    const previousSort = engine.snapshotProviderSort();

    expect(previousSort).toEqual([{ field: 'age', direction: 'desc' }]);
    expect(previousSort).not.toBe(engine.providerSort);

    engine.setProviderSort('name', 'asc');
    expect(engine.providerSort).toEqual([{ field: 'name', direction: 'asc' }]);

    engine.restoreProviderSort(previousSort);
    expect(engine.providerSort).toEqual([{ field: 'age', direction: 'desc' }]);
  });

  it('should snapshot, set and restore provider search state without sharing the snapshot', () => {
    const engine = new DataGridEngine();
    engine.providerSearch = {
      value: 'anna',
      conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
    };

    const previousSearch = engine.snapshotProviderSearch();

    expect(previousSearch).toEqual({
      value: 'anna',
      conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
    });
    expect(previousSearch).not.toBe(engine.providerSearch);
    expect(previousSearch?.conditions).not.toBe(engine.providerSearch?.conditions);

    engine.setProviderSearch({
      value: 'mario',
      conditions: [{ field: 'name', operator: 'contains', value: 'mario' }],
    });
    expect(engine.providerSearch?.value).toBe('mario');

    engine.restoreProviderSearch(previousSearch);
    expect(engine.providerSearch).toEqual({
      value: 'anna',
      conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
    });
  });

  it('should replace or remove one provider column filter and restore the previous filter list', () => {
    const engine = new DataGridEngine();
    engine.providerFilters = [
      { field: 'active', operator: 'eq', value: true },
      { field: 'age', operator: 'eq', value: 42 },
    ];

    const previousFilters = engine.snapshotProviderFilters();

    expect(previousFilters).not.toBe(engine.providerFilters);

    engine.setProviderColumnFilter('age', { field: 'age', operator: 'eq', value: 30 });
    expect(engine.providerFilters).toEqual([
      { field: 'active', operator: 'eq', value: true },
      { field: 'age', operator: 'eq', value: 30 },
    ]);

    engine.setProviderColumnFilter('age', undefined);
    expect(engine.providerFilters).toEqual([
      { field: 'active', operator: 'eq', value: true },
    ]);

    engine.restoreProviderFilters(previousFilters);
    expect(engine.providerFilters).toEqual([
      { field: 'active', operator: 'eq', value: true },
      { field: 'age', operator: 'eq', value: 42 },
    ]);
  });

  it('should build a provider-neutral load request from the current engine state', () => {
    const engine = new DataGridEngine();
    engine.providerSort = [{ field: 'name', direction: 'asc' }];
    engine.providerSearch = {
      value: 'anna',
      conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
    };
    engine.providerFilters = [{ field: 'active', operator: 'eq', value: true }];

    const request = engine.buildLoadRequest(20, { token: 'page-2' });

    expect(request).toEqual({
      pageSize: 20,
      continuation: { token: 'page-2' },
      search: {
        value: 'anna',
        conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
      },
      filters: [{ field: 'active', operator: 'eq', value: true }],
      sort: [{ field: 'name', direction: 'asc' }],
    });
    expect(request.search).not.toBe(engine.providerSearch);
    expect(request.filters).not.toBe(engine.providerFilters);
    expect(request.sort).not.toBe(engine.providerSort);
  });

  it('should delegate the initial provider load with the same engine request', async () => {
    const engine = new DataGridEngine<{ id: number }>();
    engine.providerSort = [{ field: 'id', direction: 'asc' }];

    const page = {
      items: [{ id: 1 }],
      hasMore: true,
      continuation: 'page-2',
      totalCount: 2,
    };
    const load = jasmine.createSpy('load').and.resolveTo(page);

    const result = await engine.loadInitialPage({ load }, 20);

    expect(load).toHaveBeenCalledOnceWith({
      pageSize: 20,
      sort: [{ field: 'id', direction: 'asc' }],
    });
    expect(result).toBe(page);
  });

  it('should delegate the continuation provider load with the current opaque continuation', async () => {
    const engine = new DataGridEngine<{ id: number }>();
    engine.remoteContinuation = { token: 'page-2' };
    engine.providerFilters = [{ field: 'active', operator: 'eq', value: true }];

    const page = {
      items: [{ id: 2 }],
      hasMore: false,
    };
    const load = jasmine.createSpy('load').and.resolveTo(page);

    const result = await engine.loadContinuationPage({ load }, 10);

    expect(load).toHaveBeenCalledOnceWith({
      pageSize: 10,
      continuation: { token: 'page-2' },
      filters: [{ field: 'active', operator: 'eq', value: true }],
    });
    expect(result).toBe(page);
  });

  it('should apply initial remote page state and return the effective total records', () => {
    const engine = new DataGridEngine<{ id: number }>();

    const totalRecords = engine.applyInitialPageState({
      items: [{ id: 1 }, { id: 2 }],
      hasMore: true,
      continuation: 'page-2',
      totalCount: 7,
    });

    expect(totalRecords).toBe(7);
    expect(engine.remoteContinuation).toBe('page-2');
    expect(engine.remoteHasMore).toBeTrue();
    expect(engine.remoteTotalCountKnown).toBeTrue();
  });

  it('should preserve historic continuation total-count fallback semantics', () => {
    const engine = new DataGridEngine<{ id: number }>();
    engine.remoteTotalCountKnown = true;

    const runningTotal = engine.applyContinuationPageState({
      items: [{ id: 3 }, { id: 4 }],
      hasMore: true,
      continuation: 'page-3',
    }, 7, 4);

    expect(runningTotal).toBe(7);
    expect(engine.remoteContinuation).toBe('page-3');
    expect(engine.remoteHasMore).toBeTrue();
    expect(engine.remoteTotalCountKnown).toBeTrue();

    const finalTotal = engine.applyContinuationPageState({
      items: [{ id: 5 }],
      hasMore: false,
    }, runningTotal, 5);

    expect(finalTotal).toBe(5);
    expect(engine.remoteContinuation).toBeUndefined();
    expect(engine.remoteHasMore).toBeFalse();
  });
});
