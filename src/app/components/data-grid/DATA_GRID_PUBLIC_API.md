# DataGrid public API

`DataGridComponent<T>` is the single Angular grid component. It supports both the historical local/legacy path and the provider-neutral remote path through the same `<app-data-grid>` selector.

This document describes the public integration surface. Implementation details remain split between `DataGridComponent`, `DataGridEngine`, `DataGridUtils` and `GridLookupRegistry` as documented in `DATA_GRID_ARCHITECTURE.md`.

## Provider inputs

### `dataProvider?: GridDataProvider<T>`

Enables the provider-neutral remote path. When configured, the grid delegates normalized paging, search, filters, sorting and optional mutations to the provider instead of building backend-specific query syntax.

The provider owns transport details, authentication, row identity and translation of semantic grid operators to the target backend.

### `detailDataProvider?: GridDetailDataProvider<T, TDetail>`

Optional provider used by remote master/detail rows. The grid passes the exact parent row and keeps visual expansion state in the Angular component.

### `lookupProviders`

Registers provider-neutral cell lookup implementations in the grid-scoped `GridLookupRegistry`. Lookups run only for columns that explicitly opt in through `customizedOptions.lookup`.

## Runtime methods

### `refresh()`

Reloads the grid through the active data path. Existing local/legacy behavior is preserved; provider-backed grids reload through the common provider path.

### `sortColumn(column)`

Public sorting facade used by templates and parent components.

- local mode preserves the historical in-memory comparator and asc/desc toggle;
- provider mode stores normalized `GridSort` state, reloads the first page and restores the previous state if the provider reload fails.

### `applyProviderSearch(value)`

Applies one provider-neutral global search and reloads the first remote page. Active column filters and sorting are preserved. A failed reload restores the previous search state.

### `applyProviderColumnFilter(field, value)`

Applies or clears one typed explicit column filter. Filters for other fields are preserved and combined with AND semantics. Active global search and sorting remain independent.

### `loadNextRemotePage()`

Loads the next provider page using the opaque continuation token. The component preserves the historical infinite-scroll UX, including loading lock, placeholder rows and scroll-position behavior.

### `createProviderRow(data)`

Executes provider `create` when available and performs the authoritative grid reload through `DataGridEngine`.

### `updateProviderRow(data)`

Executes provider `update` with the complete row. The grid does not assume an `id` or another key field; identity belongs to the provider.

### `deleteProviderRow(data)`

Executes provider `delete` with the complete row and performs the authoritative reload. Confirmation and emitted UI-event behavior remain component concerns.

### `hideColumn(colIndex)`

Removes one visible header column by index and recalculates column sizing. Invalid indexes are ignored.

### `calcolaSomma(cols)`

Calculates the historical footer summary for a configured column. The pure reduction is delegated to `DataGridUtils`, while the component preserves its existing summary side effects.

### `filterNonRemoteDataSource(array, dataField, searchText, exact?, searchType?)`

Compatibility facade for historical local filtering. Matching rules are implemented by the stateless `DataGridUtils` helpers.

### `clearSelectedRows()` / `confirmSelectedRows()`

Public selection actions retained by the Angular component because selection is UI/runtime state rather than provider state.

## Provider request semantics

A `GridDataProvider` receives a normalized `GridLoadRequest`:

```ts
{
  pageSize,
  continuation?,
  search?,
  filters?,
  sort?
}
```

Rules:

- `continuation` is opaque and provider-owned;
- `search.conditions` form one OR group;
- explicit `filters` form an AND list;
- `sort` contains normalized field/direction pairs;
- no Firebase, REST, OData or database-specific syntax belongs in the grid core.

## Minimal provider example

```ts
export class ExampleGridProvider implements GridDataProvider<Row> {
  async load(request: GridLoadRequest): Promise<GridPage<Row>> {
    return this.api.loadRows(request);
  }
}
```

Template:

```html
<app-data-grid
  [dataProvider]="provider"
  [remoteOperation]="true"
  [colonne]="columns">
</app-data-grid>
```

## Ownership rule

Public methods remain on `DataGridComponent` when callers or templates need a stable runtime facade. Provider-neutral state and orchestration belong to `DataGridEngine`; pure calculations belong to `DataGridUtils`; lookup cache/registration belongs to `GridLookupRegistry`.

Do not bypass those ownership boundaries by adding backend-specific syntax directly to `DataGridComponent`.
