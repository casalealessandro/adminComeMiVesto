import { DynamicFormComponent } from "../forms/dynamic-form/dynamic-form.component";
import { ElementComponent } from "../forms/form-builder/element/element.component";
import { PopupRegistration } from './popup-registry';

export const starterKitEntryComponents: readonly PopupRegistration[] = [
  { name: "ElementComponent", component: ElementComponent },
  { name: "DynamicFormComponent", component: DynamicFormComponent },
];

// Historical export kept for compatibility with code that may still import entryComponents.
export const entryComponents = starterKitEntryComponents;
