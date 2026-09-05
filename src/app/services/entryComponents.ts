import { DynamicFormComponent } from '../components/dynamic-form/dynamic-form.component';
import { ElementComponent } from '../views/form-builder/element/element.component';
import { OutfitProductsComponent } from '../views/outfit-products/outfit-products.component';

export const entryComponents = [
  { name: 'ElementComponent', component: ElementComponent },
  { name: 'DynamicFormComponent', component: DynamicFormComponent },
  { name: 'OutfitProductsComponent', component: OutfitProductsComponent }
];
