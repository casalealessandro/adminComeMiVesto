# UI / Page Infrastructure Core — Phase F.0 characterization baseline

## Scope

Phase F starts only after Layout & Navigation Core Phase E has been closed.

F.0 characterizes the remaining shared page/UI infrastructure before any cleanup or Starter Kit extraction. It intentionally changes **tests and documentation only**.

The first runtime slice is:

```text
Feature page
├── AnagraficaWrapperComponent
│   ├── CaptionComponent (page title / actions)
│   ├── subtitle / tip / loading text
│   └── projected page content
└── shared content components
    └── CustomScrollbarComponent
        └── OverlayService side effect on scroll
```

Already stabilized cores are not reopened here:

- DataGrid Core;
- Forms Core / FormBuilder;
- Popup / Overlay Core behavior;
- Layout & Navigation Core.

F.0 only records how the remaining shared infrastructure composes those cores today.

## 1. CaptionComponent — current contract

`CaptionComponent` is the current reusable page-action surface.

### Inputs currently exposed

- `caption`;
- `cssClass`;
- `showBreadcrumb`;
- `breadcrumbNavigation`;
- `isFooter`;
- `isClosable`;
- `addButtonShow`;
- `showSearchInput`;
- `showButtonInput`;
- `customToolbarButtons`;
- `help`;
- `idHelper`.

### Outputs currently exposed

- `emitHelperClick`;
- `emitChiusura`;
- `emitAddEvent`;
- `emitToolbarButtonClick`;
- `emitToolbarSearchInputChange`;
- `emitToolbarButtonInput`;
- `emitBreadCrumbClick`.

### Active behavior characterized in F.0

- renders the configured page title;
- renders only visible custom toolbar buttons;
- preserves the configured disabled state;
- emits the selected `ToolbarButton` when a custom action is clicked;
- exposes the historical built-in `addButton` descriptor;
- emits the current search text when the search button is pressed;
- exposes the close action only while `isClosable` is true.

`ToolbarButton` is currently declared inside the broad `app.interface.ts` file and is shared by Caption and AnagraficaWrapper.

## 2. Caption findings intentionally not fixed in F.0

### F-CAP-01 — dead imports / legacy local class

The component imports `Router`, `ActivatedRoute`, `NavigationExtras` and `environment` without using them. The local `_tasto` class is also unused.

These are cleanup candidates, not F.0 changes.

### F-CAP-02 — breadcrumb/help surface is mostly historical

The template contains the breadcrumb markup only inside a large HTML comment. `onBreadCrumbClick`, `onBreadCrumbRemoveClick` and `emitHelpClick` currently have no active behavior.

The related inputs/outputs therefore exist in the public surface without an active rendered capability.

### F-CAP-03 — external Font Awesome stylesheet inside component template

`caption.component.html` loads Font Awesome 5.15.4 directly through a CDN `<link>`.

This is not an application-neutral component dependency and should be evaluated separately before Starter Kit packaging. F.0 does not remove or relocate it.

### F-CAP-04 — search/button output mismatch

`onButtonChange()` reads `inputValue` but emits `emitToolbarSearchInputChange`.

`emitToolbarButtonInput` exists but the current Caption implementation does not emit it from this action. This matters because AnagraficaWrapper exposes a separate `emitEventButtonInputChange` path expecting the Caption output.

No semantic correction is made until the consumers are characterized.

### F-CAP-05 — text input has no direct change emission

The template binds the input through `[(ngModel)]`, but does not bind `onInputChange()` to an input/change event. Search emission therefore currently happens through the adjacent button path, not while typing.

This behavior is frozen rather than changed in F.0.

## 3. AnagraficaWrapperComponent — current page shell contract

The wrapper currently composes:

- a top `CaptionComponent`;
- optional subtitle;
- optional `tip` alert;
- a textual loading state;
- projected feature content;
- a second Caption instance configured as footer.

It forwards the top Caption action/search events to feature pages and is already used as the shared page shell.

Existing E.4 characterization already protects:

- caption/subtitle/tip/loading rendering;
- projected content;
- custom toolbar configuration;
- add/custom button forwarding;
- search/button-input forwarding at component-output level.

### F-WRAP-01 — close output naming mismatch

The wrapper template listens to `(emettiChiusura)`, while `CaptionComponent` declares `emitChiusura`.

This is a confirmed contract mismatch in source. F.0 documents it but does not fix it.

### F-WRAP-02 — historical footer Caption

The second Caption is always rendered with `isFooter=true`, but the current Caption template does not branch on `isFooter`; the distinction currently lives only in the public API / styles.

The real runtime usefulness of this footer instance must be verified before deletion or extraction.

### F-WRAP-03 — timer lifecycle

The wrapper starts a 60-second `setTimeout` in its constructor to clear `tip`. The timer is not retained or cancelled on destroy.

This is a lifecycle candidate for F.1, not changed in F.0.

### F-WRAP-04 — dormant window-height calculation references removed layout concepts

`getWindowHeight()` is not active from `ngAfterViewInit()`. The method still calculates a fixed `footerHeight = 200` and contains commented historical menu calculations.

It is classified as legacy/dead-code candidate pending reachability confirmation.

### F-WRAP-05 — `CUSTOM_ELEMENTS_SCHEMA`

The wrapper opts into `CUSTOM_ELEMENTS_SCHEMA` although its direct child components are known standalone Angular components. This can reduce template validation value and is especially relevant around the current output naming mismatch.

F.0 does not remove the schema because compilation/runtime impact must be proven first.

## 4. CustomScrollbarComponent — current contract

The component is a projected-content scroll container with a configurable maximum height.

Current consumers found in active source include:

- Users;
- DynamicForm;
- DataGrid.

F.0 characterizes:

- projected content is preserved;
- `scrollHeigth` is applied as `max-height` in pixels;
- every scroll event calls `OverlayService.closeOverlay()`.

### F-SCROLL-01 — UI primitive is coupled to global OverlayService

Although the component looks generic, scrolling always closes the shared application overlay.

Therefore the current component is **not yet an independent Starter Kit primitive**: it owns a global interaction side effect.

This coupling must be preserved until DataGrid, DynamicForm and Users behavior is checked against it.

### F-SCROLL-02 — historical public API spelling

The input is named `scrollHeigth`, not `scrollHeight`.

Because active consumers use the historical spelling, a direct rename would be breaking. Any normalization must use a compatibility path rather than a blind rename.

## 5. Boundary assessment after F.0

### Strong Starter Kit candidates

- Caption/page toolbar rendering;
- ToolbarButton contract;
- page shell / projected content composition;
- generic scroll-container rendering.

### Still coupled / requires stabilization

- Caption historical breadcrumb/help API;
- Caption icon/font delivery;
- wrapper close-event path;
- wrapper timer/dead layout calculations;
- CustomScrollbar → OverlayService behavior;
- `ToolbarButton` living inside a broad mixed application interface file.

### Application-specific behavior

No ComeMiVesto domain entity is directly required by Caption or CustomScrollbar. This is positive: the remaining coupling is mainly historical UI/infrastructure coupling rather than outfit/user business logic.

## 6. Explicit non-goals of F.0

F.0 does not:

- rename `AnagraficaWrapperComponent`;
- rename `scrollHeigth`;
- change Caption inputs or outputs;
- fix the close-output typo;
- alter search semantics;
- remove breadcrumb/help APIs;
- remove `CUSTOM_ELEMENTS_SCHEMA`;
- remove the footer Caption;
- change the tip timer;
- decouple OverlayService from CustomScrollbar;
- move ToolbarButton to a new file;
- change DataGrid, DynamicForm or Users;
- change Popup/Overlay behavior;
- redesign page UI;
- change CSS/responsive behavior;
- package or publish the Starter Kit.

## 7. Planned Phase F roadmap

1. **F.1 — correctness and lifecycle**
   - verify/fix the wrapper close-output contract;
   - characterize the search/button output mismatch against real consumers, then fix only if confirmed;
   - clean timer lifecycle safely;
   - prove whether dormant wrapper layout code and `CUSTOM_ELEMENTS_SCHEMA` can be removed.

2. **F.2 — Caption / Page Toolbar Core boundary**
   - separate the active toolbar contract from historical breadcrumb/help residue;
   - evaluate moving `ToolbarButton` into a small UI-specific contract without breaking consumers;
   - keep current page actions and visual behavior unchanged.

3. **F.3 — Scroll primitive boundary**
   - characterize why DataGrid, DynamicForm and Users depend on overlay-close-on-scroll;
   - separate generic scrolling from application/global-overlay policy if the evidence supports it;
   - preserve a compatibility path for `scrollHeigth`.

4. **F.4 — page shell cleanup**
   - evaluate footer Caption usefulness;
   - remove only proven unreachable historical page-shell code;
   - preserve feature page composition and mobile behavior.

5. **F.5 — UI Infrastructure regression / closure**
   - validate representative pages using Caption, wrapper and scrollbar on desktop/tablet/mobile;
   - close the UI Infrastructure Core before beginning packaging/extraction work.

## F.0 exit criterion

F.0 is complete when the current Caption and CustomScrollbar contracts are protected by focused tests, the wrapper's existing characterization is linked into this map, and the remaining defects/couplings are documented without changing production runtime behavior.
