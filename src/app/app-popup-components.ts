import { AffiliateProductFormHostComponent } from './views/affiliate-catalog/forms/affiliate-product-form-host.component';
import { PopupRegistration } from './core/public-api';
import { AffiliateFeedFormHostComponent } from './views/affiliate-catalog/forms/affiliate-feed-form-host.component';
import { AffiliateProgramFormHostComponent } from './views/affiliate-catalog/forms/affiliate-program-form-host.component';
import { AffiliateMappingRuleFormHostComponent } from './views/affiliate-catalog/components/mapping-rules/affiliate-mapping-rule-form-host.component';
import { AffiliateAiCreatorFormHostComponent } from './views/affiliate-catalog/forms/affiliate-ai-creator-form-host.component';
import { NotificationFormHostComponent } from './views/notifications/forms/notification-form-host.component';
import { StaticPageFormHostComponent } from './views/static-pages/forms/static-page-form-host.component';
import { OutfitReplacementPickerComponent } from './views/affiliate-catalog/components/outfit-preview/outfit-replacement-picker.component';

export const comeMiVestoPopupComponents: readonly PopupRegistration[] = [
  { name: 'AffiliateProductFormHostComponent', component: AffiliateProductFormHostComponent },
  { name: 'AffiliateFeedFormHostComponent', component: AffiliateFeedFormHostComponent },
  { name: 'AffiliateProgramFormHostComponent', component: AffiliateProgramFormHostComponent },
  { name: 'AffiliateAiCreatorFormHostComponent', component: AffiliateAiCreatorFormHostComponent },
  { name: 'AffiliateMappingRuleFormHostComponent', component: AffiliateMappingRuleFormHostComponent },
  { name: 'NotificationFormHostComponent', component: NotificationFormHostComponent },
  { name: 'StaticPageFormHostComponent', component: StaticPageFormHostComponent },
  { name: 'OutfitReplacementPickerComponent', component: OutfitReplacementPickerComponent },
];
