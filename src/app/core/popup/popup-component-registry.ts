import { Type } from '@angular/core';
import { DynamicFormComponent } from '../../components/dynamic-form/dynamic-form.component';
import { ElementComponent } from '../../views/form-builder/element/element.component';
import { OutfitProductsComponent } from '../../views/outfit-products/outfit-products.component';

export interface PopupComponentRegistration {
  name: string;
  component: Type<unknown>;
}

export const POPUP_COMPONENT_REGISTRY: PopupComponentRegistration[] = [
  { name: 'ElementComponent', component: ElementComponent },
  { name: 'DynamicFormComponent', component: DynamicFormComponent },
  { name: 'OutfitProductsComponent', component: OutfitProductsComponent }
];
