export interface GridDetailLoadRequest<TParent = unknown> {
  parentRow: TParent;
}

/**
 * Provider-neutral contract used to load the detail rows of one master row.
 */
export interface GridDetailDataProvider<TParent = unknown, TDetail = unknown> {
  load(request: GridDetailLoadRequest<TParent>): Promise<TDetail[]>;
}
