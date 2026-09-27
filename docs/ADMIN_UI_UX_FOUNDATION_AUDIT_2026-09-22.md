# AdminComeMiVesto — UX/UI foundation audit

**Date:** 22 September 2026  
**Branch analysed:** `develop`  
**Implementation branch:** `feat/admin-ui-foundation`

## Goal

Establish a conservative visual foundation before redesigning individual screens. The reusable Core remains structurally reusable; the host application owns final presentation.

## Confirmed findings

### 1. Cascade ownership was inverted

Before this change the global order was:

```text
Bootstrap
→ host theme
→ admin Core
```

At equal specificity, Core rules therefore won over host-theme rules.

The new contract is:

```text
Bootstrap
→ admin Core
→ host theme
```

The host theme is intentionally loaded last.

### 2. Core contained invasive global presentation

Confirmed examples in `admin-core.scss`:

- global link color with `!important`;
- global `div { position: relative; max-width: 100%; }`;
- global `*:focus { outline: none; }`;
- body typography forced with `!important`;
- visual values mixed with structural reusable styles.

The foundation removes the most dangerous global overrides without redesigning feature pages.

### 3. Focus visibility was disabled globally

`*:focus { outline: none; }` removed the browser focus indicator.

It is replaced with a themeable `:focus-visible` ring.

### 4. Theme tokens were too shallow

The previous host theme exposed mainly historical variables such as:

- `--primary`;
- `--blueSoft`;
- `--bg-grey`;
- `--border_color`.

The new theme introduces semantic `--cmv-*` tokens for typography, surfaces, text, borders, interaction, focus, radius and shadows. Legacy aliases remain temporarily for Core compatibility.

### 5. Historical layout token duplication

`--height_caption` was declared twice (27px and 35px). The effective runtime value was already 35px; the duplicate is removed.

`--header_height` is aligned to the actual header height (65px). Current repository usage is limited to the header max-height and the derived legacy `--height_combined` token.

## UX/UI direction observed in the current product

The application currently contains different visual generations:

- Dashboard: modern card/surface hierarchy, stronger spacing and explicit loading/error/empty states;
- Notifications and Affiliate Catalog: newer responsive patterns and 44px mobile actions;
- older Core/DataGrid and some CRUD screens: compact 12px/27px-era styling, hardcoded colors and legacy density.

The redesign should converge on the newer Dashboard/Notifications/Affiliate direction without copying feature-specific CSS into Core.

## Architecture target

```text
Reusable Core
  ↓
semantic design tokens
  ↓
ComeMiVesto host theme
  ↓
feature-specific composition
```

Core owns behavior and reusable structure. ComeMiVesto owns brand and final presentation.

## Scope of this foundation PR

Included:

- cascade ownership;
- semantic host tokens;
- compatibility aliases;
- safe global typography/background;
- link ownership moved to host theme;
- visible keyboard focus;
- removal of the global `div` override;
- cleanup of duplicate caption token.

Not included:

- Header/Menu redesign;
- Caption redesign;
- DataGrid redesign;
- Forms/Popup redesign;
- feature-page restyling;
- responsive breakpoint refactor;
- removal of legacy aliases.

## Next phases

1. Shell: Header, navigation, page container and Caption.
2. Core surfaces: DataGrid, Forms, Popup/Dialog, toolbar.
3. Feature convergence: Users, Outfits, Reports, Categories, Styles and Colors.
4. Affiliate/Notifications polish using the same tokens.
5. Responsive/accessibility regression pass.

Each phase should remain a separate PR.
