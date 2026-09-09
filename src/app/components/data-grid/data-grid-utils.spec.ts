import { DataGridUtils } from './data-grid-utils';

describe('DataGridUtils', () => {
  it('preserves historic local sort semantics', () => {
    expect(DataGridUtils.compareValues('Anna', 'Mario', 'asc')).toBe(-1);
    expect(DataGridUtils.compareValues('Anna', 'Mario', 'desc')).toBe(1);
    expect(DataGridUtils.compareValues(2, 2, 'asc')).toBe(0);
  });

  it('preserves local contains, startsWith and exact matching', () => {
    expect(DataGridUtils.matchesLocalSearch('Alessandro', 'sand')).toBeTrue();
    expect(DataGridUtils.matchesLocalSearch('Alessandro', 'ale', false, 'startsWith')).toBeTrue();
    expect(DataGridUtils.matchesLocalSearch(true, 'TRUE', true)).toBeTrue();
    expect(DataGridUtils.matchesLocalSearch(['Anna'], 'anna')).toBeFalse();
  });

  it('filters local rows without mutating source', () => {
    const rows = [{ name: 'Mario' }, { name: 'Anna' }, { name: 'Luca' }];
    const filtered = DataGridUtils.filterNonRemoteDataSource(rows, 'name', 'a');
    expect(filtered).toEqual(rows);
    expect(filtered).not.toBe(rows);
  });

  it('preserves historic date formatting', () => {
    expect(DataGridUtils.formatDate('2026-09-06')).toBe('2026-09-06');
    expect(DataGridUtils.formatDate('06/09/2026')).toBe('2026-09-06');
    expect(DataGridUtils.formatDate('06/09/2026', 'it')).toBe('06-09-2026 ');
    expect(DataGridUtils.formatDate('not-a-date')).toBe('');
  });

  it('clones provider query state', () => {
    const search = { value: 'anna', conditions: [{ field: 'name', operator: 'contains' as const, value: 'anna' }] };
    const filters = [{ field: 'active', operator: 'eq' as const, value: true }];
    const sorts = [{ field: 'name', direction: 'asc' as const }];

    const clonedSearch = DataGridUtils.cloneSearch(search)!;
    const clonedFilters = DataGridUtils.cloneFilters(filters);
    const clonedSorts = DataGridUtils.cloneSorts(sorts);

    expect(clonedSearch).toEqual(search);
    expect(clonedSearch).not.toBe(search);
    expect(clonedSearch.conditions[0]).not.toBe(search.conditions[0]);
    expect(clonedFilters[0]).not.toBe(filters[0]);
    expect(clonedSorts[0]).not.toBe(sorts[0]);
  });

  it('creates null-valued mock rows without mutating source', () => {
    const row: Record<string, unknown> = { id: 1, name: 'Anna' };
    expect(DataGridUtils.createMockItem(row)).toEqual({ id: null, name: null });
    expect(row).toEqual({ id: 1, name: 'Anna' });
  });
});
