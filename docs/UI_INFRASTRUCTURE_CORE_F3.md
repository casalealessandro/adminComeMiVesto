# UI / Page Infrastructure Core — Phase F.3 scroll primitive boundary

## Goal

F.3 separates the generic scroll-container primitive from the application/global overlay policy without changing the current runtime behavior of existing consumers.

The baseline before F.3 was:

```text
CustomScrollbarComponent
  -> scroll event
  -> OverlayService.closeOverlay()
```

That made a visually generic component depend directly on the global overlay system.

## Current consumers verified

Current source inspection shows two direct runtime consumers:

- `DataGridComponent`;
- `DynamicFormComponent`.

The current `UsersComponent` no longer embeds `CustomScrollbarComponent` directly. Desktop Users renders `DataGridComponent`, while mobile renders cards. This updates the older F.0 map, which reflected a previous Users template.

## F.3 boundary

The new flow is:

```text
CustomScrollbarComponent
  -> emits `scrolled`
  -> optionally delegates to SCROLL_INTERACTION_POLICY

Application configuration
  -> provides SCROLL_INTERACTION_POLICY
  -> implementation closes OverlayService
```

`CustomScrollbarComponent` therefore knows only a generic interaction-policy contract and no longer imports or injects `OverlayService`.

## Runtime compatibility

`app.config.ts` provides the current application policy:

```text
SCROLL_INTERACTION_POLICY
  -> OverlayService.closeOverlay()
```

Because the provider is application-wide, existing DataGrid and DynamicForm scroll behavior remains unchanged without modifying their templates or component APIs.

This is intentionally preferable to adding overlay-specific inputs or directives to each consumer: the generic primitive stays application-neutral and the existing global behavior remains centralized at the application boundary.

## Public scroll contract

F.3 adds:

- `@Output() scrolled: EventEmitter<Event>`

The historical input remains unchanged:

- `scrollHeigth`

The misspelled public input is not renamed in F.3 because active consumers still use it and a direct rename would be breaking.

## Tests

The focused scrollbar regression now proves that:

- projected content is preserved;
- `scrollHeigth` still controls `max-height`;
- the component works with no application policy configured;
- scroll events are exposed through the generic `scrolled` output;
- when a policy is configured, the scroll event is delegated to that policy.

The component tests no longer require or mock `OverlayService`.

## Explicit non-goals

F.3 does not:

- rename `scrollHeigth`;
- change DataGrid behavior;
- change DynamicForm behavior;
- change Users behavior;
- modify OverlayService semantics;
- change overlay rendering or positioning;
- change scroll CSS or responsive behavior;
- introduce a new scrollbar implementation;
- modify Caption/Page Toolbar behavior;
- remove the application-level close-overlay-on-scroll policy.

## Exit criterion

F.3 is complete when the scrollbar primitive has no direct OverlayService dependency, the historical runtime close-on-scroll behavior is preserved through an application-level policy provider, and focused tests protect the generic policy boundary.
