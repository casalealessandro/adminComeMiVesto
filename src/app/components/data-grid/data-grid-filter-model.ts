import { GridFilter, GridFilterOperator, GridSearch } from './data-grid-provider';

/**
 * Minimal filtering metadata understood by the DataGrid core.
 *
 * The `type` values mirror the existing reusable DataGrid column types without
 * introducing any backend/protocol dependency. Operator overrides remain
 * optional: when omitted, the grid resolves a sensible default from the column
 * type.
 */
export interface GridFilterColumnMetadata {
  field: string;
  type: string;
  searchable?: boolean;
  searchOperator?: GridFilterOperator;
  filterOperator?: GridFilterOperator;
}

const STRING_TYPES = new Set(['campo', 'campoTesto']);
const NUMBER_TYPES = new Set(['campoNumber']);
const DATE_TYPES = new Set(['campoData']);
const DATETIME_TYPES = new Set(['campoDateTime']);
const BOOLEAN_TYPES = new Set(['campoBoolean']);
const LIST_TYPES = new Set(['campoLista']);

/**
 * Resolve the default operator used by the global search.
 *
 * Historic behavior is preserved where meaningful:
 * - text -> contains
 * - number -> equality
 * - date -> equality
 * - datetime -> same calendar day (provider translates this semantic operator)
 * - boolean/list/non-data UI columns -> excluded from free-text global search
 */
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

/**
 * Resolve the default operator used by an explicit column filter.
 *
 * Unlike global free-text search, boolean and list columns have an unambiguous
 * equality filter because their UI can provide typed values.
 */
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

/**
 * Normalize the date formats historically accepted by the DataGrid search
 * (`yyyy-MM-dd`, `yyyy/MM/dd`, `dd-MM-yyyy`, `dd/MM/yyyy`) to `yyyy-MM-dd`.
 */
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

/**
 * Build the typed OR conditions used by provider-neutral global search.
 *
 * The same raw text may produce different typed values per column, matching the
 * historic DataGrid behavior. Example: `"35"` becomes `contains("35")` for a
 * text column and `eq(35)` for a numeric column. Unsupported conversions are
 * skipped rather than invalidating the whole search.
 */
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

    conditions.push({
      field: column.field,
      operator,
      value: typedValue,
    });
  });

  if (conditions.length === 0) return undefined;

  return {
    value: searchValue,
    conditions,
  };
}
