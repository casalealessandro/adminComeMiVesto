import { GridFilterOperator } from './data-grid-provider';

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
