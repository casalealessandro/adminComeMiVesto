# DataGrid architecture map

Status: migration in progress. Phases 1-10 progressively moved pure helpers, provider-neutral state/orchestration, CRUD/detail loading and scrollbar wiring into their target owners without rewriting the historical DataGrid behavior. Phase 11 removed the first genuinely redundant provider override. Phase 12 has started moving the provider facade itself into the single `DataGridComponent` and has now unified provider lookup rendering into the shared `TdItemComponent`.

## Target structure

```text
DataGridComponent
  Angular / UX / DOM / public runtime facade
        |
        v
DataGridEngine
  stateful grid orchestration
        |
        v
GridDataProvider and the existing provider-neutral contracts

DataGridUtils
  pure/stateless helpers shared by component and engine
```

The goal is one real `DataGridComponent`. `ProviderDataGridComponent` is migration material, not the final architecture.

## 1. DataGridComponent — UX and public component facade

These responsibilities remain owned by the Angular component because they build or manipulate the visual grid, DOM, focus, emitted UI events or public runtime surface.

### Keep in the component

- `ngAfterViewInit()` — DOM sizing / wrapper initialization.
- `observeWrapper()` — `ResizeObserver` and responsive width handling.
- `ngOnDestroy()` — component/DOM cleanup; provider-specific cleanup will disappear with the bridge.
- `renderToolBarGrid()` — toolbar UX construction.
- `buildHeaderColumns()` — visual column/header model construction. Provider-specific metadata patches must be removed from the bridge and resolved before/through shared metadata helpers.
- `builDetailGrid()` — detail-grid visual structure.
- `resizeCols()` — visual column sizing.
- `setStyleBody()` — visual body/table styles.
- `setCellProperty()` — editor/cell visual metadata support.
- `handleKeyboardEvents()` / `navigateByKeyboard()` — keyboard UX.
- `selectRow*`, `clickToSelect*`, `chooseRow`, `isSelectedSubRow`, `clearSelectedRows`, `confirmSelectedRows` — selection UX/public component API.
- `tdClick()`, `buttonClick()`, `btnActionClick()` — cell/button UX entry points.
- `updateRowClasses()` — row CSS state.
- `collapse()` — expand/collapse UX and CSS ownership.
- `refresh()`, `hideColumn()`, `sortColumn()` — public runtime facade.
- future recovered `focusRow()` / `selectContent()` — public runtime/UX API.

### Facade methods that mix UX and data

These remain component entry points while provider-neutral data work is delegated to `DataGridEngine`:

- `renderGrid()`
- `loadRemoteRecords()`
- `buttonEmitted()`
- `startEdit()`
- `removeRowData()`
- `toolbarValueChanged()`
- `searchData()`
- `onScroll()`
- `renderGridDetailData()`

### Phase 12 provider facade now owned by DataGridComponent

`DataGridComponent<T>` now directly owns:

- `@Input() dataProvider?: GridDataProvider<T>`
- `@Input() detailDataProvider?: GridDetailDataProvider<T, any>`
- one protected `DataGridEngine<T>` instance
- `remoteContinuation` facade
- `remoteHasMore` facade
- provider mock-row state needed by paging
- the provider branch of `loadRemoteRecords()`
- provider initial-page application
- provider bypass of the legacy `queryString` / `dataJson` validation path
- the shared progress-cursor helper used by provider mutations and paging.

The legacy `AnagraficaService` path inside `loadRemoteRecords()` and `buildAndTestQueryString()` remains intact. A configured provider selects the new branch; absence of a provider preserves the historical path.

## 2. DataGridEngine — stateful grid orchestration

`DataGridEngine<T>` owns behavior independent from Angular rendering and from a concrete backend protocol.

### Data loading / refresh

Current Engine ownership includes:

- provider-neutral initial and continuation requests
- request construction
- initial/continuation page-state transitions
- query-state cloning/snapshot/restore
- authoritative reload orchestration after mutations
- remote detail provider loading.

The component still owns visual `rowsData`, cursor and loading presentation around those operations.

Legacy `AnagraficaService`, `api` and `queryString` are not Engine concepts. They remain the legacy fallback until a dedicated adapter is introduced or that path is retired separately.

### Paging / continuation

Engine ownership:

- `remoteContinuation`
- `remoteHasMore`
- `remoteTotalCountKnown`
- continuation request construction
- initial/continuation total-record state transitions.

Component/bridge ownership still includes visual mock-row insertion/replacement and scroll behavior.

### Sorting

Engine ownership:

- normalized provider sort state
- snapshot/set/restore of provider sort
- provider request execution through the common load path.

`sortColumn()` remains UI/public facade and local comparison remains in `DataGridUtils`.

### Global search and column filters

Engine ownership:

- provider search state
- provider filter state
- snapshot/set/restore operations
- preservation of query state across loads, continuation and CRUD reloads.

Typed model construction remains in `data-grid-filter-model.ts`; DOM input/debounce behavior remains component UX.

### CRUD

Engine ownership:

- create/update/delete provider calls
- mutation -> authoritative reload orchestration.

The component keeps dialogs, event contracts and loading/cursor presentation.

### Remote detail data

Engine owns `GridDetailDataProvider.load({ parentRow })`; the component keeps detail visual state, expansion and `onRowExpanded`.

### Lookup orchestration

Phase 9 decision remains unchanged: lookup is a dedicated responsibility and does **not** move into `DataGridEngine`.

Ownership is now:

- `data-grid-lookup-provider.ts` — provider-neutral lookup contract.
- `GridLookupRegistry` — provider registration, row resolution, cache, concurrent-request deduplication and invalidation.
- `TdItemComponent` — both historical/manual cell rendering and explicit provider-neutral `customizedOptions.lookup` rendering. The Registry injection is optional, so a local/legacy grid without a registry keeps the historical behavior.
- `ProviderDataGridComponent` — temporary owner only of the Registry scope and `lookupProviders`/row-resolver wiring.

`ProviderTdItemComponent` and its dedicated spec have been removed. `ProviderDataGridComponent` now imports the same `TdItemComponent` as the base grid, and the shared `td-item.lookup.spec.ts` protects both the historical manual lookup path and the provider Registry path.

The former same-selector rendering blocker is therefore closed. The remaining lookup migration work is only to move the `GridLookupRegistry` component scope and `lookupProviders` wiring into the shared `DataGridComponent`; the lookup algorithms must stay in the Registry/TdItem owners above.

## 3. DataGridUtils — pure/stateless helpers

Current ownership includes pure/stateless behavior such as:

- local sort comparison
- local search matching/filtering
- date formatting
- summary calculation
- provider column metadata lookup
- provider search/filter metadata helpers
- provider filter input normalization
- search/filter/sort clone helpers
- mock-row creation.

Utilities must not contain `EventEmitter`, `ElementRef`, Angular component state, backend transport calls, dialogs or DOM queries.

## 4. Existing files that remain separate

Do not duplicate these responsibilities:

- `data-grid-provider.ts` — provider-neutral contracts and request/page/sort/filter/search models.
- `data-grid-filter-model.ts` — typed search/filter model builders.
- `data-grid-detail-provider.ts` — remote detail provider contract.
- `data-grid-lookup-provider.ts` — lookup provider contract.
- `data-grid-lookup-registry.ts` — lookup registry/cache behavior.
- `data-grid-crud-event.ts` — typed CRUD event contract/builders.

## 5. ProviderDataGridComponent override recount — Phase 12

Original override count: **13**.

Phase 11 removed `ngAfterViewInit()`.

Phase 12 moved `buildAndTestQueryString()` and `loadRemoteRecords()` into the shared `DataGridComponent`, so those provider overrides have also been deleted.

**Residual override count: 10.**

| Override | Phase 12 status / reason |
| --- | --- |
| `ngAfterViewInit()` | **Removed in Phase 11.** Base component is the only view-lifecycle owner. |
| `buildAndTestQueryString()` | **Removed in Phase 12.** Base method now bypasses legacy validation when `dataProvider` is configured. |
| `loadRemoteRecords()` | **Removed in Phase 12.** Base method now selects provider or legacy transport without changing either branch. |
| `ngOnDestroy()` | Keep for now: provider debounce timers, lookup-registry cleanup and transient scroll reference are still bridge-owned. |
| `buildHeaderColumns()` | Keep for now: provider filterability and lookup metadata are still patched after the historical builder. |
| `renderGridDetailData()` | Keep as UX facade: Engine loads detail rows, bridge still applies provider-specific visual result handling. |
| `buttonEmitted()` | Keep: typed provider create-event behavior is not yet in the shared facade. |
| `startEdit()` | Keep: typed provider update-event behavior is not yet in the shared facade. |
| `removeRowData()` | Keep: confirmation/local-event/provider-delete branching still lives in the bridge. |
| `sortColumn()` | Keep: provider remote sort UX/rollback still differs from the base local facade. |
| `toolbarValueChanged()` | Keep: provider search debounce/input path is still bridge-owned. |
| `searchData()` | Keep: provider filter DOM decoding/debounce is still bridge-owned. |
| `onScroll()` | Keep: provider viewport paging behavior is still bridge-owned. |

The bridge also no longer owns duplicate `dataProvider`, `detailDataProvider`, `DataGridEngine`, `remoteContinuation`, `remoteHasMore`, provider mock-row state, initial-page application or progress-cursor implementation; these are inherited from the base.

The target remains zero provider-specific Angular overrides followed by deletion of `ProviderDataGridComponent`, but only after each remaining behavior has a shared owner and the remaining lookup Registry wiring has moved safely into the base.

## 6. Migration rule

1. Do not rewrite behavior while moving it.
2. Move one ownership group at a time.
3. Preserve existing tests and add characterization tests before each move when coverage is missing.
4. Keep `DataGridComponent` public inputs/outputs/runtime methods compatible.
5. Never introduce Firebase, Firestore, REST, OData, GraphQL or ComeMiVesto assumptions into Engine or Utils.
6. Delete an override only after its behavior is demonstrably provided through the shared architecture.
