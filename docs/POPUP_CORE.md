# Popup Core — Phase D.0 characterization baseline

## Scope

Phase D.0 freezes and documents the current UI interaction behavior before any refactor or correctness fix.

This phase intentionally changes **tests and documentation only**. Production behavior remains untouched.

The current interaction layer is made of three separate mechanisms:

1. `PopUpService` + popup wrapper/content for modal workflows with runtime components.
2. `OverlayService` + `OverlayComponent` for positioned `TemplateRef` overlays/popovers.
3. `widgets/ui-dialogs.ts` for simple imperative `alert`, `confirm` and `showPopover` helpers.

These mechanisms are characterized separately. Phase D.0 does not merge or replace them.

## Popup runtime contract

Current popup flow:

```text
caller
  -> PopUpService.setNewPopUp(...)
  -> popupsSet
  -> PopupWrapperComponent
  -> NicaPopupContentComponent
  -> PopUpService.getComponentByName(...)
  -> ViewContainerRef.createComponent(...)
  -> runtime component instance
```

### Current capabilities

- multiple popup identities can coexist;
- popup identity is currently the pair `id + componentName` when opening/updating;
- popup state uses the historical actions `added`, `update`, `remove`, `setted`;
- wrapper animation timing is part of the observed behavior;
- runtime components are resolved through the popup registry by their historical string names;
- `dataToSend` is assigned to runtime `itemData`;
- `instancedData` keys are assigned directly to the runtime component instance;
- runtime `EventEmitter` properties are discovered dynamically and forwarded through `PopUpService.outputComponent`;
- forwarded object events are enriched with `componentName`, `accessoringData`, `guid` and `name`;
- boolean events are wrapped in the same historical metadata envelope;
- popup close by guid publishes the historical `stochiudendo` event;
- simple close by component keeps the historical delayed removal.

## Characterization tests added in Phase D.0

### `PopUpService`

Covered behavior:

- new popup registration;
- update of an existing popup with matching identity;
- independent popup identities;
- component registry lookup for existing core registrations;
- shared output stream;
- close by guid;
- delayed close by component name;
- close all.

### `PopupWrapperComponent`

The stale pre-standalone/Nica test has been replaced with characterization of:

- `added -> setted` transition;
- multiple popup order;
- delayed update replacement;
- delayed remove/fade-out behavior.

### `NicaPopupContentComponent`

Characterized without changing runtime code:

- component resolution and dynamic creation;
- `itemData` propagation;
- `instancedData` propagation;
- object `EventEmitter` forwarding;
- boolean `EventEmitter` wrapping;
- guid-based close and closing event.

### Overlay

`OverlayService` and `OverlayComponent` now characterize:

- payload forwarding;
- current overlay index;
- open position/template/backdrop flag;
- service-driven close;
- component-driven delayed close.

The previous stale overlay component spec referenced a component/file name that no longer exists and has been replaced.

### Simple dialogs

`ui-dialogs.spec.ts` characterizes the currently used simple dialog behavior:

- alert rendering and positive callback;
- confirm positive callback;
- confirm negative callback.

`showPopover` is documented but intentionally not changed in D.0.

## Architectural boundary discovered

The popup runtime is conceptually reusable, but its original registry was not application-neutral.

The original `entryComponents` mixed reusable/core candidates and ComeMiVesto-specific components.

Core/reusable candidates currently include:

- `DynamicFormComponent`;
- `ElementComponent`.

ComeMiVesto-specific registrations currently include:

- `ProductFromFeedComponent`;
- `OutfitProductsComponent`.

## Phase D.3 — starter-kit registry boundary

D.3 keeps the historical dynamic popup mechanism but moves registry ownership to the application composition root.

```text
Popup Core
   -> POPUP_REGISTRY contract
       <- starter-kit registrations
       <- ComeMiVesto application registrations
```

Implementation boundary:

- `PopUpService` depends only on `POPUP_REGISTRY` and `PopupRegistration`;
- starter-kit registrations live in `services/entryComponents.ts`;
- ComeMiVesto registrations live in `app-popup-components.ts`;
- `app.config.ts` combines both sets and provides the registry through Angular DI;
- existing string names remain unchanged;
- callers still use `setNewPopUp(...)` exactly as before;
- popup content still creates the resolved component dynamically with `ViewContainerRef.createComponent(...)`;
- GUID behavior, shared output stream, EventEmitter discovery and metadata envelopes remain unchanged.

This removes the former dependency cycle in which `OutfitProductsComponent` depended on `PopUpService`, while `PopUpService` imported a registry that imported `OutfitProductsComponent` again.

## Phase D.4 — interaction stabilization

D.4 keeps the existing popup, overlay and simple-dialog architectures and only hardens user interaction behavior.

Characterized and stabilized behavior:

- a newly rendered popup receives focus without changing `setNewPopUp(...)`;
- closing a popup restores focus to the element that was active before opening it;
- `Escape` closes only the topmost popup and only when that popup is closable;
- popup closing through `Escape` preserves the historical `stochiudendo` event path;
- duplicate popup DOM ids are removed while the GUID remains on the dialog root;
- popup dialog markup exposes `aria-modal` and an accessible label;
- overlay click-outside no longer relies on the historical 600 ms delay;
- overlay animation manipulates its own `ViewChild` instead of a global `document.querySelector`;
- `showBgOverlay` renders the already-existing backdrop only when requested;
- component-driven overlay close emits the existing `closed` output;
- `alert` and `confirm` keep their callback API while adding dialog semantics, initial focus and focus restoration;
- `Escape` on `confirm` follows the existing negative/cancel path.

D.4 explicitly does not change:

- popup registry or dynamic component resolution;
- GUID identity semantics;
- `BehaviorSubject` popup state;
- runtime `EventEmitter` discovery or metadata envelopes;
- existing popup consumer call sites;
- visual design or animation timings;
- `showPopover` behavior;
- Forms Core, FormBuilder or ComeMiVesto business behavior.

## Findings to validate/fix after the baseline

The following are findings from source analysis. They are intentionally **not fixed in Phase D.0**.

### D.1 correctness candidates

1. **Closable contract mismatch**
   - `PopUpService` stores `isClosablePopUp`.
   - popup content reads `infoPopUp.isClosable`.

2. **Width contract mismatch**
   - `PopUpService` can set mobile width to the CSS string `100vw`.
   - popup content appends `px` to `popUpWidth`, producing a potentially invalid `100vwpx` value.

3. **Unknown registry component handling**
   - `getComponentByName` / `isComponentExistByName` use non-null assertions after `find`.
   - unknown component names are not handled deterministically.

4. **Overlay backdrop capability is currently disabled in the template**
   - `showBgOverlay` exists in the public payload;
   - the backdrop template is guarded by `*ngIf="false"`.

5. **Overlay `closed` output is declared but not part of the current close path**.

### D.2 lifecycle/event integrity candidates

1. Popup consumers frequently subscribe to the shared `outputComponent` stream per open operation.
2. The current service does not scope or complete those caller subscriptions.
3. `getOutputComponent(guid)` creates an internal subscription without an explicit teardown after resolve.
4. Popup arrays are intentionally mutated in place and emitted with historical ordering; this must not be modernized blindly.

These behaviors require targeted tests before any lifecycle change.

## Explicit non-goals for Phase D.0

Phase D.0 does not:

- migrate to `MatDialog`;
- migrate to Angular CDK Overlay;
- replace RxJS with Signals;
- refactor `PopUpService`;
- change guid semantics;
- change `EventEmitter` output semantics;
- merge popup and overlay implementations;
- remove `ui-dialogs`;
- remove historical/Nica code;
- change popup visual design;
- change Forms Core or FormBuilder behavior.

## Next phase

After the characterization suite is green, Phase D.1 should contain only minimal correctness changes protected by these tests, starting from the three lowest-risk contract issues:

1. closable property normalization;
2. width value normalization without changing existing numeric callers;
3. safe unknown-component lookup.

Each change should be small, independently testable and preserve all existing successful caller flows.
