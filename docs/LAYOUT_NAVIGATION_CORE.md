# Layout & Navigation Core — Phase E.0 characterization baseline

## Scope

Phase E.0 freezes and documents the current layout/navigation behavior before any correctness fix or Starter Kit boundary extraction.

This phase changes **tests and documentation only**. Production behavior is intentionally untouched.

The current runtime layout is:

```text
AppComponent
├── ContainerComponent
│   ├── HeaderComponent
│   ├── MenuComponent
│   └── RouterOutlet
├── PopupWrapperComponent
└── OverlayComponent
```

Popup/overlay internals are outside Phase E and remain governed by Phase D.

## Current layout responsibilities

### ContainerComponent

Current responsibilities:

- decides whether header/menu are shown from authentication state;
- owns the `over | side | push` layout mode;
- observes Angular CDK breakpoints;
- opens/closes the shared menu through `MenuService`;
- renders the mobile backdrop when the authenticated menu is open in `over` mode;
- hosts the application `router-outlet`.

Observed breakpoint contract:

```text
XSmall -> over + menu closed
Small  -> over + menu closed
Medium -> side + menu open
Large/other observed desktop -> push + menu open
```

`updateMenuVisibility(window.innerWidth)` also opens above 1024px and closes at/below 1024px during initialization. This overlaps conceptually with the BreakpointObserver policy and is intentionally not changed in E.0.

## Current MenuService contract

`MenuService` currently exposes the same state through two mechanisms:

- writable Signal: `isOpenMenu`;
- BehaviorSubject-backed Observable: `getIsMenuOpenObservable`.

`openMenu`, `closeMenu` and `toggleMenu` update both mechanisms manually.

E.0 characterizes that both representations currently remain synchronized. No attempt is made to consolidate them yet.

## Current MenuComponent contract

`MenuComponent` currently owns the ComeMiVesto navigation configuration directly.

Current top-level entries and order:

1. Dashboard
2. Utenti Registrati
3. Gestione form e viste
4. Lista outfit
5. Lista categorie outfit
6. Colori outfit
7. Segnalazioni
8. Gestione prodotti e feed

The component:

- renders one `routerLink` for every `allMenu` item;
- closes the shared menu state when an item is selected;
- mirrors the MenuService Observable into its local `isMenuOpen` field.

The hardcoded application navigation is a confirmed Starter Kit boundary candidate, but it is **not extracted in E.0**.

## Routes are not equivalent to navigation

The Angular route table also contains non-menu routes such as:

- `login`;
- `access-denied`;
- `form-builder/:id`;
- `outfit-detail/:id`;
- `outfit-detail`;
- `outfit-category/:id`.

Therefore E.0 records the architectural distinction:

```text
application routes != visible navigation entries
```

The commented historical idea of generating the menu directly from `router.config` is not reactivated.

## Current HeaderComponent contract

The header currently:

- toggles `MenuService` from the hamburger action;
- loads the authenticated user's profile through `UserService`;
- renders ComeMiVesto branding/profile data;
- opens the existing global Overlay for the profile dropdown with `showBgOverlay: false`;
- delegates logout to `AuthService`.

The header frame is a Starter Kit candidate, while branding/profile integration is application-specific. This boundary is documented only; no extraction happens in E.0.

## Characterization tests added in E.0

### MenuService

Covered behavior:

- initial closed state;
- Signal/Observable synchronization on open;
- Signal/Observable synchronization on close;
- toggle behavior and emitted values.

### MenuComponent

Covered behavior:

- current ComeMiVesto menu entries and order;
- one rendered navigation link per configured item;
- local state following MenuService Observable;
- menu close after navigation selection.

### ContainerComponent

Covered behavior:

- XSmall -> `over` and closed;
- Small -> `over` and closed;
- Medium -> `side` and open;
- Large -> `push` and open;
- backdrop visibility for authenticated/open/over state;
- toggle/close delegation to MenuService.

### HeaderComponent

Covered behavior:

- authenticated profile load;
- no profile request without a current user;
- hamburger toggling MenuService;
- profile overlay opening through OverlayService;
- logout delegation to AuthService.

## Findings intentionally not fixed in E.0

### E.1 correctness/lifecycle candidates

1. `MenuComponent` subscribes to `getIsMenuOpenObservable` without explicit teardown.
2. `ContainerComponent` subscribes to `BreakpointObserver.observe(...)` without explicit teardown.
3. `HeaderComponent` subscribes to the user profile Observable without explicit teardown.
4. Every menu link currently uses static `aria-current="page"`; active-route semantics should be verified/fixed rather than applied to every link.
5. `MenuComponent` still declares its own `mode` and injects `BreakpointObserver`, although responsive ownership currently lives in `ContainerComponent`.
6. `ContainerComponent` has both `updateMenuVisibility(window.innerWidth)` and BreakpointObserver-based policy; their overlap should be characterized before simplification.
7. Container SCSS contains selectors targeting `.menu-container`, which belongs to the child `MenuComponent`; Angular style encapsulation may make those rules ineffective. This requires runtime verification before any change.
8. The TypeScript `over` policy covers both XSmall and Small, while the explicit transform-based mobile CSS is limited to `max-width: 767px`; this mismatch requires viewport validation.

## Legacy layout inventory

The repository still contains historical layout folders:

- `layout/static-menu`;
- `layout/static-menu-functions`.

These files contain legacy Nica/domain concepts such as licenses, companies, waste registers, waste causes and other unrelated application behavior.

The current runtime path does not import those components from `AppComponent` or `ContainerComponent`.

`StaticMenuComponent` also imports `NicaMenuService`, while no current `nica-menu.service.ts` is present in the services directory examined on `develop`.

E.0 therefore classifies these folders as **legacy cleanup candidates**, not as files to delete immediately.

## Explicit non-goals for Phase E.0

E.0 does not:

- change production TypeScript, HTML or SCSS;
- change routes;
- extract menu configuration;
- create a navigation injection token/registry;
- remove Signal or Observable compatibility;
- alter responsive breakpoints;
- redesign header/menu UI;
- change Auth/RBAC behavior;
- remove legacy static-menu code;
- change Popup/Overlay architecture;
- modify ComeMiVesto feature pages.

## Planned next phases

After the characterization baseline is reviewed:

1. **E.1 — correctness/lifecycle**: only confirmed interaction, accessibility, lifecycle and responsive defects.
2. **E.2 — navigation boundary**: move application menu entries out of the reusable Menu component behind a small navigation contract/configuration boundary.
3. **E.3 — header/application boundary**: evaluate branding/profile configuration without disturbing Auth/RBAC.
4. **E.4 — legacy layout cleanup**: remove historical Nica layout code only after reachability is proven.
5. **E.5 — responsive regression**: desktop/tablet/mobile validation before closing Layout & Navigation Core.
