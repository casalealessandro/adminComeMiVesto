import { PopupRegistration } from './core/popup/popup-registry';
import { AffiliateFeedFormHostComponent } from './views/affiliate-catalog/forms/affiliate-feed-form-host.component';
import { AffiliateProgramFormHostComponent } from './views/affiliate-catalog/forms/affiliate-program-form-host.component';
import { OutfitProductsComponent } from './views/outfit-products/outfit-products.component';
import { ProductFromFeedComponent } from './views/outfit-products/product-from-feed/product-from-feed.component';

export const comeMiVestoPopupComponents: readonly PopupRegistration[] = [
  { name: 'AffiliateFeedFormHostComponent', component: AffiliateFeedFormHostComponent },
  { name: 'AffiliateProgramFormHostComponent', component: AffiliateProgramFormHostComponent },
  { name: 'ProductFromFeedComponent', component: ProductFromFeedComponent },
  { name: 'OutfitProductsComponent', component: OutfitProductsComponent },
];
