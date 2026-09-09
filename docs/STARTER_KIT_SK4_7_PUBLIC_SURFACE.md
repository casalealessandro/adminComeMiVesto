# Starter Kit — SK.4.7 Core import / public-surface normalization

## Baseline

- repository: `casalealessandro/adminComeMiVesto`
- base branch: `develop`
- baseline commit: `a61700ae808366f8833bb1a0e393e05d4193014f`
- latest application state included in the baseline: Affiliate Catalog Programs + Feed CRUD
- SK.4.1–SK.4.6 physical capability moves: completed

## Goal

SK.4.7 closes the source-code extraction sequence defined by SK.3 by making the supported Starter Kit V1 integration surface explicit and mechanically checking the Core dependency direction.

This phase does not redesign runtime behavior. It normalizes how the host application reaches the already extracted Core.

## Canonical public surface

The supported V1 host-facing entry point is now:

```text
src/app/core/public-api.ts
```

The barrel exposes only the public concepts already frozen by SK.3.

### DataGrid

- `DataGridComponent<T>`
- provider/load/page/filter/search/sort contracts
- detail provider contract
- lookup provider contract
- `Colonne`, `ColData`, `detailOptions`, `costantValue` and related configuration models

### Forms

- `DynamicFormComponent`
- `FormBuilderComponent`
- `AppFormListComponent`
- `DynamicFormField` and related metadata types
- `FormDefinitionRepository` / `FORM_DEFINITION_REPOSITORY`
- `FormOptionsProvider` / `FORM_OPTIONS_PROVIDER`

### Layout

- `AnagraficaWrapperComponent`
- navigation contracts/token
- header configuration and user-provider contracts/tokens
- layout-session contract/token

### Popup / Overlay / Dialogs

- `PopUpService`
- `PopupRegistration` / `POPUP_REGISTRY`
- Starter Kit popup registrations, including the historical `entryComponents` compatibility export
- `OverlayService`
- dialog helpers

### UI infrastructure

- `CaptionComponent`
- `ToolbarButton`
- `CustomScrollbarComponent`
- `ScrollInteractionPolicy` / `SCROLL_INTERACTION_POLICY`

## Intentionally not public

The barrel does not promote Core internals such as:

- `DataGridEngine`, `DataGridUtils`, `GridLookupRegistry`, `TdItemComponent`
- individual DynamicForm field renderers and `ElementComponent`
- `ContainerComponent`, `HeaderComponent`, `MenuComponent`, `MenuService`
- popup wrapper/content renderers
- `OverlayComponent`

The host root may import shell renderers directly from their canonical Core paths because they are composition implementation details, not supported host API.

## Host normalization

The application composition boundary now consumes the canonical Core surface instead of historical facade paths:

- `app.config.ts`
- `app.routes.ts` for Form List / FormBuilder route capabilities
- `app-navigation.ts`
- `app-header-config.ts`
- `app-header-user.service.ts`
- `app-layout-session.service.ts`
- `app-popup-components.ts`

`app.component.ts` imports internal shell renderers from their canonical Core paths.

The concrete ComeMiVesto `FormService` remains outside Core and now imports the canonical Forms metadata model directly.

## Compatibility surfaces preserved

SK.4.7 is not a breaking cleanup.

The following SK.3 compatibility commitments remain intact:

- historical DataGrid inputs and `AnagraficaService` fallback
- `ProviderDataGridComponent` alias
- historical `entryComponents` popup export
- `app.interface.ts` compatibility re-exports for generic DataGrid models
- historical re-export shims created during SK.4.1–SK.4.6

New host code should prefer `src/app/core/public-api.ts`; compatibility paths are preserved for existing application code and are not promoted as the recommended integration surface.

## Core dependency boundary gate

A new command is available:

```text
npm run test:core-boundaries
```

`scripts/check-core-boundaries.mjs` recursively inspects TypeScript imports/exports under `src/app/core` and fails when:

- a relative dependency escapes `src/app/core` without being explicitly characterized;
- Core imports Firebase / AngularFire packages;
- Core imports an environment module.

The existing DataGrid physical move still carries a small, explicit V1 compatibility allowlist for historical facade traversals from `DataGridComponent` / `TdItemComponent`. This includes the intentional `AnagraficaService` fallback and the already-existing DataGrid model/dialog/overlay compatibility paths. The allowlist is source-file + import-specifier specific: it cannot silently expand to another Core capability.

This makes the remaining compatibility debt visible while preventing new Core -> Application dependencies.

## CI

A dedicated `Starter Kit Core` workflow runs on public-surface/Core boundary changes and executes:

1. `npm ci`
2. `npm run test:core-boundaries`
3. `npm run test:data-grid`
4. `npm run build -- --configuration development`

The existing `DataGrid Core` workflow path filter is also aligned with the canonical `src/app/core/data-grid/**` location while retaining the historical shim path as a compatibility trigger.

## Non-goals

SK.4.7 does not:

- rename components/services/properties;
- remove compatibility aliases or `app.interface.ts` re-exports;
- remove the DataGrid legacy fallback;
- rewrite DataGrid, Forms, Popup, Layout or UI runtime logic;
- change selectors, templates, styles or responsive behavior;
- change routes or route protection semantics;
- change Firebase, authentication or RBAC;
- change backend APIs;
- change Affiliate Catalog behavior;
- clean generated documentation, zip/history artifacts or unrelated imports;
- start SK.4.8 styles/assets work.

## Exit criteria

SK.4.7 is complete when:

- the Core public surface is explicit and buildable;
- host composition uses the canonical surface for supported integration contracts/capabilities;
- internal shell composition uses canonical Core locations;
- the boundary check is green;
- DataGrid characterization tests are green;
- development build is green;
- no application behavior is intentionally changed.
