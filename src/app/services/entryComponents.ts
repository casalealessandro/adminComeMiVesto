import { DynamicFormComponent } from "../components/dynamic-form/dynamic-form.component";
import { ElementComponent } from "../views/form-builder/element/element.component";
import { PopupRegistration } from './popup-registry';

export const starterKitEntryComponents: readonly PopupRegistration[] = [
  { name: "ElementComponent", component: ElementComponent },
  { name: "DynamicFormComponent", component: DynamicFormComponent },
];

// Historical export kept for compatibility with code that may still import entryComponents.
export const entryComponents = starterKitEntryComponents;
