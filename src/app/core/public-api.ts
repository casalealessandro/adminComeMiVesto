// DataGrid — supported host-facing runtime and contracts.
export * from './data-grid/data-grid.component';
export * from './data-grid/data-grid-provider';
export * from './data-grid/data-grid-detail-provider';
export * from './data-grid/data-grid-lookup-provider';
export * from './data-grid/models/data-grid.models';

// Forms — supported runtime, metadata and host contracts.
export * from './forms/dynamic-form/dynamic-form.component';
export * from './forms/form-builder/form-builder.component';
export * from './forms/form-list/app-form-list.component';
export * from './forms/models/dynamic-form-field';
export * from './forms/contracts/form-definition-repository';
export * from './forms/contracts/form-options-provider';

// Layout — host-facing page shell plus configuration/session contracts.
export * from './layout/anagrafica-wrapper/anagrafica-wrapper.component';
export * from './layout/contracts/navigation-registry';
export * from './layout/contracts/header-config';
export * from './layout/contracts/header-user-provider';
export * from './layout/contracts/layout-session-provider';

// Popup / Overlay / Dialogs — supported integration seams.
export * from './popup/popup.service';
export * from './popup/popup-registry';
export * from './popup/starter-kit-entry-components';
export * from './overlay/overlay.service';
export * from './dialogs/ui-dialogs';

// UI infrastructure — supported reusable UI surface.
export * from './ui/caption/caption.component';
export * from './ui/caption/toolbar-button';
export * from './ui/custom-scrollbar/custom-scrollbar.component';
export * from './ui/custom-scrollbar/scroll-interaction-policy';
