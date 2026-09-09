# Starter Kit — DataGrid Closure Audit

Baseline: `develop@8c6cc7f8cae38ead32ec573a60efdecc00223a33`

Status: **logical Starter Kit/Core-ready**.

This document closes the DataGrid audit for the Starter Kit direction. It does not introduce new architecture and does not request any DataGrid refactor. The existing provider-neutral migration is treated as the authoritative implementation.

## 1. Existing work already completed

The DataGrid area already has the architecture that the Starter Kit needs:

- one runtime Angular component: `DataGridComponent<T>` / `<app-data-grid>`;
- provider-neutral orchestration in `DataGridEngine<T>`;
- provider-neutral transport contract `GridDataProvider<T>`;
- provider-neutral detail contract `GridDetailDataProvider<T, TDetail>`;
- provider-neutral lookup contracts and `GridLookupRegistry`;
- typed search/filter/sort request models;
- typed CRUD event builders;
- pure helpers in `DataGridUtils`;
- local and provider-backed paths preserved through the same public component;
- provider-specific Angular subclass removed;
- dedicated DataGrid characterization/spec suite and `npm run test:data-grid` script.

The existing `DATA_GRID_ARCHITECTURE.md` already declares the provider-neutral core migration complete and remains the primary architecture reference.

## 2. Core ownership

The following are classified as Starter Kit/Core capability:

```text
DataGridComponent<T>
        |
        v
DataGridEngine<T>
        |
        v
GridDataProvider<T>

DataGridUtils
GridDetailDataProvider
GridLookupRegistry / lookup contracts
filter/search/sort models
CRUD event contracts/builders
TdItemComponent visual renderer
```

The provider contract owns no endpoint, authentication, Firebase, REST, OData, GraphQL or database assumption.

The engine owns provider-neutral state/orchestration and has no backend-specific dependency.

## 3. Legacy compatibility fallback

`DataGridComponent` and `TdItemComponent` still directly reference `AnagraficaService` for the historical `api` / `queryString` and lookup behavior.

This is **existing compatibility behavior**, not the new Core transport architecture.

`AnagraficaService` is concrete application/legacy infrastructure because it knows:

- `environment.BASE_API_URL`;
- `HttpClient`;
- endpoint/path construction;
- legacy insert/update/delete transport semantics.

The fallback must not be removed or redesigned as part of this closure.

For current AdminComeMiVesto runtime compatibility the rule remains:

```text
Preferred reusable path
DataGrid -> GridDataProvider -> host/provider implementation

Historical compatibility path
DataGrid -> AnagraficaService -> BASE_API_URL
```

The existence of the fallback does not invalidate the provider-neutral Core already implemented.

## 4. ProviderDataGrid compatibility alias

`provider-data-grid.component.ts` is only:

```ts
export { DataGridComponent as ProviderDataGridComponent } from './data-grid.component';
```

It is not an Angular component, owns no runtime logic and exists only for source compatibility with historical tests/imports.

Deleting or renaming it is optional cleanup and is explicitly not required for Starter Kit closure.

## 5. Public integration surface

The reusable integration path is the existing `DataGridComponent<T>` public API documented in `DATA_GRID_PUBLIC_API.md`.

The main host-facing boundary is:

```ts
@Input() dataProvider?: GridDataProvider<T>;
@Input() detailDataProvider?: GridDetailDataProvider<T, any>;
@Input() lookupProviders;
```

The provider receives normalized requests with:

- page size;
- opaque continuation state;
- global search conditions;
- explicit filters;
- sort instructions.

Row identity and backend translation remain provider-owned.

## 6. `app.interface.ts` classification

`DataGridComponent` still imports `Colonne`, `ColData`, `detailOptions` and `ToolbarButton` through `src/app/interface/app.interface.ts`.

That file currently also contains ComeMiVesto domain interfaces such as `Utente` and `UserProfile`.

This is a **physical organization smell**, not a DataGrid runtime coupling: the grid consumes generic grid contracts, not the ComeMiVesto domain interfaces.

When the project reaches the physical Core/Application separation phase, generic grid contracts should live with the reusable Core while ComeMiVesto domain models stay in the Application area.

No split is required in this closure because doing it now would be file-organization refactoring without runtime benefit.

## 7. UI infrastructure dependencies

The grid legitimately depends on generic UI infrastructure already developed in the Starter Kit direction, including:

- `CustomScrollbarComponent`;
- `OverlayService`;
- generic dialogs;
- `TdItemComponent`;
- Angular DOM/lifecycle primitives.

These are Core/UI dependencies rather than ComeMiVesto domain dependencies.

## 8. Tests and safety net

The repository already exposes:

```text
npm run test:data-grid
```

which targets:

```text
src/app/components/data-grid/**/*.spec.ts
```

through `tsconfig.data-grid.spec.json`.

The existing architecture documentation also records characterization coverage for provider loading, paging, search/filter/sort rollback, CRUD orchestration, details, lookups and historical compatibility behavior.

This closure adds no code, therefore it does not alter that safety net.

## 9. What must NOT be done now

Do not use this closure as justification to:

- rewrite `DataGridComponent`;
- remove the legacy `service` / `api` / `queryString` inputs;
- remove `AnagraficaService` fallback behavior;
- redesign lookup configuration;
- create another grid component;
- reintroduce a provider-specific subclass;
- rename public events or inputs;
- change paging/search/filter/sort behavior;
- change CRUD payload/event behavior;
- change mobile/responsive behavior;
- move files merely to obtain a `core/` folder;
- split `app.interface.ts` before the physical separation phase;
- delete the `ProviderDataGridComponent` alias merely for cleanup.

## 10. Closure decision

DataGrid is considered **Starter Kit/Core-ready at the logical architecture level**.

The provider-neutral boundary is already implemented and documented. The remaining concrete `AnagraficaService` references are intentional historical compatibility paths and are not blockers for continued Starter Kit analysis.

Any future work on those references should happen only when physical extraction requires the Core to compile independently from application adapters. That belongs to the later physical Core/Application separation phase, not to a new DataGrid refactor phase.

## 11. Final status

```text
DataGrid architecture / provider-neutral core     CLOSED
DataGrid public API                               CLOSED
Provider/detail/lookup contracts                  CLOSED
Engine / Utils ownership                          CLOSED
Single runtime DataGrid component                 CLOSED
Legacy Anagrafica fallback                        PRESERVED COMPATIBILITY
ProviderDataGrid alias                            OPTIONAL CLEANUP ONLY
Generic/domain models in app.interface.ts         DEFER TO PHYSICAL SEPARATION
New DataGrid features                             OUT OF SCOPE
```

**No additional DataGrid code change is required before moving to the next Starter Kit area.**
