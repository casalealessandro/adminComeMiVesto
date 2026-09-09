# Starter Kit — SK.4.8 Styles / Assets Boundary

## Status

SK.4.8 completes the first physical boundary for global Starter Kit styling and records the asset ownership rules required before the neutral Starter Kit repository is created.

Baseline:

- repository: `casalealessandro/adminComeMiVesto`;
- branch: `develop`;
- baseline commit: `e03365fc7d30d18c45a733e386e662734a32c5b6`;
- SK.4.7 public-surface/import normalization: already merged;
- Affiliate Catalog detail/responsive work through PR #82: already present in the baseline.

This phase is intentionally conservative. It does not redesign the UI and it does not change ComeMiVesto feature behavior.

---

## 1. Problem closed by SK.4.8

Before this phase, `src/styles.scss` contained all of the following in a single global file:

- Bootstrap import;
- default CSS custom properties;
- global reset/baseline rules;
- reusable utility rules;
- loader/button/dialog rules;
- layout mode rules for `menu-over`, `menu-side` and `menu-push`.

That made the runtime appearance usable, but the physical ownership boundary was unclear for a future neutral Starter Kit extraction.

SK.3 already defined the target concept:

```text
src/styles.scss                     # host entry point
src/styles/admin-core.scss          # structural/global rules used by the admin shell
src/styles/admin-theme-default.scss # default template theme tokens
```

SK.4.8 now applies that split without changing the effective stylesheet order.

---

## 2. Resulting style structure

### Host entry point

`src/styles.scss` remains the Angular global stylesheet registered by `angular.json`.

It now only composes the current styling layers in this order:

```scss
@import 'bootstrap/scss/bootstrap';
@import 'styles/admin-theme-default';
@import 'styles/admin-core';
```

The order is deliberate and must remain stable in V1 because the existing cascade is part of compatibility.

### Default theme

`src/styles/admin-theme-default.scss` owns the existing default CSS custom properties.

The current names and values are preserved exactly, including historical naming and duplicate declarations. This phase does not normalize tokens or create a new design system.

The file is the default Starter Kit theme seam: a future host can replace or override these values without editing Core component code.

### Core/global structural stylesheet

`src/styles/admin-core.scss` owns the remaining existing global rules required by the current admin shell and reusable UI behavior.

The rules are moved, not redesigned. Existing selectors, values, nesting, utility class names and layout behavior remain unchanged.

---

## 3. Compatibility rule

The compiled ordering remains conceptually equivalent to the previous monolithic file:

```text
Bootstrap
  -> current default variables
  -> current global/reset/UI/layout rules
```

Therefore SK.4.8 deliberately does **not**:

- rename CSS variables;
- remove the duplicated historical `--height_caption` declaration;
- change colors, fonts, spacing or dimensions;
- change menu mode selectors;
- rename utility classes;
- change dialog styling;
- change responsive behavior;
- introduce Sass modules/design tokens;
- replace Bootstrap;
- change component-scoped SCSS.

Those would be separate behavioral/design changes rather than a boundary extraction.

---

## 4. Asset ownership

### ComeMiVesto logo

The current ComeMiVesto logo remains:

```text
src/assets/images/logo.jpg
```

It is **host/application branding**, not Starter Kit Core branding.

The Core header does not hard-code that path. The host supplies it through:

```text
src/app/app-header-config.ts
    -> comeMiVestoHeaderConfig.logoUrl
    -> assets/images/logo.jpg
```

and the Core header renders `headerConfig.logoUrl`.

This is the desired boundary and no logo move is required in SK.4.8.

### Existing font assets

The historical bundle under:

```text
src/assets/fonts/helvetica-neue/
```

is left untouched.

SK.4.8 does not promote it to a mandatory Core asset, delete it, rename it, or rewrite typography around it. Asset cleanup/licensing/de-duplication is a separate concern and must not be mixed into this extraction PR.

### Generic icon/font dependencies

Existing generic UI dependencies such as Material Design Icons and the current header icon loading remain unchanged. They are not ComeMiVesto branding and are not redesigned in this phase.

---

## 5. Angular/build ownership

`angular.json` remains unchanged.

The application still registers only:

```text
node_modules/@mdi/font/css/materialdesignicons.min.css
src/styles.scss
```

The new files are reached through the existing `src/styles.scss` host entry point. No additional Angular build entry is introduced.

This keeps the current host/application bootstrapping model stable.

---

## 6. Starter Kit CI coverage

The existing `Starter Kit Core` workflow is extended to run when either of these paths changes:

```text
src/styles.scss
src/styles/**
```

The workflow continues to execute the existing Core checks:

```text
npm run test:core-boundaries
npm run test:data-grid
npm run build -- --configuration development
```

No new dependency or test framework is introduced.

---

## 7. Core / host ownership after SK.4.8

```text
Host / ComeMiVesto
|
|-- src/styles.scss
|     composition entry point
|
|-- src/assets/images/logo.jpg
|     ComeMiVesto branding
|
|-- app-header-config.ts
|     chooses host logo/avatar configuration
|
`-- existing host/application assets

Starter Kit reusable styling
|
|-- src/styles/admin-theme-default.scss
|     default theme tokens
|
`-- src/styles/admin-core.scss
      global structural/reusable UI rules
```

This is a logical ownership boundary for the current repository and the physical source shape expected by the future neutral Starter Kit repository.

---

## 8. Explicit non-goals

SK.4.8 does not include:

- visual redesign;
- new theme switcher;
- dark mode;
- CSS variable renaming;
- typography redesign;
- Bootstrap removal;
- Material/CDK migration;
- icon-library replacement;
- asset compression;
- font licensing cleanup;
- removal of historical assets;
- moving ComeMiVesto business pages;
- changing Affiliate Catalog UI;
- changing auth/RBAC/Firebase/backend behavior;
- Angular major upgrade;
- creation of the separate Starter Kit repository.

---

## 9. Acceptance criteria

SK.4.8 is complete when:

1. `src/styles.scss` is only the host composition entry for the existing global styling layers;
2. default CSS custom properties live in `src/styles/admin-theme-default.scss`;
3. remaining existing global structural/UI rules live in `src/styles/admin-core.scss`;
4. import order preserves the historical cascade;
5. no selector/value/runtime behavior is intentionally changed;
6. ComeMiVesto logo remains host-owned and supplied through `HEADER_CONFIG`;
7. existing assets are not destructively cleaned or promoted into Core without evidence;
8. Starter Kit CI is triggered by the new style boundary paths;
9. Core boundary check, focused DataGrid suite and development build pass before merge.

---

## 10. Closure decision

After SK.4.8 the planned SK.4 physical extraction sequence is complete at V1 boundary level:

```text
SK.4.1 UI Infrastructure move                 complete
SK.4.2 Popup/Dialog/Overlay move              complete
SK.4.3 Layout/Header/Navigation move          complete
SK.4.4 Forms move                             complete
SK.4.5 DataGrid model split                   complete
SK.4.6 DataGrid runtime move                  complete
SK.4.7 Core public-surface normalization      complete
SK.4.8 Styles/assets boundary                 complete by this phase
```

The next architectural milestone is SK.5: prepare/create the neutral Starter Kit repository from the now-contiguous and documented reusable boundary, without dragging ComeMiVesto application/domain code into the reusable template.
