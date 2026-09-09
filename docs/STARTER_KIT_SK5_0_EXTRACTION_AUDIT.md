# Starter Kit — SK.5.0 Extraction Audit

## 1. Scope and baseline

SK.5.0 freezes the extraction manifest for the future neutral Admin Starter Kit repository.

Baseline inspected:

- repository: `casalealessandro/adminComeMiVesto`;
- branch: `develop`;
- commit: `86bff71e09fd586a69e12e8da1216df3d2210411`;
- parent includes SK.4.8 styles/assets boundary;
- baseline also includes PR #85 (`security: remove legacy Tradedoubler frontend references`).

SK.5.0 is documentation/audit only. It does **not** create the neutral repository, move production files, remove compatibility code from AdminComeMiVesto, or change runtime behavior.

The purpose is to decide, before extraction, which material is:

- **COPY** — reusable source that belongs in the neutral Starter Kit;
- **ADAPT / RECREATE** — concept required by the Starter Kit but currently host-specific or migration-bound;
- **DEMO** — neutral example implementation that must be created in the new repository;
- **EXCLUDE** — ComeMiVesto/application/history/deployment material that must not enter the neutral product.

---

## 2. Extraction decision

Do **not** clone/copy the whole `adminComeMiVesto` repository and delete business features afterward.

The neutral repository must be assembled from the already isolated Starter Kit capabilities plus a clean Angular host/demo shell.

Target dependency direction:

```text
Neutral demo host
  |
  | configures contracts/tokens
  v
Starter Kit Core
  |
  `-- no Firebase / ComeMiVesto / environment / backend dependency
```

The current `src/app/core` folder is the source of truth for reusable capabilities, but it is **not yet safe to copy recursively without filtering**, because temporary SK.4 compatibility bridges and characterized DataGrid legacy escapes are still present.

---

## 3. COPY — canonical Core capabilities

Copy the canonical implementation and associated Core-neutral characterization tests/documentation for these capabilities:

```text
src/app/core/data-grid/
src/app/core/dialogs/
src/app/core/forms/
src/app/core/layout/
src/app/core/overlay/
src/app/core/popup/
src/app/core/ui/
src/app/core/public-api.ts
```

The copied surface must preserve the V1 public contracts frozen by SK.3/SK.4.7.

### DataGrid public/runtime surface

Keep:

- `DataGridComponent<T>`;
- `GridDataProvider<T>` and load/page/sort/filter/search contracts;
- detail provider contracts;
- lookup provider contracts;
- generic DataGrid models (`Colonne`, `ColData`, `detailOptions`, `costantValue`, `button`, etc.);
- `ProviderDataGridComponent` compatibility alias;
- current DataGrid characterization tests and focused test configuration where applicable.

Do not introduce a new backend syntax, Firebase identity, REST endpoint convention or OData convention during extraction.

### Forms public/runtime surface

Keep:

- `DynamicFormComponent` and field renderers;
- `FormBuilderComponent` and its property editor;
- `AppFormListComponent`;
- `DynamicFormField` and normalized metadata models;
- `FormDefinitionRepository` / `FORM_DEFINITION_REPOSITORY`;
- `FormOptionsProvider` / `FORM_OPTIONS_PROVIDER`;
- Core-neutral tests.

The concrete current `FormService` is not copied; see EXCLUDE/DEMO below.

### Layout / navigation / header

Keep:

- reusable shell implementation (`ContainerComponent`, `HeaderComponent`, `MenuComponent`, `MenuService`);
- `AnagraficaWrapperComponent` with its historical V1 name;
- `NavigationItem` / `NAVIGATION_ITEMS`;
- `HeaderConfig` / `HEADER_CONFIG`;
- `HeaderUserProvider` / `HEADER_USER_PROVIDER`;
- `LayoutSessionProvider` / `LAYOUT_SESSION_PROVIDER`.

### Popup / overlay / dialogs / UI

Keep:

- `PopUpService`;
- `PopupRegistration` / `POPUP_REGISTRY`;
- `starterKitEntryComponents`;
- historical `entryComponents` export only as the already-approved Core compatibility alias;
- modal popup runtime;
- `OverlayService` and overlay runtime;
- current dialog helpers;
- Caption / Toolbar infrastructure;
- CustomScrollbar and scroll interaction policy.

---

## 4. COPY — style boundary

Copy:

```text
src/styles/admin-core.scss
src/styles/admin-theme-default.scss
```

Recreate a neutral `src/styles.scss` composition entry that preserves the current order:

```scss
@import 'bootstrap/scss/bootstrap';
@import 'styles/admin-theme-default';
@import 'styles/admin-core';
```

The default theme is a starter default, not a permanent frozen semantic design-system API. Hosts remain free to override the tokens.

Component-scoped styles stay with their copied components.

---

## 5. DO NOT COPY — temporary Core migration bridges

The current `src/app/core` still contains SK.4 migration bridges. These must **not** become part of the neutral Starter Kit product surface.

Exclude these bridge locations from the extraction payload:

```text
src/app/core/components/data-grid/data-grid.component.ts
src/app/core/custom-scrollbar/custom-scrollbar.component.ts
src/app/core/interface/dynamic-form-field.ts
src/app/core/overlay-component/overlay.component.ts
src/app/core/services/form-definition-repository.ts
src/app/core/services/form-options-provider.ts
src/app/core/services/popup.service.ts
src/app/core/forms/custom-scrollbar/custom-scrollbar.component.ts
src/app/core/popup/caption/caption.component.ts
src/app/core/widgets/ui-dialogs.ts
```

Before/while the canonical capabilities are introduced in the neutral repository, update Core-internal imports to point directly to canonical paths, for example:

- Forms repository contract -> `core/forms/contracts/...`;
- DynamicForm metadata -> `core/forms/models/...`;
- dialogs -> `core/dialogs/ui-dialogs`;
- popup service -> `core/popup/popup.service`;
- scrollbar -> `core/ui/custom-scrollbar/...`;
- caption -> `core/ui/caption/...`;
- overlay -> `core/overlay/...`;
- DataGrid generic models -> `core/data-grid/models/data-grid.models`;
- ToolbarButton -> `core/ui/caption/toolbar-button`.

No public behavior or identifier rename is required for this normalization.

---

## 6. BLOCKER — DataGrid legacy Application escape

The current Core boundary checker intentionally allows legacy escapes in:

```text
src/app/core/data-grid/data-grid.component.ts
src/app/core/data-grid/td-item/td-item.component.ts
```

The existing allowlist includes application/facade paths for:

- `app.interface`;
- `ui-dialogs`;
- `AnagraficaService`;
- `OverlayService`.

The generic models/dialog/overlay references can be normalized to canonical Core paths.

`AnagraficaService` is different: it is a real ComeMiVesto/application legacy fallback and must **not** be copied into the neutral repository.

Neutral extraction rule:

```text
DataGrid -> GridDataProvider / lookup/detail providers
```

not:

```text
DataGrid -> AnagraficaService
```

Therefore the new repository is not considered neutral until:

1. `DataGridComponent` no longer injects/imports `AnagraficaService`;
2. `TdItemComponent` no longer injects/imports `AnagraficaService`;
3. legacy provider-neutral behavior remains characterized;
4. the Core boundary checker passes with **no Application escape allowlist**.

AdminComeMiVesto may retain its compatibility behavior independently if required; the neutral repo must not inherit that coupling.

---

## 7. ADAPT / RECREATE — host composition

Do not copy the current host composition files verbatim. Recreate their neutral equivalents:

```text
src/app/app.config.ts
src/app/app.routes.ts
src/app/app-navigation.ts
src/app/app-header-config.ts
src/app/app.component.*
```

### `app.config.ts`

Current AdminComeMiVesto composition correctly mixes Core bindings with Firebase/Auth/HTTP host concerns. The neutral version must bind only neutral/demo implementations.

Target conceptual bindings:

```text
POPUP_REGISTRY             <- Starter Kit registrations + demo registrations
NAVIGATION_ITEMS           <- demo navigation
HEADER_CONFIG              <- neutral branding config
HEADER_USER_PROVIDER       <- demo header-user provider
LAYOUT_SESSION_PROVIDER    <- demo session provider
FORM_DEFINITION_REPOSITORY <- in-memory/demo repository
FORM_OPTIONS_PROVIDER      <- in-memory/demo options provider
SCROLL_INTERACTION_POLICY  <- neutral overlay wiring
```

No AngularFire initialization, Firebase environment, auth interceptor or ComeMiVesto API adapter belongs in the neutral composition root.

### `app.routes.ts`

Do not copy the ComeMiVesto route table.

Create a small demo route set that demonstrates:

- demo dashboard/home;
- DataGrid demo;
- DynamicForm demo;
- `/form-list`;
- `/form-builder/:id`.

Do not import users, outfits, reports, colors, affiliate catalog, login/access-denied or ComeMiVesto auth guard.

### root shell

The current root mounting of Container + Popup wrapper + Overlay is reusable as a composition pattern. Recreate it in the neutral shell rather than copying host branding/state.

---

## 8. DEMO — adapters/providers required in the neutral repository

The neutral repository must be runnable with no backend.

Create minimal in-memory/demo implementations for:

### Session/header

- `DemoLayoutSessionService implements LayoutSessionProvider`;
- `DemoHeaderUserService implements HeaderUserProvider`.

The default demo session can be authenticated without Firebase; logout may reset demo state or be a no-op documented as demo behavior.

### Forms

Create an in-memory adapter implementing both:

- `FormDefinitionRepository`;
- `FormOptionsProvider`.

Seed at least one useful form definition so Form List, FormBuilder and DynamicForm work immediately after clone.

### DataGrid

Create a `GridDataProvider<T>` over in-memory sample rows.

The demo must exercise at minimum:

- load/page contract;
- sorting/filter/search where supported by the provider example;
- create/update/delete if the demo exposes CRUD;
- lookup/detail provider examples where useful without making the initial demo overly large.

### Demo navigation/popups

Create neutral `NavigationItem[]` and optional demo popup registrations. Do not reuse ComeMiVesto labels or feature components.

---

## 9. EXCLUDE — ComeMiVesto Application

Do not copy application/domain feature areas, including:

```text
src/app/views/affiliate-catalog/**
src/app/views/colors/**
src/app/views/dashboard/**        # replace with neutral demo dashboard
src/app/views/login/**
src/app/views/access-denied/**
src/app/views/outfits/**
src/app/views/outfit-category/**
src/app/views/outfit-products/**
src/app/views/reports/**
src/app/views/users/**
```

Also exclude current ComeMiVesto-specific host wiring/adapters:

```text
src/app/app-header-user.service.ts
src/app/app-layout-session.service.ts
src/app/app-popup-components.ts
src/app/auth.guard.ts
src/app/auth.interceptor.ts
src/app/services/auth.service.ts
src/app/services/anagrafica.service.ts
src/app/services/form.service.ts
src/app/services/dashboard.service.ts
src/app/services/outfit.service.ts
src/app/services/report.service.ts
src/app/services/taxonomy.service.ts
src/app/services/user.service.ts
```

`FormService` is explicitly environment/API-bound (`/gen/forms`, `/gen/{api}`) and is replaced by the demo/in-memory Forms adapter in the neutral repository.

---

## 10. EXCLUDE — application compatibility facades

Do not recreate the old AdminComeMiVesto physical-path shims in the neutral repository merely to preserve source-tree history.

Examples include facade/shim trees under historical locations such as:

```text
src/app/components/**              # where files only re-export canonical Core
src/app/layout/**                  # historical Core move facades
src/app/services/*-provider.ts     # historical Core contract re-exports
src/app/services/popup*.ts         # historical Core re-exports
src/app/services/overlay.service.ts
src/app/widgets/ui-dialogs.ts
src/app/interface/dynamic-form-field.ts
src/app/views/form-builder/**      # historical move shims/tests tied to host adapter
src/app/views/app-views/**         # historical Form List shim
```

Exception: compatibility explicitly implemented **inside canonical Core** remains where already approved, such as `ProviderDataGridComponent` and the `entryComponents` alias.

This distinction prevents the new product from inheriting the migration topology of the original application.

---

## 11. EXCLUDE — Firebase, deployment and generated/history artifacts

Do not copy:

```text
.firebaserc
.firebase/**
firebase.json
firebase-debug.log
.github/workflows/firebase-hosting-*.yml
dist/**
src/app.zip
src/app/components/overlay-component.zip
```

Do not carry generated historical build caches or deployment state into the neutral repository.

The neutral repository gets its own CI focused on install, boundary checks, tests and build.

---

## 12. Assets / branding manifest

### ComeMiVesto logo

`src/assets/images/logo.jpg` is host-owned.

Do not copy it to the neutral Starter Kit. The Core Header already consumes branding through `HEADER_CONFIG`, so the neutral demo should supply either:

- a neutral placeholder asset; or
- a simple neutral text/logo asset created specifically for the Starter Kit.

### Historical Helvetica Neue assets

`src/assets/fonts/helvetica-neue/**` are not part of the required extraction payload by default.

The global Starter Kit stylesheet currently uses `Public Sans` with a generic fallback, while the historical font folder was deliberately left untouched by SK.4.8 rather than promoted to a Core dependency.

Neutral action: **do not copy the historical font binaries unless a concrete copied component proves it requires an explicit local font file**. Validate after extraction by build/runtime inspection instead of carrying the entire historical font bundle by inertia.

### Icons

MDI icons are actively used by Core/demo-facing UI (for example FormBuilder field icons), so the neutral host needs a single controlled MDI integration.

Current AdminComeMiVesto loads icon/vendor resources in more than one way (`angular.json` and CDN markup). The neutral repository should standardize this during shell creation, not reproduce duplicate CDN/package loading.

### Header Font Awesome CDN

The current Core header template contains a Font Awesome CDN stylesheet for profile/logout icons. This is neutral in branding terms but is an external runtime dependency embedded inside a component template.

Classify as **ADAPT**: the neutral repository should make icon loading a project-level dependency/configuration concern or replace those two icons with the already-used neutral icon set, without redesigning Header behavior.

---

## 13. Dependency manifest

Current `package.json` contains both Core and ComeMiVesto dependencies.

### KEEP / required by the Angular Starter host or proven Core usage

Keep the Angular 17 line initially to avoid combining extraction with framework migration:

```text
@angular/animations
@angular/common
@angular/compiler
@angular/core
@angular/forms
@angular/platform-browser
@angular/platform-browser-dynamic
@angular/router
rxjs
tslib
zone.js
```

Also retain initially where proven by current Core/styles:

```text
bootstrap
@ng-bootstrap/ng-bootstrap
@mdi/font
```

`FormBuilderComponent` currently uses `NgbModal`/`NgbModalModule`, so ng-bootstrap is a real Core dependency at extraction time.

### REMOVE

Do not include in the neutral repository:

```text
@angular/fire
firebase
```

They are host/application dependencies and are already forbidden by the Core boundary checker.

### VERIFY DURING NEUTRAL SHELL BUILD

Do not automatically promote these to permanent Starter Kit dependencies merely because AdminComeMiVesto currently has them:

```text
@angular/cdk
@angular/material
@popperjs/core
```

Keep only if the copied Core/demo or a peer dependency concretely requires them. This must be decided from the neutral repository build/import graph, not from the original application package file.

### Dev dependencies

Keep the Angular/Jasmine/Karma/TypeScript toolchain needed by the copied tests and build. Compodoc can be added later if the new repository documentation workflow actually uses it; it is not an extraction blocker.

---

## 14. Index / vendor loading normalization

Do not copy `src/index.html` blindly.

The current file loads MDI from CDN while `angular.json` also loads the installed MDI package, and loads a Bootstrap JS bundle from CDN while Bootstrap SCSS is compiled through the global stylesheet.

The neutral shell should choose one controlled installation path for each vendor dependency and avoid duplicate CDN/package inclusion.

This is dependency ownership cleanup required for a reproducible Starter Kit, not a visual redesign.

---

## 15. Quality gates to carry forward

Copy/adapt the existing Core validation idea, not the ComeMiVesto deployment workflow.

Neutral CI must run at minimum:

```text
npm ci
npm run test:core-boundaries
npm run test:data-grid
npm run build -- --configuration development
```

Add focused Forms/Starter smoke tests when the demo adapters are introduced.

The neutral boundary checker must evolve from the current migration rule to:

```text
allowedLegacyEscapes = empty
```

and continue to reject:

- `@angular/fire`;
- `firebase`;
- environment imports;
- relative imports escaping `src/app/core`.

The neutral build must not require Firebase secrets, environment API URLs or network access to a ComeMiVesto backend.

---

## 16. Extraction blockers and required resolutions

### B1 — DataGrid -> AnagraficaService

**Status:** blocking neutral Core.

Resolution: remove/replace direct fallback dependency in neutral extraction and exercise provider-neutral paths through demo providers.

### B2 — Core-internal bridge imports

**Status:** blocking clean physical extraction, not current AdminComeMiVesto runtime.

Resolution: normalize canonical Core imports and do not copy temporary bridge folders.

### B3 — vendor/icon duplication

**Status:** shell reproducibility issue.

Resolution: neutral shell owns MDI/Bootstrap/icon inclusion once, with no ComeMiVesto-specific CDN assumptions.

### B4 — host composition is Firebase-bound

**Status:** expected, not a defect in AdminComeMiVesto.

Resolution: recreate composition root with demo providers; do not port Firebase host adapters.

No backend/API work is required to solve these blockers.

---

## 17. Recommended SK.5 execution sequence

### SK.5.1 — Neutral repository bootstrap

User action first: create an empty GitHub repository and grant the existing integration access.

Then:

- create clean Angular 17 shell;
- add minimal package/tooling configuration;
- add neutral root/index/styles composition;
- add CI skeleton;
- no Core copy yet unless shell baseline is green.

### SK.5.2 — Canonical Core + styles import

- copy canonical capability folders and public API;
- copy `admin-core.scss` / `admin-theme-default.scss`;
- omit SK.4 migration bridge folders;
- normalize Core-internal imports;
- resolve DataGrid legacy escapes;
- boundary allowlist becomes empty;
- build/test before further demo work.

### SK.5.3 — Demo providers/adapters

- demo session/header providers;
- in-memory Form repository/options provider;
- in-memory Grid provider;
- neutral popup/navigation config.

### SK.5.4 — Demo application

- useful default dashboard/home;
- DataGrid example;
- DynamicForm example;
- Form List/FormBuilder routes;
- mobile-first validation.

### SK.5.5 — Dependency neutralization

- remove Firebase completely;
- remove unused Material/CDK/Popper/etc. after actual import/build verification;
- normalize vendor/icon loading;
- verify no ComeMiVesto asset/backend/environment reference.

### SK.5.6 — Host configuration surface

Document and stabilize the intended extension seams without inventing new abstractions unless the demo proves a gap.

### SK.5.7 — Install/customization documentation

Document clone/install/start, navigation, header/session providers, DataGrid providers, Forms repository/options providers, theme override and feature extension.

### SK.5.8 — Final neutral validation

Fresh-install test from clean checkout:

```text
npm install/npm ci
npm start
Core boundary gate
tests
production/development build
mobile smoke test
search for ComeMiVesto/Firebase/backend secrets and names
```

Final acceptance: the repository is understandable and runnable by a developer with no ComeMiVesto context.

---

## 18. Handoff: what the user must create manually

The current GitHub integration can work on existing repositories but does not expose repository creation.

After SK.5.0 is accepted/merged, create one empty repository manually, for example:

```text
casalealessandro/adminStarterKit
```

Name is not frozen by this audit.

Recommended initial state:

- empty or README-only repository;
- default branch `main` is acceptable initially;
- ensure the same GitHub integration has read/write access.

Do **not** pre-copy AdminComeMiVesto into it.

Once the repository exists and is visible to the integration, SK.5.1 can begin there from a clean baseline.

---

## 19. SK.5.0 verdict

**READY FOR CONTROLLED NEUTRAL EXTRACTION, WITH KNOWN BLOCKERS TO RESOLVE DURING SK.5.2.**

SK.4 successfully made the reusable capabilities physically identifiable. SK.5 must now avoid carrying migration history and ComeMiVesto compatibility coupling into the new product.

The extraction source is therefore:

```text
canonical Core capabilities
+ Core styles/default theme
+ clean recreated Angular host
+ neutral demo adapters
```

not:

```text
full AdminComeMiVesto repository minus selected folders
```
