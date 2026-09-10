import { provideRouter, Routes } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { AppFormListComponent, FormBuilderComponent } from './core/public-api';
import { UsersComponent } from './views/users/users.component';
import { OutfitsComponent } from './views/outfits/outfits.component';
import { OutfitCategoryComponent } from './views/outfit-category/outfit-category.component';
import { OutfitProductsComponent } from './views/outfit-products/outfit-products.component';
import { OutfitFormComponent } from './views/outfits/outfit-form/outfit-form.component';
import { authGuard } from './auth.guard';
import { LoginComponent } from './views/login/login.component';
import { AccessDeniedComponent } from './views/access-denied/access-denied.component';
import { ColorsComponent } from './views/colors/colors.component';
import { ReportsComponent } from './views/reports/reports.component';
import { AffiliateCatalogComponent } from './views/affiliate-catalog/affiliate-catalog.component';
import { AffiliateCatalogAuditComponent } from './views/affiliate-catalog/components/audit/affiliate-catalog-audit.component';
import { AffiliateProgramsComponent } from './views/affiliate-catalog/components/programs/affiliate-programs.component';
import { AffiliateFeedsComponent } from './views/affiliate-catalog/components/feeds/affiliate-feeds.component';
import { AffiliateProductsComponent } from './views/affiliate-catalog/components/products/affiliate-products.component';
import { AffiliateProductDetailComponent } from './views/affiliate-catalog/components/products/affiliate-product-detail.component';
import { AffiliateSyncRunsComponent } from './views/affiliate-catalog/components/sync-runs/affiliate-sync-runs.component';
import { AffiliateSyncRunDetailComponent } from './views/affiliate-catalog/components/sync-runs/affiliate-sync-run-detail.component';


export const routes:Routes = [
    { path: 'dashboard', component: DashboardComponent,canActivate:[authGuard]  },
    { path: 'utenti', component: UsersComponent,canActivate:[authGuard] },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'login', component: LoginComponent},
    { path: 'access-denied', component: AccessDeniedComponent},
    { path: 'colors', component: ColorsComponent, canActivate:[authGuard]},
    { path: 'reports', component: ReportsComponent, canActivate:[authGuard]},
    {
      path: 'affiliate-catalog',
      component: AffiliateCatalogComponent,
      canActivate:[authGuard],
      children: [
        { path: '', redirectTo: 'programs', pathMatch: 'full' },
        { path: 'programs', component: AffiliateProgramsComponent },
        { path: 'feeds', component: AffiliateFeedsComponent },
        { path: 'audit', component: AffiliateCatalogAuditComponent },
        { path: 'products/:id', component: AffiliateProductDetailComponent },
        { path: 'products', component: AffiliateProductsComponent },
        { path: 'sync-runs/:id', component: AffiliateSyncRunDetailComponent },
        { path: 'sync-runs', component: AffiliateSyncRunsComponent },
      ]
    },
    { path: 'form-list', component: AppFormListComponent,canActivate:[authGuard] },
     { path: 'form-builder/:id', component: FormBuilderComponent ,canActivate:[authGuard]},
     { path: 'outfit-list', component: OutfitsComponent,canActivate:[authGuard] },
     { path: 'outfit-detail/:id', component: OutfitFormComponent,canActivate:[authGuard]},
     { path: 'outfit-detail', component: OutfitFormComponent,canActivate:[authGuard]},
     { path: 'outfit-category', component: OutfitCategoryComponent,canActivate:[authGuard] },
     { path: 'outfit-category/:id', component: OutfitCategoryComponent,canActivate:[authGuard] },
     { path: 'outfit-product-list', component: OutfitProductsComponent,canActivate:[authGuard] },
  ];
  

export const AppRoutingModule = provideRouter(routes)
