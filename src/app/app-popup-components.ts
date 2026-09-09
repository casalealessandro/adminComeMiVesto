import { PopupRegistration } from './core/public-api';
import { AffiliateFeedFormHostComponent } from './views/affiliate-catalog/forms/affiliate-feed-form-host.component';
import { AffiliateProgramFormHostComponent } from './views/affiliate-catalog/forms/affiliate-program-form-host.component';
import { OutfitProductsComponent } from './views/outfit-products/outfit-products.component';

export const comeMiVestoPopupComponents: readonly PopupRegistration[] = [
  { name: 'AffiliateFeedFormHostComponent', component: AffiliateFeedFormHostComponent },
  { name: 'AffiliateProgramFormHostComponent', component: AffiliateProgramFormHostComponent },
  { name: 'OutfitProductsComponent', component: OutfitProductsComponent },
];
