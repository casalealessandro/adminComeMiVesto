# UI / Page Infrastructure Core — Phase F.1 correctness and lifecycle

## Base

F.1 is built on the F.0 characterization branch and does not reopen DataGrid, Forms, Popup/Overlay or Layout & Navigation behavior.

## Confirmed fixes

### Wrapper close-output contract

`CaptionComponent` exposes `emitChiusura`, while `AnagraficaWrapperComponent` historically listened to the misspelled `emettiChiusura` template event.

F.1 changes both wrapper bindings to `emitChiusura` and adds regression coverage proving the wrapper forwards that event through its existing public `emittChiusura` output.

The wrapper's public output name is intentionally not renamed in F.1.

### Wrapper timer lifecycle

The wrapper historically started a 60-second timer in its constructor and discarded the timeout handle.

F.1 retains the timer handle and clears it in `ngOnDestroy()`.

The 60-second auto-dismiss behavior itself is preserved.

### Template validation

`CUSTOM_ELEMENTS_SCHEMA` is removed from `AnagraficaWrapperComponent` after correcting the invalid Caption output binding. The wrapper imports its known standalone Angular children directly, so the schema is not required for the current template.

### Caption dead code

Unused Router/environment imports and the unused local `_tasto` class are removed. No Caption public input/output is renamed or removed.

## Search/button decision

F.0 identified that `onButtonChange()` emits `emitToolbarSearchInputChange`, while another public output named `emitToolbarButtonInput` also exists.

Consumer inspection in F.1 found that the active Users page enables `showButtonInput` and listens to the wrapper's `emitEventSearchInput` in order to call `filterUsers($event)`.

Therefore the current search-button emission is not treated as a bug. Changing it to `emitToolbarButtonInput` would break an active consumer.

F.1 explicitly preserves:

```text
search button -> Caption.emitToolbarSearchInputChange
              -> AnagraficaWrapper.emitEventSearchInput
              -> Users.filterUsers(...)
```

`emitToolbarButtonInput` / `emitEventButtonInputChange` remain historical compatibility surface for later boundary cleanup; they are not removed in F.1.

## Deferred findings

F.1 does not change:

- the dormant breadcrumb/help surface;
- the Font Awesome CDN link inside Caption;
- the historical `scrollHeigth` spelling;
- `CustomScrollbar -> OverlayService.closeOverlay()`;
- the second/footer Caption instance;
- dormant `getWindowHeight()` legacy calculations;
- `ToolbarButton` location inside `app.interface.ts`;
- visual layout, responsive behavior or CSS.

These remain candidates for F.2–F.4.
