# Layout & Navigation Core — Phase E.1 correctness

## Scope

Phase E.1 applies only conservative correctness/lifecycle fixes proven by the E.0 baseline.

No routes, responsive CSS, application menu configuration, Auth/RBAC rules, popup/overlay runtime or legacy Nica code are changed.

## MenuService single source of truth

The previous service maintained the same state twice:

```text
WritableSignal isOpenMenu
+
BehaviorSubject isOpenMenuSubject
```

Every `openMenu`, `closeMenu` and `toggleMenu` operation had to write both values manually.

E.1 keeps the existing Signal as the only mutable state:

```text
isOpenMenu
   ↑
open / close / toggle
```

`getIsMenuOpen` remains available as a readonly Signal contract.

The BehaviorSubject and `getIsMenuOpenObservable` compatibility layer are removed because the active consumers can read the same Signal directly and no external write to `isOpenMenu.set(...)` was found.

## MenuComponent

The component now reads the readonly Signal directly instead of subscribing to an Observable and copying its value into a second local boolean.

This removes one unnecessary subscription without changing open/close behavior.

Navigation entries and their order remain unchanged and are still application-owned until Phase E.2.

## Active route semantics

Static `aria-current="page"` has been removed from every menu link.

Angular `RouterLinkActive` now marks only the active route and supplies `ariaCurrentWhenActive="page"`.

No route table is changed.

## Lifecycle

Existing long-lived subscriptions are tied to component destruction with `takeUntilDestroyed`:

- `ContainerComponent` -> `BreakpointObserver.observe(...)`;
- `HeaderComponent` -> `UserService.getUserProfile(...)`.

The menu subscription disappears entirely because the Signal is read directly.

## Deferred findings

E.1 intentionally does not change the responsive CSS/breakpoint mismatch identified in E.0 because it still requires runtime viewport validation.

The following remain deferred:

- navigation configuration extraction -> E.2;
- header/application boundary -> E.3;
- legacy static-menu/Nica cleanup -> E.4;
- responsive viewport regression/fixes -> E.5 or an earlier dedicated fix if runtime evidence confirms a defect.
