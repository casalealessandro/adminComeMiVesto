# UI / Page Infrastructure Core — Phase F.2 Page Toolbar boundary

## Goal

F.2 establishes a reusable Page Toolbar contract without changing current page, popup, DataGrid or feature behavior.

The active boundary is now:

```text
ToolbarButton core contract
        ↓
CaptionComponent
        ↓
AnagraficaWrapperComponent
        ↓
feature pages
```

## ToolbarButton extraction

`ToolbarButton` previously lived inside the broad `src/app/interface/app.interface.ts` file together with domain/user and DataGrid-oriented contracts.

F.2 moves the interface to:

`src/app/components/caption/toolbar-button.ts`

`CaptionComponent` and `AnagraficaWrapperComponent` import the contract directly from the Page Toolbar area.

To preserve existing feature consumers, `app.interface.ts` re-exports `ToolbarButton`. Existing imports such as:

```ts
import { Colonne, ToolbarButton } from '../../interface/app.interface';
```

remain valid and do not need a mass migration in F.2.

This creates a compatibility seam: new Core code can use the dedicated contract while legacy/application consumers keep their current import path until a later cleanup is justified.

## Caption active surface

The current active toolbar behavior remains unchanged:

- page title;
- custom action buttons;
- built-in add action;
- search input and search button;
- close action;
- optional CSS class;
- footer/modal visual mode already used by current consumers.

F.2 does not rename any active input/output and does not alter event semantics.

## Historical breadcrumb/help surface

F.0 established that breadcrumb markup was already fully commented out and help rendering had no active template behavior.

F.2:

- removes the dead commented breadcrumb HTML only;
- marks breadcrumb/help inputs and outputs as deprecated in source documentation;
- keeps those public members available for compatibility;
- does not remove the popup `[help]` binding or wrapper `helpDoc` / `breadcrumbNavigation` surface yet.

Physical API removal is deferred until all current develop consumers can be proven independent from those compatibility members.

## Search behavior remains unchanged

F.1 established that Users depends on:

```text
search button
  -> Caption.emitToolbarSearchInputChange
  -> AnagraficaWrapper.emitEventSearchInput
  -> Users.filterUsers(...)
```

F.2 preserves this exactly.

`emitToolbarButtonInput` remains compatibility surface and is not repurposed.

## Explicit non-goals

F.2 does not:

- rename `CaptionComponent`;
- rename `AnagraficaWrapperComponent`;
- migrate every feature import to the new ToolbarButton path;
- remove the compatibility re-export from `app.interface.ts`;
- remove breadcrumb/help public members;
- change Font Awesome delivery;
- remove the footer Caption;
- change CSS or responsive behavior;
- change CustomScrollbar / OverlayService;
- change DataGrid, Forms, Popup or Layout behavior;
- package/publish the starter kit.

## Exit criterion

F.2 is complete when the reusable toolbar contract has an application-neutral home, Core components depend on that contract directly, existing application imports remain source-compatible, and the inactive breadcrumb/help surface is clearly separated from the active toolbar contract without a runtime behavior change.
