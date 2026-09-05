import {
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
});
