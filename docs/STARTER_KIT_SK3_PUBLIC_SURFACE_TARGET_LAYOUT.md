# Starter Kit — SK.3 Public Surface & Target Layout

## Scope

SK.3 freezes the target physical layout and the supported Starter Kit V1 integration surface before any broad file movement.

Baseline:

- repository: `casalealessandro/adminComeMiVesto`;
- branch: `develop`;
- baseline commit: `47911461568117164d64c95d1c3aead34fb88a44`;
- SK.2 Extraction Map: merged;
- Forms, DataGrid, Popup/Dialog/Overlay, Layout/Header/Navigation and UI Infrastructure: logical Core-ready.

This phase is **architecture/documentation only**.

SK.3 does not:

- move production files;
- rename components/services;
- change selectors;
- change routes;
- change authentication/RBAC;
- change API/Firebase behavior;
- change UI/UX or responsive behavior;
- remove compatibility aliases;
- create an Angular library;
- create/publish an npm package;
- create the separate Starter Kit repository yet;
- remove dependencies or assets;
- redesign global styling.

The output of SK.3 is the contract that future physical-move PRs must follow.

---

## 1. V1 packaging decision

The first extracted product should be a **standalone Angular Admin Starter Kit / template repository**, not an npm component library.

Reasoning:

- the reusable value is the complete admin shell plus DataGrid, Forms/FormBuilder, Popup/Dialog/Overlay and UI infrastructure;
- the current capabilities include route-level features such as Form List/FormBuilder, not only isolated widgets;
- host applications need to provide navigation, session/auth state, header user data, form persistence and data providers;
- forcing these capabilities into a library package now would add packaging/build complexity before the physical boundary is proven;
- the current goal is a cloneable/installable/resellable administrative skeleton that can later be decomposed further if useful.

Target sequence:

```text
adminComeMiVesto
   |
   | logical + physical Core extraction
   v
Admin Starter Kit V1 repository/template
   |
   | optional future evolution
   v
independent Angular libraries/packages where justified
```

Therefore SK.3 defines a **supported template integration surface**. It intentionally does not promise npm-semver compatibility yet.

---

## 2. Conservative physical-layout decision

Do **not** move the whole ComeMiVesto application under a new `application/` directory merely to make the repository visually symmetrical.

That would create large import-only diffs in stable business features without improving extraction safety.

The V1 physical strategy is:

1. consolidate only reusable Starter Kit code under `src/app/core/`;
2. leave ComeMiVesto feature pages/services in their existing locations unless a move is required by a Core boundary;
3. keep Angular bootstrap/composition files at the application root;
4. keep host adapters outside `core/`;
5. once the Core is physically contiguous, use that boundary to create the separate Starter Kit repository.

Target shape:

```text
src/app/
|
|-- core/
|   |-- data-grid/
|   |-- forms/
|   |-- layout/
|   |-- popup/
|   |-- overlay/
|   |-- dialogs/
|   `-- ui/
|
|-- views/                  # ComeMiVesto features remain here initially
|-- services/               # ComeMiVesto services/adapters remain here initially
|-- interface/              # remaining application models during migration
|
|-- app.config.ts           # host composition root
|-- app.routes.ts           # host route registration
|-- app-navigation.ts       # host config
|-- app-header-config.ts    # host config
|-- app-popup-components.ts # host config
|-- app-header-user.service.ts
|-- app-layout-session.service.ts
`-- app.component.*
```

This is intentionally less disruptive than moving all Application code at once.

---

## 3. Core target layout

Folder names below are frozen as the preferred V1 extraction destination unless a concrete move-time technical blocker proves otherwise.

### 3.1 DataGrid

```text
src/app/core/data-grid/
|-- data-grid.component.*
|-- data-grid-provider.ts
|-- data-grid-detail-provider.ts
|-- data-grid-lookup-provider.ts
|-- data-grid-filter-model.ts
|-- data-grid-crud-event.ts
|-- data-grid-column.models.ts
|-- data-grid-engine.ts
|-- data-grid-utils.ts
|-- data-grid-lookup-registry.ts
|-- provider-data-grid.component.ts      # compatibility alias
|-- td-item/
|-- *.spec.ts
|-- DATA_GRID_ARCHITECTURE.md
`-- DATA_GRID_PUBLIC_API.md
```

The current DataGrid directory is already capability-oriented. The important additional move is extracting its generic column/configuration models from the mixed `app.interface.ts` file.

### 3.2 Forms

```text
src/app/core/forms/
|-- dynamic-form/
|   |-- dynamic-form.component.*
|   `-- items/
|-- form-builder/
|   |-- form-builder.component.*
|   `-- element/
|-- form-list/
|   `-- app-form-list.component.*
|-- models/
|   `-- dynamic-form-field.ts
|-- contracts/
|   |-- form-definition-repository.ts
|   `-- form-options-provider.ts
`-- tests kept with their capability
```

The concrete ComeMiVesto `FormService` remains outside Core.

### 3.3 Layout

```text
src/app/core/layout/
|-- anagrafica-wrapper/
|-- container/
|-- header/
|-- menu/
`-- contracts/
    |-- navigation-registry.ts
    |-- header-config.ts
    |-- header-user-provider.ts
    `-- layout-session-provider.ts
```

`AnagraficaWrapperComponent` keeps its current name in V1. A cosmetic rename such as `PageShellComponent` is not part of physical extraction.

### 3.4 Popup

```text
src/app/core/popup/
|-- popup.service.ts
|-- popup-registry.ts
|-- modal-popup/
|   |-- modal-popup-wrapper/
|   `-- modal-popup-content/
|-- starter-kit-entry-components.ts
`-- related specs
```

The current historical `entryComponents` export must remain available as a compatibility alias during the move.

### 3.5 Overlay

```text
src/app/core/overlay/
|-- overlay.service.ts
|-- overlay.component.*
`-- related specs
```

Historical zip artifacts are not part of the target Core.

### 3.6 Dialogs

```text
src/app/core/dialogs/
|-- ui-dialogs.ts
`-- ui-dialogs.spec.ts
```

### 3.7 UI infrastructure

```text
src/app/core/ui/
|-- caption/
|   |-- caption.component.*
|   `-- toolbar-button.ts
`-- custom-scrollbar/
    |-- custom-scrollbar.component.*
    `-- scroll-interaction-policy.ts
```

---

## 4. Public surface policy

The Starter Kit must distinguish between:

1. **SUPPORTED PUBLIC SURFACE** — intended for host/application integration;
2. **CORE INTERNAL** — reusable implementation detail that host code should not depend on;
3. **COMPATIBILITY SURFACE** — historical API temporarily retained but not recommended for new code.

Moving a file under `core/` does **not** automatically make it public.

---

## 5. Supported public components — V1

The following components are intended as supported host-facing capabilities.

### DataGrid

- `DataGridComponent<T>`

Its existing `<app-data-grid>` selector remains canonical.

### Forms

- `DynamicFormComponent`;
- `FormBuilderComponent`;
- `AppFormListComponent` as the current form-definition management page.

The FormBuilder/Form List remain route-capable template features rather than low-level library widgets.

### Page/UI infrastructure

- `AnagraficaWrapperComponent`;
- `CaptionComponent`;
- `CustomScrollbarComponent`;
- `ToolbarButton` model/type.

### Popup/dialog utilities

- `PopUpService` using its current class name;
- current dialog helpers from `ui-dialogs.ts` (`alert`, `confirm` and other existing supported helpers);
- `OverlayService` where host code requires programmatic overlay interaction.

No rename is required to make these concepts reusable.

---

## 6. Supported public contracts/tokens — V1

### DataGrid contracts

Public:

- `GridDataProvider<T>`;
- `GridLoadRequest`;
- `GridPage<T>`;
- `GridFilter`;
- `GridFilterOperator`;
- `GridSearch`;
- `GridSort`;
- `GridSortDirection`;
- `GridDetailDataProvider` and its current detail contract types;
- provider-neutral lookup provider contract/types;
- column/configuration models currently represented by `Colonne`, `ColData`, `detailOptions`, `costantValue` and related button/validation configuration required by consumers.

The provider owns transport, authentication, row identity and backend translation. The Core must not introduce Firebase/REST/OData endpoint syntax into the provider contract.

### Forms contracts

Public:

- `DynamicFormField` and the normalized metadata types required to configure fields;
- `FormDefinition`;
- `FormDefinitionRepository`;
- `FORM_DEFINITION_REPOSITORY`;
- `FormOptionsProvider`;
- `FORM_OPTIONS_PROVIDER`.

### Layout contracts

Public:

- `NavigationItem`;
- `NAVIGATION_ITEMS`;
- `HeaderConfig`;
- `HEADER_CONFIG`;
- `HeaderUser`;
- `HeaderUserProvider`;
- `HEADER_USER_PROVIDER`;
- `LayoutSessionProvider`;
- `LAYOUT_SESSION_PROVIDER`.

### Popup/overlay/UI contracts

Public:

- `PopupRegistration`;
- `POPUP_REGISTRY`;
- `ScrollInteractionPolicy`;
- `SCROLL_INTERACTION_POLICY`;
- `ToolbarButton`.

These contracts are the preferred integration seam for future host projects.

---

## 7. Core internal implementation — V1

The following are Core code but are **not** intended as host-facing API.

### DataGrid internal

- `DataGridEngine`;
- `DataGridUtils`;
- `GridLookupRegistry` implementation;
- `TdItemComponent`;
- internal filter/runtime helpers;
- placeholder/loading mechanics;
- cell-level rendering implementation.

Consumers should use `DataGridComponent` plus provider/config contracts rather than instantiate these directly.

### Forms internal

- individual dynamic field renderer components (`DynamicSelectBoxComponent`, `DynamicRadioBoxComponent`, file field implementation, etc.);
- `ElementComponent` property editor;
- metadata normalization helpers unless a concrete host use case requires public access.

### Layout shell internal

- `ContainerComponent`;
- `HeaderComponent`;
- `MenuComponent`;
- `MenuService`.

A host configures them through tokens; it should not depend on their internal state or instantiate them directly.

### Popup/overlay internal

- popup wrapper/content components;
- `OverlayComponent` root renderer;
- popup stack/focus/Escape implementation;
- registry lookup implementation details.

These remain implementation pieces of the template shell.

---

## 8. Compatibility surface — preserve, do not promote

Physical extraction must not break established compatibility APIs, but new integrations should not be encouraged to adopt them.

### DataGrid compatibility

Retain during V1 migration:

- `ProviderDataGridComponent` alias;
- historical `service`/`api`/`queryString` inputs and legacy fallback behavior;
- current `AnagraficaService` fallback path while existing application consumers still require it;
- existing historical method/input spellings where currently characterized by tests.

Preferred new integration:

```text
DataGridComponent -> GridDataProvider
```

not:

```text
DataGridComponent -> endpoint-building service/api inputs
```

### Popup compatibility

Retain historical `entryComponents` export while canonical Core registration moves to the new popup location.

### Model compatibility

When DataGrid generic models leave `app.interface.ts`, temporarily re-export their existing names from `app.interface.ts` so Application consumers are not forced into one large import rewrite.

Canonical imports can then migrate incrementally.

### Naming compatibility

Do not rename historical public identifiers solely for aesthetics during extraction.

Examples include current class names and known historical spelling surfaces already documented by previous phases.

---

## 9. `app.interface.ts` split strategy

Current problem:

```text
src/app/interface/app.interface.ts
```

contains both reusable DataGrid/UI configuration and ComeMiVesto domain models.

Target:

```text
src/app/core/data-grid/data-grid-column.models.ts
    -> Colonne
    -> ColData
    -> detailOptions
    -> costantValue
    -> button / validation-related column config

src/app/interface/app.interface.ts
    -> Utente
    -> UserProfile
    -> compatibility re-exports while migration is active
```

Rules:

1. preserve type names/shapes in the first physical split;
2. do not “clean up” `any` types at the same time;
3. do not rename properties;
4. keep temporary re-exports for compatibility;
5. update Core DataGrid imports to the new canonical model location first;
6. migrate application imports gradually in later PRs if useful;
7. remove compatibility re-exports only in a separately approved breaking-cleanup phase.

This turns the largest mixed physical boundary into a safe, incremental migration.

---

## 10. Routing policy

Routing remains host-owned.

Current Forms capability routes:

```text
/form-list
/form-builder/:id
```

remain supported in Starter Kit V1 because current FormBuilder/Form List navigation semantics rely on them.

However:

- `app.routes.ts` remains a host composition file;
- auth guards remain host/application concerns;
- the Core does not own ComeMiVesto route protection;
- SK.3 does not introduce a route-provider abstraction;
- physical moves must preserve existing route paths and navigation behavior.

A later Starter Kit repository can ship documented/default route entries without coupling the Core to a specific auth implementation.

---

## 11. Composition-root policy

Keep the current Angular root files in their conventional locations.

```text
src/app/app.config.ts
src/app/app.routes.ts
src/app/app.component.*
```

They are not moved into `core/`.

`app.config.ts` remains the host composition root responsible for bindings such as:

```text
NAVIGATION_ITEMS            <- host navigation config
HEADER_CONFIG               <- host header config
HEADER_USER_PROVIDER        <- host adapter
LAYOUT_SESSION_PROVIDER     <- host adapter
FORM_DEFINITION_REPOSITORY  <- host Forms adapter
FORM_OPTIONS_PROVIDER       <- host Forms adapter
POPUP_REGISTRY              <- Core + host popup registrations
SCROLL_INTERACTION_POLICY   <- host/core wiring
```

This is the intended dependency direction:

```text
Host composition
      |
      +--> host adapters/configuration
      |
      `--> Core contracts/components
```

Core never imports the host composition root.

---

## 12. Host adapters policy

Current host-specific adapter/services remain outside Core:

- `ComeMiVestoHeaderUserService`;
- `ComeMiVestoLayoutSessionService`;
- `FormService`;
- `AnagraficaService` legacy compatibility adapter.

SK.3 does not require physically moving or renaming these files before Core extraction.

Reason: the extraction boundary is already clear because the rule is simply **do not copy them into the neutral Core**.

A future Starter Kit repository will provide neutral examples/demo adapters instead of ComeMiVesto implementations.

---

## 13. Styles target

Global styles currently combine:

- Bootstrap import;
- Core structural layout/dialog rules;
- reusable utility rules;
- CSS custom properties/theme values;
- host-wide body/font defaults.

Target concept:

```text
src/styles.scss                     # host entry point
src/styles/admin-core.scss          # structural rules required by Core
src/styles/admin-theme-default.scss # default template theme/tokens
```

Rules:

- component-scoped SCSS stays with components;
- structural rules required for Core behavior move to `admin-core.scss`;
- default colors/fonts/theme values can live in the default theme;
- ComeMiVesto branding must not become mandatory Core styling;
- `src/styles.scss` imports the Core structural stylesheet plus default/host theme as appropriate;
- no visual redesign is performed during the split;
- do not freeze every current CSS variable as a permanent public semantic API in SK.3.

The new Starter Kit repository should be visually usable by default but host-themeable.

---

## 14. Assets and branding target

Core must not require ComeMiVesto branding.

Rules:

- logo URLs remain supplied through `HEADER_CONFIG`;
- ComeMiVesto logo/assets remain host assets;
- icons/fonts needed by generic UI are evaluated as Starter Kit/default-theme dependencies;
- generated/history zip artifacts are excluded from the future Starter Kit repository;
- no font or asset cleanup is mixed into source-code move PRs.

---

## 15. Dependency ownership

Current `package.json` remains application-wide during physical moves.

Core architectural rule:

**forbidden Core dependencies:**

- Firebase/AngularFire;
- ComeMiVesto environment values;
- concrete backend endpoint paths;
- ComeMiVesto domain services/models.

Allowed Core framework/UI dependencies are those actually required by current Core behavior, such as Angular framework packages, RxJS and the currently used UI dependencies.

SK.3 does not remove packages pre-emptively.

After the physical Core is contiguous, dependency ownership should be measured from actual imports before creating the neutral repository.

---

## 16. Future supported import surface

The separate Starter Kit repository should eventually expose one documented Core entry surface rather than encourage arbitrary deep imports.

Conceptually:

```text
core public surface
|
|-- components/capabilities
|-- contracts/tokens
|-- configuration models
`-- supported utility services
```

A future `core/public-api.ts` (or equivalent barrel) is acceptable **after** physical moves stabilize.

Rules:

- Core implementation files must not import back through the public barrel;
- host/application code may use the barrel once introduced;
- do not create path aliases/barrels during early move PRs if they complicate circular-dependency diagnosis;
- a barrel does not turn internal classes into public API.

---

## 17. Application-owned reusable candidates

The SK.2 candidates remain outside Starter Kit V1 unless a concrete requirement appears:

- `DashboardStatCardComponent`;
- `TimestampToDatePipe`.

They are technically reusable but are not required to make the Starter Kit complete.

This keeps the first Core intentionally small and capability-driven.

Affiliate Catalog, Users, Outfits, Reports, Dashboard and other ComeMiVesto features remain Application code even when they consume Core components.

---

## 18. Ordered physical-move plan

Physical extraction starts only after SK.3 is accepted/merged.

Each slice must branch from the latest `develop`, contain only one architectural concern and preserve runtime behavior.

### SK.4.1 — UI Infrastructure move

Move:

- Caption/Toolbar;
- CustomScrollbar;
- ScrollInteractionPolicy.

Why first:

- small dependency surface;
- already Core-ready;
- useful foundation for layout/page components.

Acceptance:

- build succeeds;
- focused UI tests succeed;
- no visual/behavior changes;
- application imports updated only as required by move.

### SK.4.2 — Popup / Dialog / Overlay move

Move generic popup runtime, registry, modal shell, dialogs and overlay runtime.

Keep Forms-specific `starterKitEntryComponents` handling compatibility-aware if its move would otherwise couple this slice to Forms.

Acceptance:

- popup/dialog/overlay focused specs remain green;
- focus/Escape/multiple-popup behavior unchanged;
- no ComeMiVesto popup component enters Core.

### SK.4.3 — Layout / Header / Navigation move

Move:

- AnagraficaWrapper;
- Container/Header/Menu;
- MenuService;
- Navigation/Header/Session contracts.

Acceptance:

- responsive tests remain green;
- host provider bindings remain in `app.config.ts`;
- no `AuthService`, `UserService` or Firebase import enters Core.

### SK.4.4 — Forms move

Move:

- DynamicForm and field items;
- FormBuilder/property editor;
- Form List;
- DynamicFormField models;
- Forms contracts.

Acceptance:

- current field semantics and normalization preserved;
- current route behavior preserved;
- FormService stays outside Core;
- Forms focused/integration specs remain green.

### SK.4.5 — DataGrid model split

Before moving the large DataGrid runtime:

- create canonical DataGrid column/configuration models under Core;
- preserve exact model shapes;
- leave compatibility re-exports in `app.interface.ts`;
- update only the minimal imports required.

Acceptance:

- build succeeds;
- DataGrid tests remain green;
- Users and other application views still compile unchanged behaviorally.

### SK.4.6 — DataGrid runtime move

Move the stabilized DataGrid directory under `core/data-grid`.

Acceptance:

- `npm run test:data-grid` green;
- legacy and provider-neutral paths both preserved;
- `AnagraficaService` remains outside Core;
- compatibility alias remains available;
- no backend-specific syntax is introduced into provider-neutral files.

### SK.4.7 — Core import/public-surface normalization

After all capability moves:

- verify Core-to-Application dependency direction;
- introduce a documented Core public barrel only if it reduces host deep imports safely;
- characterize forbidden imports from Core;
- avoid unrelated naming cleanup.

### SK.4.8 — Styles/assets boundary

Only after component moves stabilize:

- split structural Core global styles from default/host theme;
- classify required generic assets/icons;
- keep ComeMiVesto branding outside Core.

### SK.5 — Neutral Starter Kit repository

Once `src/app/core` is physically contiguous and build/test qualified:

- create the new repository/template;
- copy the Core and minimal Angular shell;
- provide neutral demo configuration/adapters;
- exclude ComeMiVesto Firebase/API/domain code;
- add README/setup/configuration documentation;
- add standalone CI;
- validate fresh clone -> install -> build -> test -> serve.

---

## 19. Rules for every SK.4 physical PR

Every physical extraction PR must satisfy all of the following:

1. branch from latest `develop`;
2. one capability/boundary per PR;
3. move/import changes only unless a concrete compile blocker demands a minimal fix;
4. no UX redesign;
5. no backend/API changes;
6. no auth/RBAC changes;
7. no opportunistic type cleanup;
8. no compatibility removal;
9. preserve mobile-first behavior;
10. run the relevant focused tests plus Angular build;
11. document any CI failure that is infrastructure-only (for example Firebase preview quota) separately from application build/test status;
12. do not mix repository hygiene/generated-file cleanup into extraction PRs.

---

## 20. What is explicitly not part of Starter Kit V1

Unless separately approved, V1 does not include:

- ComeMiVesto Dashboard data/business logic;
- Users management/business workflows;
- Outfits/domain logic;
- Affiliate Catalog;
- Reports;
- colors/taxonomy domain features;
- Firebase authentication implementation;
- ComeMiVesto RBAC rules;
- auth guard/interceptor implementation;
- ComeMiVesto API endpoint services;
- Tradedoubler/feed provider integrations;
- generated documentation/build artifacts;
- a major Angular version migration;
- a rewrite of DataGrid or FormBuilder;
- drag/drop/new form field types/preview features previously deferred.

---

## 21. SK.3 exit criteria

SK.3 is complete when the team accepts that:

- V1 is a template repository first, not an npm library;
- only reusable Core code will be physically consolidated under `src/app/core`;
- ComeMiVesto application features will not be mass-moved for cosmetic layering;
- host composition stays at Angular application root;
- public contracts/components are explicitly identified;
- internal implementation classes are explicitly not public;
- compatibility APIs will survive physical extraction;
- `app.interface.ts` has an incremental compatibility-safe split plan;
- style/assets ownership has a target;
- the SK.4 move sequence is approved.

---

## 22. SK.3 verdict

**READY FOR INCREMENTAL PHYSICAL CORE EXTRACTION.**

No further architecture-first boundary abstraction is required before the first move slice.

Recommended next step after merge:

```text
SK.4.1 — UI Infrastructure move
```

Start with Caption/Toolbar + CustomScrollbar/ScrollInteractionPolicy because this is the smallest stable Core slice and gives the future `src/app/core` namespace a low-risk first inhabitant.