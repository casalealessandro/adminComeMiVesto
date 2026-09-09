import {
  buildGridColumnFilter,
  buildGridSearch,
  normalizeGridSearchDate,
  resolveDefaultFilterOperator,
  resolveDefaultSearchOperator,
} from './data-grid-filter-model';

describe('DataGrid filter model', () => {
  it('preserves provider-neutral search defaults', () => {
    expect(resolveDefaultSearchOperator('campo')).toBe('contains');
    expect(resolveDefaultSearchOperator('campoNumber')).toBe('eq');
    expect(resolveDefaultSearchOperator('campoData')).toBe('eq');
    expect(resolveDefaultSearchOperator('campoDateTime')).toBe('sameDay');
    expect(resolveDefaultSearchOperator('campoBoolean')).toBeUndefined();
  });

  it('preserves provider-neutral filter defaults', () => {
    expect(resolveDefaultFilterOperator('campo')).toBe('contains');
    expect(resolveDefaultFilterOperator('campoNumber')).toBe('eq');
    expect(resolveDefaultFilterOperator('campoBoolean')).toBe('eq');
    expect(resolveDefaultFilterOperator('campoLista')).toBe('eq');
  });

  it('normalizes historic Italian and ISO date formats', () => {
    expect(normalizeGridSearchDate('05/09/2026')).toBe('2026-09-05');
    expect(normalizeGridSearchDate('2026-9-5')).toBe('2026-09-05');
    expect(normalizeGridSearchDate('31/02/2026')).toBeUndefined();
  });

  it('builds typed global search conditions', () => {
    expect(buildGridSearch('35', [
      { field: 'name', type: 'campo' },
      { field: 'age', type: 'campoNumber' },
      { field: 'active', type: 'campoBoolean' },
    ])).toEqual({
      value: '35',
      conditions: [
        { field: 'name', operator: 'contains', value: '35' },
        { field: 'age', operator: 'eq', value: 35 },
      ],
    });
  });

  it('builds typed column filters and rejects invalid values', () => {
    expect(buildGridColumnFilter('35', { field: 'age', type: 'campoNumber' })).toEqual({
      field: 'age', operator: 'eq', value: 35,
    });
    expect(buildGridColumnFilter('true', { field: 'active', type: 'campoBoolean' })).toEqual({
      field: 'active', operator: 'eq', value: true,
    });
    expect(buildGridColumnFilter('abc', { field: 'age', type: 'campoNumber' })).toBeUndefined();
    expect(buildGridColumnFilter('', { field: 'name', type: 'campo' })).toBeUndefined();
  });

  it('respects search/filter operator overrides', () => {
    expect(resolveDefaultSearchOperator('campo', 'eq')).toBe('eq');
    expect(resolveDefaultFilterOperator('campoNumber', 'gte')).toBe('gte');
  });
});
