# UI / Page Infrastructure Core — Phase F.4 page shell cleanup

## Scope

F.4 performs the final conservative cleanup of the reusable page shell before the F.5 regression/closure phase.

The scope is intentionally limited to `AnagraficaWrapperComponent` and does not reopen Popup Core, DataGrid, Forms, Layout & Navigation or responsive behavior.

## Confirmed cleanup

### Redundant wrapper footer Caption

`AnagraficaWrapperComponent` historically rendered a second `CaptionComponent` after the projected page content with:

```html
<app-caption [isClosable]="false" [isFooter]="true"></app-caption>
```

Current `CaptionComponent` template and SCSS do not branch on `isFooter`, and the wrapper footer Caption had no title, actions, projected content or active behavior.

F.4 removes that second instance and protects the simplified shell with a regression test asserting that the wrapper renders exactly one page toolbar Caption.

This decision is deliberately limited to the page shell. Popup footer Caption usage is left unchanged because Popup Core is already stabilized and is outside F.4 scope.

### Dormant height calculation

`getWindowHeight()` was not invoked: the only call in `ngAfterViewInit()` had already been commented out.

The method also depended on historical layout assumptions that no longer belong to the current shell:

- `document.getElementById('header')`;
- fixed `footerHeight = 200`;
- commented legacy menu-height calculations;
- delayed mutation of `heightWrap`.

`heightWrap` had no active consumer outside that dormant method.

F.4 removes:

- `heightWrap`;
- the empty `ngAfterViewInit()` hook;
- `getWindowHeight()` and its nested timeout.

The active public `anaHeight` input is preserved and continues to drive the wrapper height exactly as before.

## Preserved compatibility

F.4 does not remove or rename:

- `AnagraficaWrapperComponent`;
- `anaHeight`;
- Caption/Page Toolbar public actions;
- wrapper add/search/button outputs;
- the 60-second tip auto-dismiss behavior;
- deprecated breadcrumb/help compatibility inputs;
- `CaptionComponent.isFooter`, because popup consumers still reference it;
- popup footer Caption instances.

## Regression focus

The wrapper tests continue to protect:

- configured caption;
- subtitle/tip/loading state;
- projected content;
- custom toolbar buttons;
- add/custom/search/button-input forwarding;
- close forwarding contract;
- auto-dismiss timer cleanup;
- exactly one Caption instance in the reusable page shell.

## Explicit non-goals

F.4 does not:

- redesign the page shell;
- change CSS or responsive breakpoints;
- alter popup composition;
- remove deprecated Caption breadcrumb/help API;
- remove `isFooter` globally;
- rename historical wrapper outputs;
- change DataGrid, Forms, Scroll or Overlay behavior;
- package or publish the Starter Kit.

## Next step

F.5 is the UI Infrastructure regression/closure phase. It should validate representative pages and components across desktop/tablet/mobile and close Phase F before Starter Kit packaging/extraction work begins.
