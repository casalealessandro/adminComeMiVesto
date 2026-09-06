# DataGrid architecture map

Status: migration in progress. Phases 1-10 have progressively moved pure helpers, provider-neutral state/orchestration, CRUD/detail loading and scrollbar wiring into their target owners without rewriting the historical DataGrid behavior. Phase 11 is reducing only overrides that have become genuinely redundant.

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

The goal is one real `DataGridComponent`. `ProviderDataGridComponent` is treated as migration material, not as the final architecture.

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
- `handleKeyboardEvents()` / `navigateByKeyboard()` — keyboard UX. Data navigation helpers may later call shared state logic but the event handling stays here.
- `selectRow*`, `clickToSelect*`, `chooseRow`, `isSelectedSubRow`, `clearSelectedRows`, `confirmSelectedRows` — selection UX/public component API.
- `tdClick()`, `buttonClick()`, `btnActionClick()` — cell/button UX entry points.
- `updateRowClasses()` — row CSS state.
- `collapse()` — expand/collapse UX and CSS ownership. Remote detail loading should delegate to the engine.
- `refresh()`, `hideColumn()`, `sortColumn()` — public runtime facade. Their data work should delegate to the engine where applicable; the public methods remain on the component.
- future recovered `focusRow()` / `selectContent()` — public runtime/UX API.

### Facade methods that currently mix UX and data

These methods remain public/component entry points, but their data orchestration is a candidate for delegation to `DataGridEngine` instead of inheritance overrides:

- `renderGrid()`
- `buttonEmitted()`
- `startEdit()`
- `removeRowData()`
- `toolbarValueChanged()`
- `searchData()`
- `onScroll()`
- `renderGridDetailData()`

## 2. DataGridEngine — stateful grid orchestration

`DataGridEngine<T>` owns behavior that is independent from Angular rendering and from a concrete backend protocol.

### Data loading / refresh

Move or centralize the provider-neutral behavior currently implemented around:

- provider branch of `loadRemoteRecords()`
- `buildProviderLoadRequest()`
- `applyInitialProviderPage()`
- authoritative reload after mutations
- loading lock/state (`isLoading` equivalent owned by the engine when migrated)

Legacy `AnagraficaService`, `api` and `queryString` are not engine concepts. They should remain legacy fallback until a dedicated legacy provider/adapter is introduced.

### Paging / continuation

Move the state and orchestration currently implemented by:

- `loadNextRemotePage()`
- `remoteContinuation`
- `remoteHasMore`
- `remoteTotalCountKnown`
- `latestSkipLoaded` / page-state portions that are not DOM concerns
- mock/placeholder replacement orchestration

`onScroll()` remains the UX trigger in `DataGridComponent`; it should ask the engine to load the next page.

### Sorting

Engine ownership:

- sort state (`providerSort`, normalized sort request)
- provider sort execution
- `reloadAfterProviderSort()`
- rollback of sort/query state after provider failure

`DataGridComponent.sortColumn()` remains the public/UI command. Local compare mechanics that can be pure belong in `DataGridUtils`.

### Global search and column filters

Engine ownership:

- `providerSearch`
- `providerFilters`
- `applyProviderSearch()` data orchestration
- `applyProviderColumnFilter()` data orchestration
- paging reset / rollback after query changes
- query-state preservation across continuation and CRUD reloads
- provider debounce state if we decide debounce belongs to orchestration rather than the input control

`toolbarValueChanged()` and `searchData()` remain Angular/UI entry points.

### CRUD

Engine ownership:

- `createProviderRow()`
- `updateProviderRow()`
- `deleteProviderRow()`
- provider mutation -> authoritative reload
- mutation loading/error state

The component continues to own confirmation dialogs and event emission contracts (`buttonEmitted`, `startEdit`, `removeRowData`). Existing typed CRUD event builders remain in `data-grid-crud-event.ts`.

### Remote detail data

Engine ownership:

- `GridDetailDataProvider.load({ parentRow })` orchestration
- remote detail loading/error result

The component keeps `collapse()`, detail CSS, row expansion and `onRowExpanded` UX event emission.

### Lookup orchestration

Phase 9 decision: lookup remains a dedicated responsibility and does **not** move into `DataGridEngine`.

Ownership stays separated as follows:

- `data-grid-lookup-provider.ts` owns the provider-neutral lookup request/provider contract.
- `GridLookupRegistry` owns provider registration, provider-key resolution, row resolution, cache, concurrent-request deduplication and cache invalidation.
- `ProviderTdItemComponent` owns the provider-only cell rendering bridge: explicit `customizedOptions.lookup` opt-in, `displayExpr`/`valueExpr` resolution and fallback to the already-rendered raw value when lookup is absent or fails.
- `ProviderDataGridComponent` currently wires the lookup provider map and row resolver into the registry only because it is the migration bridge. This wiring must eventually be consumed by the single `DataGridComponent`; the lookup algorithms themselves must not be duplicated in the component or Engine.

Existing characterization tests already protect uncached behavior, cache reuse, concurrent deduplication, custom cache keys, invalidation, explicit lookup opt-in, row context, display rendering and failure fallback.

## 3. DataGridUtils — pure/stateless helpers

Only logic that can execute without Angular component state, DOM access or backend transport belongs here.

### Candidates from existing code

- local sort comparator extracted from the body of `sortColumn()` when migration begins.
- `filterNonRemoteDataSource()`.
- pure portion of `matchesLocalSearch()`.
- `formatDate()` / date normalization helpers.
- pure summary calculation behind `calcolaSomma()`.
- pure column metadata lookup currently used by `getProviderOriginalColumn()`.
- pure construction of provider search/filter column metadata currently used by `getProviderSearchColumns()` and `getProviderFilterColumn()`.
- pure value normalization currently used by `resolveProviderFilterInputValue()` where it can be parameterized without component state.
- `cloneProviderSearch()`.
- `cloneProviderFilters()`.
- pure mock-row creation currently implemented by `createProviderMockItem()`.

Utilities must not contain `EventEmitter`, `ElementRef`, signals tied to the component, `AnagraficaService`, `GridDataProvider.load()` calls, dialogs or DOM queries.

## 4. Existing files that remain separate

Do not duplicate these responsibilities in the new classes:

- `data-grid-provider.ts` — provider-neutral contracts and request/page/sort/filter/search models.
- `data-grid-filter-model.ts` — typed search/filter model builders; pure pieces may later be consolidated with `DataGridUtils` only if doing so clearly reduces duplication.
- `data-grid-detail-provider.ts` — remote detail provider contract.
- `data-grid-lookup-provider.ts` — lookup provider contract.
- `data-grid-lookup-registry.ts` — lookup provider registry/cache behavior.
- `data-grid-crud-event.ts` — typed CRUD event contract/builders.

## 5. ProviderDataGridComponent override recount — Phase 11

Phase 11 starts from the original 13 overrides. `ngAfterViewInit()` is now removed because Phase 10 eliminated the manual scrollbar listener and the remaining lookup row-resolver can be configured directly when `lookupProviders` is set. The base `DataGridComponent.ngAfterViewInit()` remains the only view-lifecycle owner.

**Residual override count: 12.**

| Override | Phase 11 status / reason |
| --- | --- |
| `ngAfterViewInit()` | **Removed in Phase 11.** No provider-specific view lifecycle remains. |
| `ngOnDestroy()` | Keep for now: provider debounce timers, lookup-registry cleanup and transient provider scroll reference are still bridge-owned. |
| `buildAndTestQueryString()` | Keep for now: a configured `GridDataProvider` must bypass the legacy `queryString`/`dataJson` validation path. |
| `buildHeaderColumns()` | Keep for now: provider columns still need explicit `allowFiltering=false` handling and lookup metadata propagation after the historical base builder. |
| `loadRemoteRecords()` | Keep as component facade: provider load is delegated to Engine, but rows/loading/cursor state is still component-owned. |
| `renderGridDetailData()` | Keep as UX facade: Engine loads detail rows; component still owns detail state and `onRowExpanded`. |
| `buttonEmitted()` | Keep: provider path still uses typed create-event construction while preserving historical toolbar/start-edit flow. |
| `startEdit()` | Keep: provider path still emits the typed update-event contract without performing inline update. |
| `removeRowData()` | Keep: confirmation/local-event/provider-delete branching is still UX/component behavior. |
| `sortColumn()` | Keep as public/UI facade: Engine owns provider sort state but component still owns asc/desc indicator and visual rollback. |
| `toolbarValueChanged()` | Keep: input/debounce UX still distinguishes local and provider search paths. |
| `searchData()` | Keep: DOM filter input decoding/debounce remains component UX; typed filter state is delegated. |
| `onScroll()` | Keep: Angular scroll event and viewport behavior remain component UX; Engine owns continuation request/state. |

The rule is unchanged: an override disappears only when its current provider-specific behavior has a shared owner. Phase 11 deliberately does **not** rewrite base methods merely to reduce the count.

Target result remains zero provider-specific Angular overrides and, if the migration succeeds as expected, deletion of `ProviderDataGridComponent` in favor of one `DataGridComponent` using `DataGridEngine` plus the existing provider contracts.

## 6. Migration rule

1. Do not rewrite behavior while moving it.
2. Move one ownership group at a time.
3. Preserve existing tests and add characterization tests before each move when coverage is missing.
4. Keep `DataGridComponent` public inputs/outputs/runtime methods compatible.
5. Never introduce Firebase, Firestore, REST, OData, GraphQL or ComeMiVesto assumptions into Engine or Utils.
6. Delete an override only after its behavior is demonstrably provided through the shared architecture.
