# UI / Page Infrastructure Core — Phase F.5 regression and closure

## Scope

F.5 closes Phase F after the characterization and stabilization completed in F.0–F.4.

This phase is intentionally a **regression/closure phase**, not another refactor. No production runtime behavior is redesigned here.

Baseline:

- `develop` @ `3720f6658beaf538ccc6a594101595a55eb42878`;
- Layout & Navigation Core already closed in Phase E;
- DataGrid Core was stabilized on `refactor/clean-admin-core`, but its dedicated Core abstractions/tests have not yet been reconciled into current `develop`;
- Forms Core / FormBuilder already stabilized before Phase F;
- Popup / Overlay Core already stabilized before Phase F;
- F.1 correctness/lifecycle merged;
- F.2 Page Toolbar boundary merged;
- F.3 Scroll interaction boundary merged;
- F.4 Page Shell cleanup merged.

## 1. Final composition

```text
Application / feature page
└── AnagraficaWrapperComponent
    ├── CaptionComponent
    │   └── ToolbarButton contract
    └── projected feature content
        ├── DataGridComponent
        │   └── CustomScrollbarComponent
        └── DynamicFormComponent
            └── CustomScrollbarComponent
                ├── generic `scrolled` output
                └── optional SCROLL_INTERACTION_POLICY
                    └── application binding → OverlayService.closeOverlay()
```

Popup remains a separate stabilized Core and keeps its own optional Caption footer usage.

## 2. Regression evidence matrix

| Area | Protected contract | Evidence at F.5 |
| --- | --- | --- |
| Caption / Page Toolbar | title, visible/disabled custom actions, add action, search delivery, closable action | `caption.component.spec.ts` |
| Page Shell | single Caption toolbar, subtitle, tip, spinner text, projected content, event forwarding, timer cleanup | `anagrafica-wrapper.component.spec.ts` |
| Scroll primitive | projected content, historical `scrollHeigth`, generic scroll event, optional policy delegation | `custom-scrollbar.component.spec.ts` |
| DynamicForm | metadata/form contracts plus use of shared scroll primitive at historical 700px contract | `dynamic-form.component.spec.ts` + F.5 assertion |
| Forms Core | integration behavior across DynamicForm/form metadata | existing `forms-core.integration.spec.ts` |
| Popup Core | popup content/wrapper characterization retained | existing popup specs; no F.5 production change |
| DataGrid Core | dedicated engine/provider/filter/lookup abstractions and focused specs exist on `refactor/clean-admin-core`; current `develop` still uses the stabilized DataGrid runtime but has not yet reconciled that branch-only Core test/abstraction set | verified branch comparison; reconciliation required before Starter Kit extraction |
| Layout / responsive shell | over/side/push shell modes and mobile/tablet/desktop baseline | Phase E.5 characterization/fixes; F.0–F.5 introduce no responsive CSS redesign |

## 3. F.5 focused addition

F.5 adds one integration-level assertion to `DynamicFormComponent`:

- DynamicForm still renders the shared `CustomScrollbarComponent`;
- the historical height contract remains `scrollHeigth = 700`.

This closes the most important consumer link introduced by F.3 without modifying DynamicForm production code.

## 4. Responsive closure rationale

Responsive shell behavior was characterized and corrected in Phase E.5 for desktop/tablet/mobile breakpoints.

Phase F deliberately did not redesign responsive CSS. In particular:

- F.1 changed correctness/lifecycle only;
- F.2 moved the toolbar contract and deprecated inactive API without visual redesign;
- F.3 changed scroll side-effect ownership without changing scroll CSS;
- F.4 removed dead page-shell code and a redundant empty footer Caption without CSS changes;
- F.5 adds regression evidence only.

Therefore F.5 does not reopen the E.5 responsive architecture. The existing E.5 responsive baseline remains the reference for desktop/tablet/mobile behavior.

A browser-level visual/E2E matrix is still valuable for future Starter Kit release qualification, but it is not a prerequisite for declaring the internal UI Infrastructure Core stabilized because no Phase F change introduces a new breakpoint or responsive mode.

## 5. Compatibility surface intentionally retained

The following historical API is **not removed in F.5**:

- `CustomScrollbarComponent.scrollHeigth` — misspelled but actively compatible;
- `CaptionComponent.isFooter` — still used by Popup Core;
- deprecated Caption breadcrumb/help inputs/outputs — inactive but retained for compatibility;
- historical wrapper output names such as `emittChiusura` / `emittEventButton`;
- `emitToolbarButtonInput` / wrapper button-input forwarding surface;
- active search semantics through `emitToolbarSearchInputChange`.

These are extraction/compatibility decisions, not closure defects.

## 6. Known debt carried into Starter Kit extraction

### UI-FUTURE-01 — Caption external Font Awesome delivery

`CaptionComponent` still loads Font Awesome 5.15.4 from a CDN in its template. This should be addressed as a packaging/dependency decision, not mixed into Phase F stabilization.

### UI-FUTURE-02 — deprecated breadcrumb/help API

Inactive breadcrumb/help members remain deprecated. They can be removed only after the extracted Starter Kit public API and compatibility strategy are defined.

### UI-FUTURE-03 — historical naming

`scrollHeigth` and some wrapper outputs carry historical naming. Rename only through an explicit compatibility/migration layer.

### UI-FUTURE-04 — DataGrid Core reconciliation

The dedicated DataGrid Core work is **not missing**: it exists on `refactor/clean-admin-core` and includes, among other pieces, `data-grid-engine`, provider abstractions, filter/lookup/detail contracts, `data-grid.component.spec.ts`, focused behavior specs, and a dedicated DataGrid CI workflow.

Those branch-only changes must not be merged wholesale because `refactor/clean-admin-core` has diverged from current `develop`. Before Starter Kit extraction, perform a dedicated reconciliation phase that classifies and selectively ports only the still-valid DataGrid Core work and repository-cleanup changes.

### UI-FUTURE-05 — clean-admin branch reconciliation

`refactor/clean-admin-core` and `develop` are divergent. The branch contains valuable reusable-Core work but also historical application removals and repository cleanup. Treat it as a source for selective recovery, not as a merge candidate.

## 7. Phase F exit criteria

Phase F can be declared **CLOSED** when:

1. the F.5 branch builds successfully in the normal PR workflow;
2. the existing focused regression suites remain source-compatible;
3. DynamicForm → CustomScrollbar compatibility is explicitly protected;
4. no production runtime files are changed by F.5;
5. the remaining compatibility/dependency debt is documented rather than silently refactored;
6. DataGrid branch divergence is explicitly recorded so it cannot be mistaken for missing characterization.

## 8. Handoff — reconciliation before extraction

After F.5, the next step is **not yet the repository split**.

First perform a conservative reconciliation of `refactor/clean-admin-core` against current `develop`:

```text
refactor/clean-admin-core
        │
        ├── reusable DataGrid Core work ───────┐
        ├── repository cleanup ────────────────┤ selective review/port
        └── historical app-specific changes ──┘
                                               ↓
                                         current develop
```

Only after that reconciliation should work move to **Starter Kit extraction / packaging**.

The extraction phase should then classify the current repository into three layers:

```text
Admin Core / Starter Kit
├── reusable UI/core infrastructure
├── application boundary contracts/configuration
└── generic services/primitives

ComeMiVesto application layer
├── domain pages
├── domain services/models
└── ComeMiVesto registrations/configuration
```

The first extraction step remains an inventory and dependency map, not a repository split or mass move.