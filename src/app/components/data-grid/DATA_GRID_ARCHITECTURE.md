# DataGrid architecture map

Status: planning only. No existing DataGrid runtime method has been moved or rewritten in this phase.

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

No body is changed during the mapping phase.

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

Keep the existing provider-neutral lookup contracts/files. `GridLookupRegistry` remains a dedicated service unless later analysis proves it belongs inside the engine. Do not duplicate lookup logic in `DataGridEngine`.

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

## 5. Mapping of the 13 current ProviderDataGridComponent overrides

| Current override | Final owner / direction |
| --- | --- |
| `ngAfterViewInit()` | remove provider override; base `DataGridComponent` owns lifecycle. Scroll bridge must disappear. |
| `ngOnDestroy()` | remove provider override; Engine/service cleanup must not require a second component lifecycle. |
| `buildAndTestQueryString()` | remove provider override; legacy query-string validation stays only in legacy transport path. |
| `buildHeaderColumns()` | remove provider override; visual build stays component, pure metadata lookup/normalization moves to Utils. |
| `loadRemoteRecords()` | Engine. Component uses one loading entry point. |
| `renderGridDetailData()` | split ownership: component UX facade, Engine remote data load. |
| `buttonEmitted()` | component UX/event facade; provider CRUD orchestration goes to Engine. |
| `startEdit()` | component UX/event facade; no provider component override. |
| `removeRowData()` | component confirmation/event facade; provider delete orchestration goes to Engine. |
| `sortColumn()` | component public/UI facade; Engine owns remote sort state/load; Utils owns pure local comparator. |
| `toolbarValueChanged()` | component input UX; Engine owns provider search state/load. |
| `searchData()` | component filter-input UX; Engine owns provider filter state/load; Utils owns pure parsing/metadata helpers. |
| `onScroll()` | component scroll UX trigger; Engine owns continuation/load-next orchestration. |

Target result: zero provider-specific Angular overrides and, if the migration succeeds as expected, deletion of `ProviderDataGridComponent` in favor of one `DataGridComponent` using `DataGridEngine` plus the existing provider contracts.

## 6. Migration rule

1. Do not rewrite behavior while moving it.
2. Move one ownership group at a time.
3. Preserve existing tests and add characterization tests before each move when coverage is missing.
4. Keep `DataGridComponent` public inputs/outputs/runtime methods compatible.
5. Never introduce Firebase, Firestore, REST, OData, GraphQL or ComeMiVesto assumptions into Engine or Utils.
6. Delete an override only after its behavior is demonstrably provided through the shared architecture.
