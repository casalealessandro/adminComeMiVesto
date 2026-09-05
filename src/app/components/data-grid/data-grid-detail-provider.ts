export interface GridDetailLoadRequest<TParent = unknown> {
  parentRow: TParent;
}

/**
 * Provider-neutral contract used to load the detail rows of one master row.
 *
 * The DataGrid does not know how the provider reaches its backend. REST,
 * OData, GraphQL, Firebase or any other transport remains outside the core.
 */
export interface GridDetailDataProvider<TParent = unknown, TDetail = unknown> {
  load(request: GridDetailLoadRequest<TParent>): Promise<TDetail[]>;
}
