import { GridFilter, GridFilterOperator, GridSearch } from './data-grid-provider';

export interface GridFilterColumnMetadata {
  field: string;
  type: string;
  searchable?: boolean;
  filterable?: boolean;
  searchOperator?: GridFilterOperator;
  filterOperator?: GridFilterOperator;
}

const STRING_TYPES = new Set(['campo', 'campoTesto']);
const NUMBER_TYPES = new Set(['campoNumber']);
const DATE_TYPES = new Set(['campoData']);
const DATETIME_TYPES = new Set(['campoDateTime']);
const BOOLEAN_TYPES = new Set(['campoBoolean']);
const LIST_TYPES = new Set(['campoLista']);

export function resolveDefaultSearchOperator(
  columnType: string,
  override?: GridFilterOperator,
): GridFilterOperator | undefined {
  if (override) return override;
  if (STRING_TYPES.has(columnType)) return 'contains';
  if (NUMBER_TYPES.has(columnType)) return 'eq';
  if (DATE_TYPES.has(columnType)) return 'eq';
  if (DATETIME_TYPES.has(columnType)) return 'sameDay';
  return undefined;
}

export function resolveDefaultFilterOperator(
  columnType: string,
  override?: GridFilterOperator,
): GridFilterOperator | undefined {
  if (override) return override;
  if (STRING_TYPES.has(columnType)) return 'contains';
  if (NUMBER_TYPES.has(columnType)) return 'eq';
  if (DATE_TYPES.has(columnType)) return 'eq';
  if (DATETIME_TYPES.has(columnType)) return 'sameDay';
  if (BOOLEAN_TYPES.has(columnType)) return 'eq';
  if (LIST_TYPES.has(columnType)) return 'eq';
  return undefined;
}

export function normalizeGridSearchDate(value: string): string | undefined {
  const input = value.trim();
  let year: number;
  let month: number;
  let day: number;

  const isoMatch = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(input);
  const italianMatch = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(input);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (italianMatch) {
    day = Number(italianMatch[1]);
    month = Number(italianMatch[2]);
    year = Number(italianMatch[3]);
  } else {
    return undefined;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function buildGridSearch(
  value: string,
  columns: GridFilterColumnMetadata[],
): GridSearch | undefined {
  const searchValue = value?.trim();
  if (!searchValue) return undefined;

  const conditions: GridFilter[] = [];

  columns.forEach(column => {
    if (!column.field || column.searchable === false) return;

    const operator = resolveDefaultSearchOperator(column.type, column.searchOperator);
    if (!operator) return;

    let typedValue: unknown = searchValue;

    if (NUMBER_TYPES.has(column.type)) {
      const numericValue = Number(searchValue);
      if (Number.isNaN(numericValue)) return;
      typedValue = numericValue;
    } else if (DATE_TYPES.has(column.type) || DATETIME_TYPES.has(column.type)) {
      const normalizedDate = normalizeGridSearchDate(searchValue);
      if (!normalizedDate) return;
      typedValue = normalizedDate;
    }

    conditions.push({ field: column.field, operator, value: typedValue });
  });

  if (conditions.length === 0) return undefined;
  return { value: searchValue, conditions };
}

export function buildGridColumnFilter(
  value: unknown,
  column: GridFilterColumnMetadata,
): GridFilter | undefined {
  if (!column.field || column.filterable === false) return undefined;

  const operator = resolveDefaultFilterOperator(column.type, column.filterOperator);
  if (!operator) return undefined;
  if (value === null || value === undefined) return undefined;

  let typedValue: unknown = value;

  if (typeof value === 'string') {
    const filterValue = value.trim();
    if (!filterValue) return undefined;
    typedValue = filterValue;
  }

  if (NUMBER_TYPES.has(column.type)) {
    const numericValue = Number(typedValue);
    if (Number.isNaN(numericValue)) return undefined;
    typedValue = numericValue;
  } else if (DATE_TYPES.has(column.type) || DATETIME_TYPES.has(column.type)) {
    const normalizedDate = normalizeGridSearchDate(String(typedValue));
    if (!normalizedDate) return undefined;
    typedValue = normalizedDate;
  } else if (BOOLEAN_TYPES.has(column.type)) {
    if (typeof typedValue === 'string') {
      if (typedValue === 'true') typedValue = true;
      else if (typedValue === 'false') typedValue = false;
      else return undefined;
    }
    if (typeof typedValue !== 'boolean') return undefined;
  }

  return { field: column.field, operator, value: typedValue };
}
