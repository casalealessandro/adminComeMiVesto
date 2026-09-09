# Clean Admin Core reconciliation — R.1 DataGrid contracts and pure helpers

## Scope

R.1 selectively restores the provider-neutral and stateless DataGrid foundation that existed on `refactor/clean-admin-core`, on top of the current post-Phase-F `develop` line.

This slice intentionally does **not** wire the restored contracts into `DataGridComponent` yet.

## Restored contracts

- `data-grid-provider.ts`
  - `GridDataProvider<T>`
  - normalized paging/search/filter/sort request and page contracts
  - opaque continuation state
  - optional create/update/delete operations without assuming a row id or backend protocol
- `data-grid-detail-provider.ts`
  - provider-neutral parent/detail loading contract
- `data-grid-lookup-provider.ts`
  - provider-neutral cell lookup loading contract
- `data-grid-crud-event.ts`
  - typed CRUD operations while preserving historical event names and aliases

## Restored pure behavior

- `data-grid-filter-model.ts`
  - semantic operators (`contains`, `eq`, `sameDay`, etc.)
  - typed global search conditions
  - typed explicit column filters
  - historical date input normalization
- `data-grid-utils.ts`
  - local sort comparison
  - local search/filter helpers
  - historical date formatting
  - summary calculation
  - provider column metadata projection
  - provider query-state cloning
  - placeholder/mock row creation

## Regression coverage

R.1 restores focused tests for:

- CRUD event contract compatibility;
- search/filter operator and value normalization;
- stateless local utility behavior and immutable query-state cloning.

The current standard PR workflow still performs the application build but does not run `ng test`. The historical dedicated DataGrid workflow from `refactor/clean-admin-core` is intentionally not restored in this slice; CI/test execution strategy is a separate reconciliation decision.

## Explicit non-goals

R.1 does not:

- modify `DataGridComponent` runtime behavior;
- add `DataGridEngine`;
- add or wire `GridLookupRegistry`;
- modify `TdItemComponent`;
- change DataGrid templates or CSS;
- migrate consumers to provider mode;
- remove `AnagraficaService` fallback behavior;
- import old ComeMiVesto route/service/view changes;
- restore the historical DataGrid-specific workflow yet.

## Next slice — R.2

Characterize the current `develop` DataGrid runtime against the restored contracts and the clean-branch `DataGridEngine` behavior. Restore the engine and its tests only after proving it can remain independent from Angular rendering and backend-specific services. Runtime delegation from `DataGridComponent` should follow in a later, separately reviewable slice.
