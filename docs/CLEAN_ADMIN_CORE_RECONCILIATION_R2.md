# Clean Admin Core reconciliation — R.2 DataGridEngine

## Scope

R.2 restores the provider-neutral `DataGridEngine` from `refactor/clean-admin-core` onto the current `develop` line after R.1 restored the supporting contracts and pure helpers.

This slice remains deliberately isolated from Angular runtime wiring.

## Restored

- `DataGridEngine<T>`;
- provider query state for sort, global search and explicit filters;
- snapshot/set/restore operations for rollback-friendly state;
- provider-neutral load-request construction;
- initial and continuation page delegation;
- opaque continuation state;
- known/unknown total-count state;
- provider CRUD orchestration with authoritative reload callback;
- provider-neutral detail loading;
- focused engine characterization tests.

## Dependency check

The reconciled engine depends only on:

- `data-grid-provider.ts`;
- `data-grid-detail-provider.ts`;
- `data-grid-utils.ts`.

It does not import Angular, DOM APIs, `AnagraficaService`, Firebase, REST/OData/GraphQL syntax, application routes, views or ComeMiVesto domain models.

## Runtime boundary

R.2 does **not** modify:

- `data-grid.component.ts`;
- `data-grid.component.html`;
- `data-grid.component.scss`;
- `TdItemComponent`;
- application services;
- ComeMiVesto views.

Therefore the active application DataGrid runtime is unchanged by this PR.

## Characterized behavior

The R.2 tests protect:

1. isolated engine state per instance;
2. snapshot/set/restore query semantics;
3. provider-neutral request construction;
4. initial and continuation loading with opaque continuation state;
5. conservative total-count fallback behavior;
6. mutation -> reload ordering and no reload after failed mutation;
7. exact parent-row delegation for remote details.

## Deliberately deferred

The following clean-branch work is not part of R.2:

- wiring `DataGridEngine` into `DataGridComponent`;
- provider-specific runtime inputs/facades on the Angular component;
- `GridLookupRegistry` and TdItem integration;
- provider paging UX / mock-row scroll integration;
- DataGrid dedicated CI workflow;
- any application-specific changes.

## Next slice

R.3 should characterize the current `DataGridComponent` public/runtime paths against the restored Engine and identify the smallest safe delegation seam. The first runtime integration must preserve the historical non-provider fallback and must not rewrite working DataGrid algorithms.
