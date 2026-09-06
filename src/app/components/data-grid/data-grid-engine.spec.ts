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
});
