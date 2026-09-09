# Starter Kit — Popup / Dialog / Overlay Closure

Baseline: `develop@512a6ef56804684a7f184a8a0c1e4c435efb0fc4`

Status: **logical Starter Kit/Core-ready**.

This document closes the Popup / Dialog / Overlay audit for the Starter Kit direction. The audit is intentionally conservative: it records the architecture already present on `develop` and does not introduce runtime changes, new abstractions, new features or cleanup refactors.

## 1. Scope

Reviewed areas:

- `src/app/services/popup-registry.ts`
- `src/app/services/popup.service.ts`
- `src/app/services/entryComponents.ts`
- `src/app/app-popup-components.ts`
- `src/app/app.config.ts`
- `src/app/components/modal-popup/modal-popup-wrapper/*`
- `src/app/components/modal-popup/modal-popup-content/*`
- `src/app/services/overlay.service.ts`
- `src/app/components/overlay-component/*`
- `src/app/widgets/ui-dialogs.ts`
- existing characterization tests for Popup, modal wrapper/content, Overlay and dialogs.

No source file is changed by this closure phase.

## 2. Final classification

### Starter Kit / Core

The following responsibilities are generic and reusable:

- `POPUP_REGISTRY` and `PopupRegistration`;
- `PopUpService` runtime popup state and output routing;
- `PopupWrapperComponent` popup stack rendering and topmost-close behavior;
- `NicaPopupContentComponent` dynamic component creation and generic EventEmitter bridging;
- `OverlayService`;
- `OverlayComponent`;
- `alert`, `confirm` and `showPopover` DOM helpers;
- `CaptionComponent` used by popup content;
- starter-kit popup registrations in `starterKitEntryComponents`.

These areas do not depend on Firebase, backend endpoints or ComeMiVesto domain models.

### ComeMiVesto Application

The application owns the concrete popup registrations that belong to the ComeMiVesto domain:

```ts
comeMiVestoPopupComponents
```

Current domain registrations include:

- `ProductFromFeedComponent`;
- `OutfitProductsComponent`.

Those components are not part of the reusable popup infrastructure.

### Composition root

`app.config.ts` correctly composes Core and Application registrations:

```ts
const popupComponents = [
  ...starterKitEntryComponents,
  ...comeMiVestoPopupComponents,
];

{ provide: POPUP_REGISTRY, useValue: popupComponents }
```

This is the desired dependency direction:

```text
Application popup components
          |
          | register through
          v
    POPUP_REGISTRY
          |
          v
   Popup Core runtime
```

The Popup Core does not import the ComeMiVesto popup list.

## 3. Popup registry boundary

`popup-registry.ts` contains only the generic registration contract:

```ts
export interface PopupRegistration {
  readonly name: string;
  readonly component: Type<any>;
}

export const POPUP_REGISTRY =
  new InjectionToken<readonly PopupRegistration[]>('POPUP_REGISTRY');
```

This is already an appropriate Starter Kit boundary.

`PopUpService` receives the registry through dependency injection and resolves runtime components by the registered name. Therefore adding an application-specific popup does not require editing `PopUpService`.

No additional provider abstraction is required.

## 4. Popup runtime

`PopUpService` remains the generic runtime facade for the existing public behavior:

- popup creation;
- popup update by identity;
- popup removal by component name or GUID;
- multiple popup state;
- output-event stream;
- output resolution by GUID;
- mobile popup width fallback;
- current historical animation timing.

The audit does not redesign these APIs or rename historical members.

The current `any` types and historical names are implementation/cleanup concerns and do not prevent Starter Kit reuse.

## 5. Dynamic popup content

`NicaPopupContentComponent` dynamically resolves the requested component through `PopUpService.getComponentByName()` and creates it through `ViewContainerRef`.

It forwards the current generic runtime conventions:

- `itemData`;
- `instancedData`;
- `accessoringData`;
- popup GUID;
- dynamically discovered `EventEmitter` outputs;
- historical closing event.

There is no hard-coded ComeMiVesto component resolution inside the component.

Large commented historical blocks in this file are explicitly classified as optional cleanup only. They are not executed and are not part of this closure phase.

## 6. Popup wrapper and accessibility behavior

`PopupWrapperComponent` is generic popup infrastructure.

Existing characterized behavior includes:

- adding popup state to the rendered stack;
- preserving multiple popup order;
- update animation timing;
- remove animation timing;
- remembering the element focused before opening;
- focusing the opened popup;
- restoring focus after close;
- Escape closing only the topmost popup when it is closable;
- preserving non-closable popup behavior.

No application/domain dependency was found.

## 7. Dialog helpers

`ui-dialogs.ts` contains generic DOM-level helpers:

- `alert()`;
- `confirm()`;
- `showPopover()`.

They do not depend on ComeMiVesto services or domain models.

The characterization tests already preserve important current behavior for alert/confirm:

- `role="dialog"`;
- `aria-modal="true"`;
- `aria-labelledby`;
- action focus on opening;
- `Si` / `No` confirm result;
- Escape as cancel;
- previous-focus restoration.

The current API and DOM implementation are preserved. Moving these helpers to another physical folder or replacing them with a UI library would be a separate refactor and is not required for Core readiness.

## 8. Overlay

`OverlayService` and `OverlayComponent` are generic UI infrastructure.

The service exchanges only generic overlay data:

- position;
- template;
- backdrop flag;
- index.

The component owns generic UI behavior:

- visibility;
- template assignment;
- position;
- outside click closing;
- current open/close animation behavior;
- `closed` output.

Existing characterization tests cover open, service close, outside click, inside click and delayed component close.

No backend or ComeMiVesto domain coupling is present.

## 9. Application mounting

`AppComponent` currently mounts:

```html
<app-modal-popup-wrapper></app-modal-popup-wrapper>
<app-overlay></app-overlay>
```

This is a host/composition concern: the application chooses to mount the reusable global UI infrastructure at the root.

It does not make Popup/Overlay application-specific.

## 10. Existing Starter Kit registrations

`starterKitEntryComponents` currently includes:

- `ElementComponent`;
- `DynamicFormComponent`.

These are consistent with the Forms Starter Kit classification already closed in SK.1.

The historical `entryComponents` export is retained as compatibility alias. Removing or renaming it is not required by this closure.

## 11. Characterization safety net

The repository already contains characterization tests for the relevant behavior:

### `popup.service.spec.ts`

Covers, among other things:

- public popup configuration contract;
- updates;
- independent identities;
- starter-kit and ComeMiVesto registrations;
- externally supplied registrations;
- deterministic unknown-name behavior;
- mobile width;
- output stream;
- GUID-specific asynchronous output;
- listener release;
- close by GUID/name;
- close-all behavior.

### `modal-popup-wrapper.component.spec.ts`

Covers:

- stack add/update/remove behavior;
- multiple order;
- animation delays;
- focus origin restore;
- topmost Escape close;
- non-closable behavior.

### `modal-popup-content.component.spec.ts`

Covers:

- registered dynamic component creation;
- historical data transfer;
- object EventEmitter bridge;
- boolean EventEmitter bridge;
- closing event contract.

### `ui-dialogs.spec.ts`

Covers alert/confirm accessibility, focus and Escape behavior.

### `overlay.component.spec.ts`

Covers open/close and outside-click behavior.

This safety net is sufficient for the current closure decision. No additional runtime change is required merely to make the area reusable.

## 12. Explicit non-goals

This closure does **not** authorize or require:

- renaming `PopUpService`;
- redesigning `setNewPopUp()`;
- replacing `any` types;
- replacing BehaviorSubject/EventEmitter conventions;
- rewriting popup output handling;
- rewriting modal HTML/CSS;
- replacing dialogs with Angular Material/CDK or another library;
- changing animation timings;
- changing mobile width behavior;
- changing `Si` / `No` labels;
- changing application popup names;
- changing `starterKitEntryComponents` names;
- deleting the historical `entryComponents` alias;
- cleaning commented legacy code;
- moving files into new Core/Application directories;
- extracting an Angular library;
- introducing new popup, dialog or overlay features.

Any such work must be a separate explicitly approved phase.

## 13. Closure decision

Popup / Dialog / Overlay is considered **logical Starter Kit/Core-ready**.

The important reusable boundary already exists:

```text
Core popup runtime
  <- POPUP_REGISTRY
  <- host/application registrations
```

and the overlay/dialog utilities are already backend/domain neutral.

No further Popup / Dialog / Overlay code change is required before proceeding with the next Starter Kit area.
