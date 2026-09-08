import { PopupRegistration } from './services/popup-registry';
import { OutfitProductsComponent } from './views/outfit-products/outfit-products.component';
import { ProductFromFeedComponent } from './views/outfit-products/product-from-feed/product-from-feed.component';

export const comeMiVestoPopupComponents: readonly PopupRegistration[] = [
  { name: 'ProductFromFeedComponent', component: ProductFromFeedComponent },
  { name: 'OutfitProductsComponent', component: OutfitProductsComponent },
];
