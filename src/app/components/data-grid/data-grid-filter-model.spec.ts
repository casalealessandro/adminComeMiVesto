import {
  buildGridColumnFilter,
  buildGridSearch,
  normalizeGridSearchDate,
  resolveDefaultFilterOperator,
  resolveDefaultSearchOperator,
} from './data-grid-filter-model';

describe('DataGrid filter model', () => {
  describe('global search defaults', () => {
    it('should use contains for text columns', () => {
      expect(resolveDefaultSearchOperator('campo')).toBe('contains');
      expect(resolveDefaultSearchOperator('campoTesto')).toBe('contains');
    });

    it('should use equality for numeric and date-only columns', () => {
      expect(resolveDefaultSearchOperator('campoNumber')).toBe('eq');
      expect(resolveDefaultSearchOperator('campoData')).toBe('eq');
    });

    it('should use sameDay for datetime columns', () => {
      expect(resolveDefaultSearchOperator('campoDateTime')).toBe('sameDay');
    });

    it('should exclude boolean, list and non-data columns from free-text search by default', () => {
      expect(resolveDefaultSearchOperator('campoBoolean')).toBeUndefined();
      expect(resolveDefaultSearchOperator('campoLista')).toBeUndefined();
      expect(resolveDefaultSearchOperator('campoImg')).toBeUndefined();
      expect(resolveDefaultSearchOperator('editorButtons')).toBeUndefined();
    });

    it('should respect an explicit search operator override', () => {
      expect(resolveDefaultSearchOperator('campo', 'eq')).toBe('eq');
      expect(resolveDefaultSearchOperator('campoLista', 'contains')).toBe('contains');
    });
  });

  describe('column filter defaults', () => {
    it('should use contains for text and equality for number, boolean and list columns', () => {
      expect(resolveDefaultFilterOperator('campo')).toBe('contains');
      expect(resolveDefaultFilterOperator('campoTesto')).toBe('contains');
      expect(resolveDefaultFilterOperator('campoNumber')).toBe('eq');
      expect(resolveDefaultFilterOperator('campoBoolean')).toBe('eq');
      expect(resolveDefaultFilterOperator('campoLista')).toBe('eq');
    });

    it('should distinguish date-only from datetime filtering', () => {
      expect(resolveDefaultFilterOperator('campoData')).toBe('eq');
      expect(resolveDefaultFilterOperator('campoDateTime')).toBe('sameDay');
    });

    it('should ignore non-filterable UI column types by default', () => {
      expect(resolveDefaultFilterOperator('campoImg')).toBeUndefined();
      expect(resolveDefaultFilterOperator('selection')).toBeUndefined();
      expect(resolveDefaultFilterOperator('detail')).toBeUndefined();
    });

    it('should respect an explicit filter operator override', () => {
      expect(resolveDefaultFilterOperator('campo', 'startsWith')).toBe('startsWith');
      expect(resolveDefaultFilterOperator('campoNumber', 'gte')).toBe('gte');
    });
  });

  describe('date normalization', () => {
    it('should preserve the historic Italian and ISO date input formats', () => {
      expect(normalizeGridSearchDate('05/09/2026')).toBe('2026-09-05');
      expect(normalizeGridSearchDate('5-9-2026')).toBe('2026-09-05');
      expect(normalizeGridSearchDate('2026/09/05')).toBe('2026-09-05');
      expect(normalizeGridSearchDate('2026-9-5')).toBe('2026-09-05');
    });

    it('should reject invalid calendar dates and unrelated text', () => {
      expect(normalizeGridSearchDate('31/02/2026')).toBeUndefined();
      expect(normalizeGridSearchDate('not-a-date')).toBeUndefined();
    });
  });

  describe('typed global search conditions', () => {
    it('should build one OR-search condition per compatible column', () => {
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

    it('should skip numeric and date conditions when the search text cannot be converted', () => {
      expect(buildGridSearch('Alessandro', [
        { field: 'name', type: 'campoTesto' },
        { field: 'age', type: 'campoNumber' },
        { field: 'createdAt', type: 'campoDateTime' },
      ])).toEqual({
        value: 'Alessandro',
        conditions: [
          { field: 'name', operator: 'contains', value: 'Alessandro' },
        ],
      });
    });

    it('should normalize date-only and datetime values while preserving their different operators', () => {
      expect(buildGridSearch('05/09/2026', [
        { field: 'birthDate', type: 'campoData' },
        { field: 'createdAt', type: 'campoDateTime' },
      ])).toEqual({
        value: '05/09/2026',
        conditions: [
          { field: 'birthDate', operator: 'eq', value: '2026-09-05' },
          { field: 'createdAt', operator: 'sameDay', value: '2026-09-05' },
        ],
      });
    });

    it('should honor searchability and explicit operator overrides', () => {
      expect(buildGridSearch('ABC', [
        { field: 'name', type: 'campo', searchable: false },
        { field: 'sku', type: 'campo', searchOperator: 'eq' },
        { field: 'category', type: 'campoLista', searchOperator: 'contains' },
      ])).toEqual({
        value: 'ABC',
        conditions: [
          { field: 'sku', operator: 'eq', value: 'ABC' },
          { field: 'category', operator: 'contains', value: 'ABC' },
        ],
      });
    });

    it('should return no global search for blank text or when no compatible columns exist', () => {
      expect(buildGridSearch('   ', [{ field: 'name', type: 'campo' }])).toBeUndefined();
      expect(buildGridSearch('yes', [
        { field: 'active', type: 'campoBoolean' },
        { field: 'category', type: 'campoLista' },
      ])).toBeUndefined();
    });
  });

  describe('typed column filters', () => {
    it('should build contains for text and equality for numbers', () => {
      expect(buildGridColumnFilter(' ale ', { field: 'name', type: 'campo' })).toEqual({
        field: 'name',
        operator: 'contains',
        value: 'ale',
      });

      expect(buildGridColumnFilter('35', { field: 'age', type: 'campoNumber' })).toEqual({
        field: 'age',
        operator: 'eq',
        value: 35,
      });
    });

    it('should normalize dates and use sameDay for datetime columns', () => {
      expect(buildGridColumnFilter('05/09/2026', { field: 'createdAt', type: 'campoDateTime' })).toEqual({
        field: 'createdAt',
        operator: 'sameDay',
        value: '2026-09-05',
      });
    });

    it('should convert boolean select values to booleans', () => {
      expect(buildGridColumnFilter('true', { field: 'active', type: 'campoBoolean' })).toEqual({
        field: 'active',
        operator: 'eq',
        value: true,
      });

      expect(buildGridColumnFilter('false', { field: 'active', type: 'campoBoolean' })).toEqual({
        field: 'active',
        operator: 'eq',
        value: false,
      });
    });

    it('should preserve typed list values and respect an operator override', () => {
      expect(buildGridColumnFilter(12, {
        field: 'categoryId',
        type: 'campoLista',
        filterOperator: 'in',
      })).toEqual({
        field: 'categoryId',
        operator: 'in',
        value: 12,
      });
    });

    it('should remove empty or invalid filters', () => {
      expect(buildGridColumnFilter('', { field: 'name', type: 'campo' })).toBeUndefined();
      expect(buildGridColumnFilter('abc', { field: 'age', type: 'campoNumber' })).toBeUndefined();
      expect(buildGridColumnFilter('maybe', { field: 'active', type: 'campoBoolean' })).toBeUndefined();
      expect(buildGridColumnFilter('2026-99-99', { field: 'createdAt', type: 'campoDateTime' })).toBeUndefined();
    });

    it('should honor an explicit non-filterable column', () => {
      expect(buildGridColumnFilter('ale', {
        field: 'name',
        type: 'campo',
        filterable: false,
      })).toBeUndefined();
    });
  });
});
