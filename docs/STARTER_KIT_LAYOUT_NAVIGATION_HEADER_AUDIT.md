# Starter Kit — Layout / Navigation / Header audit

Baseline: `develop@011b6f213f7d72614816120968f70c9ab71fbc2b`

## Scope

This audit verifies the current Layout / Navigation / Header area against the Starter Kit direction.

This phase is analysis-only.

It does **not**:

- refactor layout components;
- move files;
- rename services;
- change routes;
- change authentication behavior;
- change responsive behavior;
- change menu/header UX;
- introduce a new runtime abstraction.

The objective is to distinguish what is already Core-ready from any remaining concrete ComeMiVesto coupling.

---

## Target dependency rule

```text
ComeMiVesto Application
        |
        | configures / implements
        v
Starter Kit Layout Core
```

The reusable layout must not need to know Firebase, ComeMiVesto users, backend endpoints or application-specific navigation entries.

---

# 1. Navigation

## Generic Core contract

`src/app/services/navigation-registry.ts`

```ts
export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
}

export const NAVIGATION_ITEMS =
  new InjectionToken<readonly NavigationItem[]>('NAVIGATION_ITEMS');
```

This is generic Starter Kit configuration.

## Application configuration

`src/app/app-navigation.ts`

`comeMiVestoNavigation` contains the actual ComeMiVesto entries such as dashboard, users, outfits, reports and products.

That list is application-owned configuration.

## Core consumer

`src/app/layout/menu/menu.component.ts`

`MenuComponent` injects `NAVIGATION_ITEMS` and renders the supplied configuration.

It does not import `comeMiVestoNavigation` and does not know ComeMiVesto route names.

Its only runtime dependencies are generic Angular routing and `MenuService` menu state.

## Characterization

`menu.component.spec.ts` already proves both:

1. the current ComeMiVesto configuration remains unchanged;
2. a completely different navigation configuration can be supplied without changing `MenuComponent`.

### Decision

**Navigation is logical Starter Kit/Core-ready.**

No navigation refactor is required.

---

# 2. Header configuration

## Generic Core contract

`src/app/services/header-config.ts`

```ts
export interface HeaderConfig {
  logoUrl: string;
  logoAlt: string;
  defaultAvatarUrl: string;
}
```

The reusable Header consumes this through `HEADER_CONFIG`.

## Application configuration

`src/app/app-header-config.ts`

`comeMiVestoHeaderConfig` supplies the current logo/default-avatar values.

The concrete branding therefore remains application-owned.

### Decision

**Header visual configuration is logical Starter Kit/Core-ready.**

---

# 3. Header user/session presentation

## Generic Core contract

`src/app/services/header-user-provider.ts`

```ts
export interface HeaderUser {
  displayName: string;
  profileLabel: string;
  photoURL?: string;
}

export interface HeaderUserProvider {
  getUser(): Observable<HeaderUser | null>;
  logout(): Promise<void>;
}
```

The Header only needs presentation-level user data plus logout.

## Core consumer

`src/app/layout/header/header.component.ts`

`HeaderComponent` injects:

- `HEADER_CONFIG`;
- `HEADER_USER_PROVIDER`;
- `MenuService`;
- `OverlayService`.

It does **not** inject `AuthService`, `UserService`, Firebase or HTTP services.

## ComeMiVesto adapter

`src/app/app-header-user.service.ts`

`ComeMiVestoHeaderUserService` implements `HeaderUserProvider` and is the application adapter that knows:

- `AuthService`;
- `UserService`;
- the ComeMiVesto user profile shape.

It maps the application user into the small `HeaderUser` model expected by Core.

## Composition root

`src/app/app.config.ts`

```ts
{ provide: HEADER_CONFIG, useValue: comeMiVestoHeaderConfig },
{ provide: HEADER_USER_PROVIDER, useClass: ComeMiVestoHeaderUserService },
```

This follows the intended Application -> Core dependency direction.

## Characterization

`header.component.spec.ts` verifies:

- provider-driven user loading;
- null-user behavior;
- configured logo/default avatar;
- menu toggle;
- profile overlay;
- logout delegation.

### Decision

**Header is logical Starter Kit/Core-ready.**

No Header refactor is required.

---

# 4. Menu state

`src/app/services/menu.service.ts`

`MenuService` owns only the generic open/close signal and methods:

- `toggleMenu()`;
- `closeMenu()`;
- `openMenu()`.

There is no domain/backend dependency.

### Decision

**Menu state is Starter Kit/Core infrastructure.**

---

# 5. Responsive layout shell

`src/app/layout/container/container.component.ts`

The layout shell already owns generic concerns correctly:

- Header/Menu composition;
- router outlet;
- responsive breakpoint handling;
- `side` / `over` / `push` menu modes;
- mobile menu closing;
- shared `MenuService` state.

`container.component.spec.ts` and `container.responsive.spec.ts` characterize the responsive behavior.

Mobile behavior remains an architectural requirement and must be preserved.

---

# 6. Remaining concrete boundary leak

One direct application dependency remains in the reusable layout shell:

```text
ContainerComponent
        |
        v
   AuthService
        |
        +--> AngularFireAuth / Firebase
        +--> application role/session behavior
```

`ContainerComponent` currently uses:

```ts
this.auth.currentUser()
this.auth.waitForUser()
```

only to determine one layout-level fact:

```text
Should the authenticated shell (Header + Menu) be visible?
```

The template uses `isLogin` to show/hide Header, Menu and mobile menu backdrop.

The container does not need Firebase users, roles, tokens, backend role APIs or authentication implementation details.

Therefore the direct dependency on the concrete `AuthService` is a genuine Application -> Core boundary leak.

---

# 7. Why this is different from Header

Header already follows the desired pattern:

```text
HeaderComponent
      |
      v
HEADER_USER_PROVIDER
      ^
      |
ComeMiVestoHeaderUserService
      |
      v
AuthService / UserService
```

Container currently still has:

```text
ContainerComponent
      |
      v
AuthService
```

The missing piece is therefore small and localized.

---

# 8. Recommended next slice — design only

Do not refactor the authentication system.

Do not change `AuthService` behavior.

Do not move auth/guards/routes.

The next implementation, if approved, should introduce the **smallest possible layout-session boundary** representing only existing behavior required by `ContainerComponent`.

Conceptually:

```text
ContainerComponent
      |
      v
layout session contract
      ^
      |
ComeMiVesto composition/adapter
      |
      v
AuthService
```

The contract should expose only the two semantics already consumed by Container:

1. current authenticated/not-authenticated state;
2. wait until the initial session state is resolved.

No roles, tokens, login, logout, Firebase user model or backend APIs belong in this contract.

The implementation should preserve:

- the current initial auth wait;
- reactive shell visibility when `currentUser` changes;
- current unauthenticated routing behavior;
- all existing breakpoint/menu behavior;
- all existing tests, adapting only DI wiring where required.

The composition root should bind the small contract to ComeMiVesto's existing `AuthService` behavior.

---

# 9. Explicit non-goals for the next slice

Do **not**:

- redesign `AuthService`;
- replace Firebase Auth;
- change `authGuard`;
- change `authInterceptor`;
- change role/RBAC behavior;
- change login/logout behavior;
- change routes;
- change Header providers;
- merge Header and Container session contracts;
- redesign responsive modes;
- redesign the menu;
- move layout folders;
- introduce a new Angular library;
- rename historical CSS/classes;
- perform unrelated cleanup.

---

# 10. Final classification

| Area | Status | Notes |
| --- | --- | --- |
| Navigation contract | Core-ready | `NAVIGATION_ITEMS` |
| ComeMiVesto navigation list | Application | correctly externalized |
| MenuComponent | Core-ready | consumes navigation contract |
| MenuService | Core-ready | generic state only |
| Header config contract | Core-ready | `HEADER_CONFIG` |
| Header user contract | Core-ready | `HEADER_USER_PROVIDER` |
| ComeMiVesto header adapter | Application | correctly isolates Auth/User services |
| HeaderComponent | Core-ready | no concrete app auth dependency |
| Responsive layout behavior | Core-ready behavior | preserve unchanged |
| Container authentication dependency | **Boundary leak** | direct `AuthService` dependency remains |

---

# 11. Audit decision

**Layout / Navigation / Header cannot yet be marked fully closed as one Starter Kit block.**

However:

- Navigation is closed;
- Header is closed;
- Menu state is closed;
- responsive layout behavior is already reusable;
- exactly one small boundary remains: `ContainerComponent -> AuthService`.

The next change should be a narrowly scoped contract-decoupling slice for the container session state, with no authentication refactor and no runtime behavior change.
