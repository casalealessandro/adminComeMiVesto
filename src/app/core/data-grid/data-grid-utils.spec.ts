import { DataGridUtils } from './data-grid-utils';

describe('DataGridUtils', () => {
  it('should preserve the historic local sort comparator semantics', () => {
    expect(DataGridUtils.compareValues('Anna', 'Mario', 'asc')).toBe(-1);
    expect(DataGridUtils.compareValues('Anna', 'Mario', 'desc')).toBe(1);
    expect(DataGridUtils.compareValues(2, 2, 'asc')).toBe(0);
  });

  it('should preserve local contains, startsWith and exact matching semantics', () => {
    expect(DataGridUtils.matchesLocalSearch('Alessandro', 'sand')).toBeTrue();
    expect(DataGridUtils.matchesLocalSearch('Alessandro', 'ale', false, 'startsWith')).toBeTrue();
    expect(DataGridUtils.matchesLocalSearch('Alessandro', 'sand', false, 'startsWith')).toBeFalse();
    expect(DataGridUtils.matchesLocalSearch(true, 'TRUE', true)).toBeTrue();
    expect(DataGridUtils.matchesLocalSearch(true, 'true')).toBeFalse();
    expect(DataGridUtils.matchesLocalSearch(['Anna'], 'anna')).toBeFalse();
  });

  it('should filter local rows without mutating the source array', () => {
    const rows = [
      { name: 'Mario' },
      { name: 'Anna' },
      { name: 'Luca' },
    ];

    const filtered = DataGridUtils.filterNonRemoteDataSource(rows, 'name', 'a');

    expect(filtered).toEqual([{ name: 'Mario' }, { name: 'Anna' }, { name: 'Luca' }]);
    expect(filtered).not.toBe(rows);
    expect(rows.map(row => row.name)).toEqual(['Mario', 'Anna', 'Luca']);
  });

  it('should preserve the historic date formatter output', () => {
    expect(DataGridUtils.formatDate('2026-09-06')).toBe('2026-09-06');
    expect(DataGridUtils.formatDate('06/09/2026')).toBe('2026-09-06');
    expect(DataGridUtils.formatDate('06/09/2026', 'it')).toBe('06-09-2026 ');
    expect(DataGridUtils.formatDate('not-a-date')).toBe('');
  });

  it('should calculate a configured column summary without mutating rows', () => {
    const rows = [{ total: 10 }, { total: 5 }];

    expect(DataGridUtils.calculateColumnSummary(rows, {
      dataField: 'total',
      showInSummary: true,
    } as any)).toBe(15);
    expect(rows).toEqual([{ total: 10 }, { total: 5 }]);
  });

  it('should clone provider query state instead of sharing nested objects', () => {
    const search = {
      value: 'anna',
      conditions: [{ field: 'name', operator: 'contains' as const, value: 'anna' }],
    };
    const filters = [{ field: 'active', operator: 'eq' as const, value: true }];
    const sorts = [{ field: 'name', direction: 'asc' as const }];

    const clonedSearch = DataGridUtils.cloneSearch(search)!;
    const clonedFilters = DataGridUtils.cloneFilters(filters);
    const clonedSorts = DataGridUtils.cloneSorts(sorts);

    expect(clonedSearch).toEqual(search);
    expect(clonedSearch).not.toBe(search);
    expect(clonedSearch.conditions[0]).not.toBe(search.conditions[0]);
    expect(clonedFilters).toEqual(filters);
    expect(clonedFilters[0]).not.toBe(filters[0]);
    expect(clonedSorts).toEqual(sorts);
    expect(clonedSorts[0]).not.toBe(sorts[0]);
  });

  it('should preserve typed list values when resolving provider filter input', () => {
    const colsHeader = [{
      dataField: 'status',
      type: 'campoLista',
      customizedOptions: {
        options: [
          { id: 1, label: 'Active' },
          { id: 2, label: 'Disabled' },
        ],
        valueExp: 'id',
      },
    }] as any;

    expect(DataGridUtils.resolveProviderFilterInputValue(colsHeader, [], 'status', '2')).toBe(2);
  });

  it('should build a null-valued provider mock item without mutating the source row', () => {
    const row: Record<string, unknown> = { id: 1, name: 'Anna' };

    expect(DataGridUtils.createMockItem(row)).toEqual({ id: null, name: null });
    expect(row).toEqual({ id: 1, name: 'Anna' });
  });
});
