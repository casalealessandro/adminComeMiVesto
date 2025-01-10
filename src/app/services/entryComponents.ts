import { DynamicFormComponent } from "../components/dynamic-form/dynamic-form.component";
import { ElementComponent } from "../views/form-builder/element/element.component";
import { OutfitProductsComponent } from "../views/outfit-products/outfit-products.component";
import { ProductFromFeedComponent } from "../views/outfit-products/product-from-feed/product-from-feed.component";

export const entryComponents= [
    
    { name: "ElementComponent", component: ElementComponent },
    { name: "DynamicFormComponent", component: DynamicFormComponent },
    { name: "ProductFromFeedComponent", component: ProductFromFeedComponent },
    { name: "OutfitProductsComponent", component: OutfitProductsComponent },

   

  ]