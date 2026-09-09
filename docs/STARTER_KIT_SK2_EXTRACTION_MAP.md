# Starter Kit — SK.2 Extraction Map

## Scope

SK.2 defines the extraction map for the current `adminComeMiVesto` repository after the logical Core stabilization work.

Baseline:

- repository: `casalealessandro/adminComeMiVesto`;
- branch: `develop`;
- baseline commit: `db35df6fdcc1bbd8b5287a62b1043e1373a78bb9`;
- Forms, DataGrid, Popup/Dialog/Overlay, Layout/Header/Navigation and UI Infrastructure are already considered logical Core-ready.

This phase is **analysis and classification only**.

SK.2 does not:

- move source files;
- rename services/components;
- change imports;
- change routes;
- change authentication/RBAC;
- change API/Firebase behavior;
- change UI/UX or responsive behavior;
- create an Angular library;
- create the new Starter Kit repository;
- remove legacy compatibility surfaces;
- remove generated artifacts from Git history.

The goal is to identify the physical extraction boundary before any move is attempted.

---

## 1. Target dependency rule

The target architecture remains:

```text
ComeMiVesto Application
(domain pages / domain services / Firebase / API / auth / RBAC)
                  |
                  | configures / implements / consumes
                  v
Admin Core / Starter Kit
(DataGrid / Forms / Popup / Overlay / Layout / UI Infrastructure)
```

The dependency direction must be:

```text
Application -> Core
```

Core must not depend on ComeMiVesto domain concepts, Firebase configuration, concrete API endpoints or application-only services.

A third layer is required for composition:

```text
Core contracts <----- Host adapters/configuration
                         |
                         v
                    ComeMiVesto services
```

For SK.2 the three classifications are therefore:

1. **CORE** — reusable Starter Kit implementation/contracts;
2. **APPLICATION** — ComeMiVesto domain and infrastructure;
3. **COMPOSITION / ADAPTER** — host wiring that connects Application implementations to Core contracts.

A fourth label, **CANDIDATE**, is used only where code is technically reusable but is not required by the Starter Kit V1.

---

## 2. Current repository: physical structure versus logical ownership

The current physical folders do not represent the architectural boundary.

Examples:

- `src/app/views/form-builder/**` is logically **Core** even though it lives under `views`;
- `src/app/views/app-views/app-form-list.*` is logically **Core Forms**;
- `src/app/services/form.service.ts` is not Core: it is the current ComeMiVesto HTTP adapter behind the Forms contracts;
- `src/app/services/anagrafica.service.ts` is the legacy REST compatibility adapter used by the DataGrid fallback path, not provider-neutral Core;
- `src/app/interface/app.interface.ts` physically mixes Core DataGrid definitions with ComeMiVesto user/domain types;
- `src/app/views/affiliate-catalog/**` is Application code even though it consumes reusable `AnagraficaWrapperComponent` Core infrastructure.

Therefore extraction must be responsibility-driven, not folder-driven.

---

## 3. CORE — Starter Kit V1

### 3.1 DataGrid

Current source area:

```text
src/app/components/data-grid/**
```

Starter Kit ownership includes the existing stabilized runtime and contracts:

- `DataGridComponent`;
- `DataGridEngine`;
- `GridDataProvider` and paging/sort/search contracts;
- detail provider contract;
- lookup provider and registry;
- typed filter model;
- CRUD event contracts;
- `DataGridUtils`;
- `TdItemComponent`;
- focused DataGrid tests;
- DataGrid architecture/public API documentation;
- current `ProviderDataGridComponent` compatibility alias where still required.

Intentional compatibility exception:

- the historical `AnagraficaService` fallback remains outside the provider-neutral Core and is classified as adapter/legacy compatibility.

No additional DataGrid refactor is required by SK.2.

### 3.2 Forms

Starter Kit ownership includes:

```text
src/app/components/dynamic-form/**
src/app/views/form-builder/**
src/app/views/app-views/app-form-list.*
src/app/interface/dynamic-form-field.ts
src/app/interface/dynamic-form-field.spec.ts
src/app/services/form-definition-repository.ts
src/app/services/form-options-provider.ts
```

This covers:

- dynamic form runtime;
- field components;
- FormBuilder and property editor;
- form-definition list/management capability;
- metadata normalization/legacy compatibility;
- `FORM_DEFINITION_REPOSITORY`;
- `FORM_OPTIONS_PROVIDER`;
- current Forms tests/integration characterization.

The `/form-list` and `/form-builder/:id` navigation semantics belong to the Forms capability in the current V1. Host routing still decides whether/how those routes are registered and protected.

Not Core:

- concrete HTTP implementation `FormService`;
- ComeMiVesto `/gen/forms` and `/gen/{api}` endpoints.

### 3.3 Popup / Dialog / Overlay

Starter Kit ownership includes:

```text
src/app/components/modal-popup/**
src/app/components/overlay-component/**
src/app/widgets/ui-dialogs.ts
src/app/widgets/ui-dialogs.spec.ts
src/app/services/popup-registry.ts
src/app/services/popup.service.ts
src/app/services/popup.service.spec.ts
src/app/services/overlay.service.ts
src/app/services/overlay.service.spec.ts
src/app/services/entryComponents.ts
```

`starterKitEntryComponents` remains Core configuration because it registers Core-owned popup-capable components such as DynamicForm and the FormBuilder property editor.

ComeMiVesto popup registrations remain outside this layer.

### 3.4 Layout / Navigation / Header

Starter Kit ownership includes:

```text
src/app/layout/anagrafica-wrapper/**
src/app/layout/container/**
src/app/layout/header/**
src/app/layout/menu/**
src/app/services/menu.service.ts
src/app/services/menu.service.spec.ts
src/app/services/navigation-registry.ts
src/app/services/header-config.ts
src/app/services/header-user-provider.ts
src/app/services/layout-session-provider.ts
```

The Core layout obtains host data through:

- `NAVIGATION_ITEMS`;
- `HEADER_CONFIG`;
- `HEADER_USER_PROVIDER`;
- `LAYOUT_SESSION_PROVIDER`.

`ContainerComponent` no longer imports the concrete ComeMiVesto `AuthService`.

### 3.5 UI / Page Infrastructure

Starter Kit ownership includes:

```text
src/app/components/caption/**
src/app/components/custom-scrollbar/**
```

including:

- `ToolbarButton`;
- page toolbar/caption behavior;
- `CustomScrollbarComponent`;
- `SCROLL_INTERACTION_POLICY`.

Historical compatibility names and deprecated surfaces remain unchanged during extraction planning.

---

## 4. APPLICATION — ComeMiVesto

### 4.1 Domain pages

The following current views remain ComeMiVesto Application code:

```text
src/app/views/dashboard/**
src/app/views/users/**
src/app/views/outfits/**
src/app/views/outfit-category/**
src/app/views/outfit-products/**
src/app/views/affiliate-catalog/**
src/app/views/colors/**
src/app/views/reports/**
src/app/views/login/**
src/app/views/access-denied/**
```

Reasons include concrete domain vocabulary, ComeMiVesto APIs, RBAC/auth behavior and domain routes.

The Affiliate Catalog introduced on the current baseline belongs entirely to Application ownership. Its workspace, typed affiliate models and HTTP service represent ComeMiVesto business functionality; the page consumes `AnagraficaWrapperComponent` rather than introducing a Core dependency on affiliate concepts.

Examples of the desired dependency direction already exist:

```text
UsersComponent
  -> DataGridComponent
  -> DynamicFormComponent
  -> ui-dialogs
  -> UserService / AuthService

AffiliateCatalogComponent
  -> AnagraficaWrapperComponent
  -> affiliate catalog models/service
```

The feature pages consume reusable Core primitives; the Core primitives do not depend on Users, Outfits or Affiliate Catalog.

### 4.2 Domain/application services

The following services remain Application or application infrastructure:

```text
src/app/services/auth.service.ts
src/app/services/user.service.ts
src/app/services/outfit.service.ts
src/app/services/report.service.ts
src/app/services/dashboard.service.ts
src/app/services/taxonomy.service.ts
src/app/services/prodotti-online.service.ts
src/app/views/affiliate-catalog/services/**
```

Their associated feature-specific tests remain with the Application layer.

### 4.3 Domain models

The following types currently located in `src/app/interface/app.interface.ts` are ComeMiVesto Application models:

- `Utente`;
- `UserProfile`.

Affiliate Catalog models under `src/app/views/affiliate-catalog/models/**` are also Application/domain types.

They must not be exported by the future Starter Kit public surface.

### 4.4 Authentication and API infrastructure

The following remain application-owned:

```text
src/app/auth.guard.ts
src/app/auth.guard.spec.ts
src/app/auth.interceptor.ts
src/app/auth.interceptor.spec.ts
src/environments/**
```

Current auth behavior includes Firebase/AngularFire, role/RBAC refresh, ID tokens and ComeMiVesto backend endpoint knowledge. None of that is a requirement of the reusable Core.

---

## 5. COMPOSITION / ADAPTER layer

The current application already has a real composition root in `app.config.ts`.

### 5.1 Host configuration

Classify as host/composition configuration:

```text
src/app/app-navigation.ts
src/app/app-header-config.ts
src/app/app-popup-components.ts
src/app/app.config.ts
src/app/app.routes.ts
```

These files decide which application choices are supplied to reusable Core contracts and which Application routes appear in the admin shell. The current `affiliate-catalog` navigation/route entry is therefore host composition, while the feature implementation remains Application.

Examples:

```text
NAVIGATION_ITEMS            <- comeMiVestoNavigation
HEADER_CONFIG               <- comeMiVestoHeaderConfig
HEADER_USER_PROVIDER        <- ComeMiVestoHeaderUserService
LAYOUT_SESSION_PROVIDER     <- ComeMiVestoLayoutSessionService
FORM_DEFINITION_REPOSITORY  <- FormService
FORM_OPTIONS_PROVIDER       <- FormService
POPUP_REGISTRY              <- Starter Kit + ComeMiVesto registrations
SCROLL_INTERACTION_POLICY   <- OverlayService binding
```

### 5.2 ComeMiVesto adapters behind Core contracts

Classify as adapter/application boundary:

```text
src/app/app-header-user.service.ts
src/app/app-header-user.service.spec.ts
src/app/app-layout-session.service.ts
src/app/services/form.service.ts
src/app/services/form.service.spec.ts
src/app/services/anagrafica.service.ts
```

Notes:

- `ComeMiVestoHeaderUserService` adapts Auth/User data to `HeaderUserProvider`;
- `ComeMiVestoLayoutSessionService` adapts current auth state to `LayoutSessionProvider`;
- `FormService` adapts current ComeMiVesto HTTP APIs to the reusable Forms contracts;
- `AnagraficaService` is retained as the current legacy REST compatibility path for DataGrid consumers, not as part of provider-neutral DataGrid Core.

### 5.3 Bootstrap shell

Current bootstrap files:

```text
src/main.ts
src/app/app.component.ts
src/app/app.component.html
src/app/app.component.sass
src/app/app.component.spec.ts
```

are best treated as host/bootstrap composition in the current repository.

The future Starter Kit template may provide an equivalent starter shell, but these current files are not automatically a library public API.

---

## 6. Mixed physical boundaries that must be addressed before extraction

### SK2-PHYS-01 — `app.interface.ts` mixes Core and Application

`src/app/interface/app.interface.ts` currently contains both:

Core-oriented DataGrid/UI definitions such as:

- `detailOptions`;
- `costantValue`;
- `Colonne`;
- `ColData`;
- button/validation/dynamic column definitions;

and ComeMiVesto domain types:

- `Utente`;
- `UserProfile`.

This is the clearest physical extraction blocker.

Future action: separate definitions by ownership while preserving their existing shapes and imports through a conservative migration. This is not done in SK.2.

### SK2-PHYS-02 — global `styles.scss` mixes structural Core styling and host theme

`src/styles.scss` currently contains:

- Bootstrap import;
- generic layout variables;
- reusable loader/button/nav/dialog styles;
- global `.mi-container` shell rules;
- font/body defaults;
- theme/color choices.

Some rules are required by reusable components, while others are host-wide theme defaults.

Future action: identify structural Core styles versus Starter Kit default theme/host overrides. Do not redesign values during the move.

### SK2-PHYS-03 — Core and Application services share one folder

`src/app/services` contains reusable contracts/services next to Firebase/API/domain services.

This is physically inconvenient but no longer a logical coupling problem.

### SK2-PHYS-04 — Core feature pages live under `views`

FormBuilder and Form List are Starter Kit capabilities but are physically adjacent to domain views.

They should move only when a target folder/public API has been defined.

### SK2-PHYS-05 — package dependencies are currently application-wide

The current Angular application package combines reusable UI dependencies and application infrastructure dependencies, including Firebase/AngularFire.

A future neutral Starter Kit must not make Firebase a Core architectural requirement.

SK.2 does not remove any dependency from the existing ComeMiVesto application.

### SK2-PHYS-06 — assets and branding need ownership classification

The current project contains shared fonts/assets and host branding such as the ComeMiVesto header logo.

Future extraction must distinguish:

- assets required by reusable UI;
- default Starter Kit theme assets;
- ComeMiVesto-only branding/assets.

No asset is moved in SK.2.

### SK2-PHYS-07 — tracked generated/history artifacts

Ignore rules already cover generated paths such as:

- `.firebase/`;
- `dist/`;
- `documentation/`;
- logs;
- `src/app.zip`;
- component zip files.

However historical generated files are still tracked in the repository.

They must not be copied into a future Starter Kit repository. Their deletion from the current repository is a separate non-functional hygiene decision, not part of SK.2.

---

## 7. CANDIDATES — do not promote automatically

### 7.1 `DashboardStatCardComponent`

`src/app/views/dashboard/components/dashboard-stat-card/**` is technically generic: its component surface is label/value/meta/icon/route/tone.

However it is currently owned and used by the ComeMiVesto Dashboard feature.

SK.2 classification:

**APPLICATION-OWNED REUSABLE CANDIDATE**.

Do not place it in Starter Kit V1 unless the future public surface explicitly includes dashboard/stat-card primitives.

### 7.2 `TimestampToDatePipe`

`src/app/pipes/timestamp-to-date.pipe.ts` has no Firebase/domain dependency, but:

- its current consumer is application functionality;
- it hard-codes `dd/MM/yyyy` formatting.

SK.2 classification:

**APPLICATION UTILITY / CANDIDATE**.

It is not required for Starter Kit V1.

---

## 8. Proposed conceptual extraction map

This is a conceptual destination only; folder names are not yet approved and no move is performed in SK.2.

```text
Admin Core / Starter Kit
|
|-- DataGrid
|-- Forms
|   |-- DynamicForm
|   |-- FormBuilder
|   `-- Form definition management
|-- Popup / Dialog / Overlay
|-- Layout
|   |-- Container
|   |-- Header
|   |-- Menu
|   `-- Page shell
|-- UI Infrastructure
|   |-- Caption / Toolbar
|   `-- CustomScrollbar
|-- contracts
|   |-- Grid providers
|   |-- Form repositories/options
|   |-- Navigation
|   |-- Header
|   |-- Session
|   |-- Popup registry
|   `-- Scroll policy
`-- generic models/utilities

ComeMiVesto Application
|
|-- dashboard
|-- users
|-- outfits
|-- outfit categories
|-- products/feed
|-- affiliate catalog
|-- colors
|-- reports
|-- login/access denied
|-- auth/RBAC/Firebase
|-- API/domain services
`-- ComeMiVesto models

Host Composition / Adapters
|
|-- app.config
|-- app.routes
|-- navigation config
|-- header config
|-- popup registrations
|-- header-user adapter
|-- layout-session adapter
|-- Forms HTTP adapter
`-- legacy DataGrid REST adapter
```

---

## 9. Dependency examples after extraction

### Users feature

```text
ComeMiVesto Users
      |
      +--> DataGrid Core
      +--> DynamicForm Core
      +--> Dialog Core
      |
      `--> UserService / AuthService
```

### Affiliate Catalog feature

```text
ComeMiVesto Affiliate Catalog
      |
      +--> Page Shell Core
      |
      `--> Affiliate Catalog API/models
```

### Forms

```text
FormBuilder / Form List / DynamicForm
                |
                v
FORM_DEFINITION_REPOSITORY
FORM_OPTIONS_PROVIDER
                ^
                |
          host FormService
                |
                v
       ComeMiVesto backend
```

### Layout

```text
Container / Header / Menu
      |
      +--> LAYOUT_SESSION_PROVIDER
      +--> HEADER_USER_PROVIDER
      +--> HEADER_CONFIG
      `--> NAVIGATION_ITEMS
                 ^
                 |
          host configuration/adapters
                 |
                 v
       ComeMiVesto auth/user/config
```

These are the patterns that physical extraction must preserve.

---

## 10. Public surface is not yet frozen

SK.2 identifies ownership but does not decide the final exported API.

The next phase must define:

- which components are public Starter Kit capabilities;
- which contracts/tokens are public;
- which helpers/models remain internal;
- how host configuration is registered;
- which compatibility aliases/deprecated members remain supported;
- how Forms capability routes are offered to the host;
- what global styles/assets are mandatory versus optional/default theme;
- which Angular/npm dependencies belong to Core versus demo/host application.

This must be decided before mass file moves.

---

## 11. Recommended next phase — SK.3 Public Surface & Target Layout

SK.3 should remain conservative and architecture-first.

Goals:

1. define the target physical folder/layer structure;
2. define the Starter Kit public surface;
3. define internal-only implementation files;
4. decide how the host provides configuration/adapters;
5. define how global styles/assets are packaged;
6. define compatibility surfaces that must survive physical moves;
7. produce an ordered move plan with small PR slices.

SK.3 should still avoid a broad repository rewrite.

Only after SK.3 should physical movement begin, one capability at a time, with build/tests preserved after each slice.

---

## 12. SK.2 exit verdict

**READY FOR PHYSICAL EXTRACTION PLANNING.**

The current repository has sufficient logical Core/Application boundaries to stop introducing new architectural abstractions for the stabilized capabilities.

The remaining work is primarily:

- physical organization;
- public API definition;
- dependency/package ownership;
- styles/assets ownership;
- compatibility-aware migration;
- final creation of the neutral Starter Kit repository/template.

SK.2 does not identify a new runtime blocker requiring changes to Forms, DataGrid, Popup/Dialog/Overlay, Layout/Header/Navigation or UI Infrastructure before SK.3.
