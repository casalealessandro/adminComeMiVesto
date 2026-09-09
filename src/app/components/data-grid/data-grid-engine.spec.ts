import { DataGridEngine } from './data-grid-engine';

describe('DataGridEngine', () => {
  it('starts with isolated empty provider query and paging state', () => {
    const first = new DataGridEngine();
    const second = new DataGridEngine();

    first.providerSort = [{ field: 'name', direction: 'asc' }];
    first.remoteContinuation = 'page-2';

    expect(second.providerSort).toEqual([]);
    expect(second.providerSearch).toBeUndefined();
    expect(second.providerFilters).toEqual([]);
    expect(second.remoteContinuation).toBeUndefined();
    expect(second.remoteHasMore).toBeFalse();
    expect(second.remoteTotalCountKnown).toBeFalse();
  });

  it('snapshots, updates and restores query state without sharing references', () => {
    const engine = new DataGridEngine();
    engine.providerSort = [{ field: 'age', direction: 'desc' }];
    engine.providerSearch = {
      value: 'anna',
      conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
    };
    engine.providerFilters = [{ field: 'active', operator: 'eq', value: true }];

    const previousSort = engine.snapshotProviderSort();
    const previousSearch = engine.snapshotProviderSearch();
    const previousFilters = engine.snapshotProviderFilters();

    expect(previousSort).not.toBe(engine.providerSort);
    expect(previousSearch).not.toBe(engine.providerSearch);
    expect(previousFilters).not.toBe(engine.providerFilters);

    engine.setProviderSort('name', 'asc');
    engine.setProviderSearch(undefined);
    engine.setProviderColumnFilter('active', undefined);

    engine.restoreProviderSort(previousSort);
    engine.restoreProviderSearch(previousSearch);
    engine.restoreProviderFilters(previousFilters);

    expect(engine.providerSort).toEqual([{ field: 'age', direction: 'desc' }]);
    expect(engine.providerSearch?.value).toBe('anna');
    expect(engine.providerFilters).toEqual([{ field: 'active', operator: 'eq', value: true }]);
  });

  it('builds provider-neutral requests from active state', () => {
    const engine = new DataGridEngine();
    engine.providerSort = [{ field: 'name', direction: 'asc' }];
    engine.providerSearch = {
      value: 'anna',
      conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
    };
    engine.providerFilters = [{ field: 'active', operator: 'eq', value: true }];

    expect(engine.buildLoadRequest(20, { token: 'page-2' })).toEqual({
      pageSize: 20,
      continuation: { token: 'page-2' },
      search: {
        value: 'anna',
        conditions: [{ field: 'name', operator: 'contains', value: 'anna' }],
      },
      filters: [{ field: 'active', operator: 'eq', value: true }],
      sort: [{ field: 'name', direction: 'asc' }],
    });
  });

  it('delegates initial and continuation loads preserving opaque continuation', async () => {
    const engine = new DataGridEngine<{ id: number }>();
    const load = jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false });
    const provider = { load };

    await engine.loadInitialPage(provider, 20);
    expect(load).toHaveBeenCalledWith({ pageSize: 20 });

    engine.remoteContinuation = { token: 'next' };
    await engine.loadContinuationPage(provider, 10);
    expect(load).toHaveBeenCalledWith({ pageSize: 10, continuation: { token: 'next' } });
  });

  it('applies initial and continuation paging state conservatively', () => {
    const engine = new DataGridEngine<{ id: number }>();

    const initialTotal = engine.applyInitialPageState({
      items: [{ id: 1 }, { id: 2 }],
      hasMore: true,
      continuation: 'page-2',
      totalCount: 7,
    });

    expect(initialTotal).toBe(7);
    expect(engine.remoteContinuation).toBe('page-2');
    expect(engine.remoteHasMore).toBeTrue();
    expect(engine.remoteTotalCountKnown).toBeTrue();

    const runningTotal = engine.applyContinuationPageState({
      items: [{ id: 3 }],
      hasMore: true,
      continuation: 'page-3',
    }, 7, 3);

    expect(runningTotal).toBe(7);

    const finalTotal = engine.applyContinuationPageState({
      items: [{ id: 4 }],
      hasMore: false,
    }, runningTotal, 4);

    expect(finalTotal).toBe(4);
    expect(engine.remoteContinuation).toBeUndefined();
    expect(engine.remoteHasMore).toBeFalse();
  });

  it('reloads only after successful provider mutations', async () => {
    const engine = new DataGridEngine<{ id: number; name?: string }>();
    const reload = jasmine.createSpy('reload').and.resolveTo();
    const provider = {
      load: jasmine.createSpy('load'),
      create: jasmine.createSpy('create').and.resolveTo({ id: 1, name: 'Nuova' }),
      update: jasmine.createSpy('update').and.resolveTo({ id: 1, name: 'Aggiornata' }),
      delete: jasmine.createSpy('delete').and.resolveTo(),
    };

    await engine.createProviderRow(provider, { name: 'Nuova' }, reload);
    await engine.updateProviderRow(provider, { id: 1, name: 'Aggiornata' }, reload);
    await engine.deleteProviderRow(provider, { id: 1 }, reload);

    expect(reload).toHaveBeenCalledTimes(3);

    const failedReload = jasmine.createSpy('failedReload');
    const failingProvider = {
      load: jasmine.createSpy('load'),
      create: jasmine.createSpy('create').and.rejectWith(new Error('create failed')),
    };

    await expectAsync(engine.createProviderRow(failingProvider as any, {}, failedReload)).toBeRejected();
    expect(failedReload).not.toHaveBeenCalled();
  });

  it('delegates detail loading with the exact parent row', async () => {
    const engine = new DataGridEngine<{ code: string }>();
    const parentRow = { code: 'PARENT-1' };
    const details = [{ code: 'DETAIL-1' }];
    const load = jasmine.createSpy('load').and.resolveTo(details);

    const result = await engine.loadDetailRows({ load }, parentRow);

    expect(load).toHaveBeenCalledOnceWith({ parentRow });
    expect(result).toBe(details);
  });
});
