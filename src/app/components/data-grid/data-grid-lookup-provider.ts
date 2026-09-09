export interface GridLookupRequest<TValue = unknown, TRow = unknown> {
  value: TValue;
  rowData?: TRow;
  dataField?: string;
}

/**
 * Provider-neutral contract for resolving one display value used by a grid cell.
 */
export interface GridLookupDataProvider<TResult = unknown, TValue = unknown, TRow = unknown> {
  load(request: GridLookupRequest<TValue, TRow>): Promise<TResult | undefined>;
}
