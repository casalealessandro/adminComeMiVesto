# DataGrid architecture map

Status: **provider-neutral core migration completed**.

The historical `DataGridComponent` behavior has been reorganized progressively without replacing its working algorithms. Provider-neutral state/orchestration now lives in `DataGridEngine`, pure helpers live in `DataGridUtils`, and the Angular/UX/runtime facade is the single `DataGridComponent`.

## Final structure

```text
DataGridComponent<T>
  Angular / UX / DOM / public runtime facade
        |
        v
DataGridEngine<T>
  provider-neutral state and orchestration
        |
        v
GridDataProvider<T>
  and the existing provider-neutral contracts

DataGridUtils
  pure/stateless helpers shared by component and engine

GridLookupRegistry
  lookup registration/cache/dedup/row resolution
```

There is one real grid component: `DataGridComponent<T>` / `<app-data-grid>`.

`provider-data-grid.component.ts` is no longer an Angular component and no longer defines a subclass or selector. It currently contains only a TypeScript compatibility re-export:

```ts
export { DataGridComponent as ProviderDataGridComponent } from './data-grid.component';
```

This keeps the historical provider safety-net tests source-compatible while they exercise the exact same `DataGridComponent` class. It owns no runtime behavior and can be deleted once those legacy test imports are renamed.

## 1. DataGridComponent — Angular, UX and public facade

`DataGridComponent<T>` owns the visual/runtime responsibilities that belong to the component:

- Angular lifecycle and DOM sizing;
- responsive wrapper handling / `ResizeObserver`;
- rendering/template/CSS state;
- toolbar UX;
- column/header visual model;
- detail-grid visual structure;
- column sizing and body styles;
- keyboard/focus/selection UX;
- cell/button UX;
- row CSS state;
- expand/collapse UX;
- public runtime methods such as `refresh()`, `hideColumn()` and `sortColumn()`;
- loading/cursor presentation;
- debounce timers and scroll viewport behavior.

Mixed UX/data entry points remain component facades and delegate provider-neutral work to the Engine:

- `renderGrid()`
- `loadRemoteRecords()`
- `buttonEmitted()`
- `startEdit()`
- `removeRowData()`
- `toolbarValueChanged()`
- `searchData()`
- `onScroll()`
- `renderGridDetailData()`

### Provider-aware inputs and runtime surface

The shared component directly owns:

- `@Input() dataProvider?: GridDataProvider<T>`
- `@Input() detailDataProvider?: GridDetailDataProvider<T, any>`
- `@Input() lookupProviders`
- one `DataGridEngine<T>` instance
- one component-scoped `GridLookupRegistry`
- remote continuation/hasMore facades
- provider mock-row state used by visual paging
- provider search/filter debounce state
- provider scroll state needed by the historical infinite-scroll UX.

The legacy `AnagraficaService` path is still present as a compatibility fallback. If no provider is configured, the historical `api` / `queryString` path remains available.

## 2. DataGridEngine — provider-neutral state/orchestration

`DataGridEngine<T>` is independent from Angular rendering and from backend protocols.

It owns:

### Query state

- provider sort state;
- provider global-search state;
- provider column-filter state;
- snapshot/set/restore operations used for rollback.

### Loading and paging

- provider request construction;
- initial provider load delegation;
- continuation provider load delegation;
- opaque continuation state;
- `hasMore` state;
- known/unknown total-count state;
- initial/continuation page-state transitions.

### CRUD orchestration

- provider `create` calls;
- provider `update` calls;
- provider `delete` calls;
- mutation -> authoritative reload orchestration.

The component continues to own confirmation dialogs, external event contracts and visual loading state.

### Detail loading

The Engine owns the provider-neutral call:

```text
GridDetailDataProvider.load({ parentRow })
```

The component owns expansion state, detail rows and the historical `onRowExpanded` event.

### Forbidden Engine dependencies

The Engine must not know about:

- `AnagraficaService`;
- Firebase / Firestore;
- REST/OData/GraphQL syntax;
- endpoint URLs;
- DOM / `ElementRef`;
- Angular `EventEmitter`;
- ComeMiVesto-specific domain objects.

## 3. DataGridUtils — pure/stateless helpers

`DataGridUtils` contains only deterministic helpers, including:

- local comparison for sorting;
- local search matching;
- local filtering;
- date formatting;
- summary calculation;
- original-column lookup;
- provider search-column discovery;
- provider filter-column lookup;
- provider filter input normalization;
- search/filter/sort cloning;
- provider mock-row creation.

Utilities must remain free of component state, DOM, EventEmitters, dialogs and transport calls.

## 4. Lookup architecture

Lookup is intentionally separate from `DataGridEngine`.

Ownership:

- `data-grid-lookup-provider.ts` — provider-neutral lookup contract;
- `GridLookupRegistry` — provider registration, row resolution, cache, concurrent-request deduplication and invalidation;
- `TdItemComponent` — visual rendering for both historical/manual lookup behavior and explicit provider-neutral `customizedOptions.lookup`;
- `DataGridComponent` — Registry scope plus `lookupProviders` / row-resolver wiring.

The former provider-specific TdItem path has been removed. The shared `TdItemComponent` is the only cell renderer.

## 5. Search and filters

Provider remote mode supports:

- global OR search through typed conditions;
- explicit per-column filters as an AND list;
- typed text/number/date/dateTime/boolean/list values;
- existing debounce timings;
- paging reset after query changes;
- rollback of the previous query state when a reload fails;
- preservation of active search/filter/sort state across continuation pages and CRUD reloads.

Local/non-remote search continues through the historical component path and pure `DataGridUtils` helpers.

## 6. Sorting

`sortColumn()` remains the public component API.

Local mode:

- preserves the historical column/direction toggle;
- sorts a copy of `rowsData()`;
- delegates only value comparison to `DataGridUtils`.

Provider remote mode:

- keeps the same visual sort indicator behavior;
- stores normalized `GridSort` in `DataGridEngine`;
- reloads the first provider page;
- preserves rollback when the provider load fails;
- preserves the sort on continuation pages.

## 7. CRUD

The public/editor event flow remains in `DataGridComponent`.

Typed CRUD payload builders remain in `data-grid-crud-event.ts`:

- create -> `buttonNewRowEvent`;
- update -> `buttonEditRowEvent`;
- delete -> `delRows` for the historical local event flow.

Provider remote delete continues to call the provider directly instead of assuming an `id` field or backend URL shape.

## 8. Paging / historical scroll UX

The historical provider infinite-scroll behavior is preserved in the component:

- near-bottom trigger;
- loading lock;
- temporary mock rows;
- configurable historical short loading delay;
- 10px visual pull-back while loading;
- replacement/removal of placeholders;
- continuation paging;
- page counters and scroll-position reset.

The backend paging token is opaque to the grid.

## 9. ProviderDataGridComponent migration result

Original provider override count: **13**.

Final provider override count: **0**.

The Angular subclass and `app-provider-data-grid` selector have been removed.

The remaining `ProviderDataGridComponent` identifier is only a TypeScript re-export name used by historical provider tests. Those tests therefore instantiate the exact shared `DataGridComponent` implementation.

Runtime application views should use:

```html
<app-data-grid ...></app-data-grid>
```

and import `DataGridComponent` directly.

## 10. Existing provider-neutral contracts that remain separate

Do not duplicate these responsibilities:

- `data-grid-provider.ts` — provider/request/page/sort/filter/search contracts;
- `data-grid-filter-model.ts` — typed search/filter model builders;
- `data-grid-detail-provider.ts` — remote detail provider contract;
- `data-grid-lookup-provider.ts` — lookup provider contract;
- `data-grid-lookup-registry.ts` — lookup registry/cache behavior;
- `data-grid-crud-event.ts` — typed CRUD event contracts/builders.

## 11. Migration rules preserved

1. Do not rewrite working behavior while moving ownership.
2. Move one ownership group at a time.
3. Preserve characterization tests before removing duplicate paths.
4. Keep the `DataGridComponent` public API compatible.
5. Keep Engine and Utils backend-neutral.
6. Delete an override only after equivalent behavior exists in the shared architecture.
7. Do not remove historical fallback behavior merely because a provider path now exists.

## 12. Remaining cleanup only

No provider-specific runtime architecture remains.

Optional non-functional cleanup for a later commit:

- rename the historical `provider-data-grid*.spec.ts` files to `data-grid.provider*.spec.ts`;
- change their imports from the compatibility `ProviderDataGridComponent` re-export to `DataGridComponent`;
- then delete `provider-data-grid.component.ts` completely;
- remove the now-unused transitional `providerFacadeActive` field when a surgical patch path is available.

These items do not block the single-grid architecture and must not be mixed with functional changes.
