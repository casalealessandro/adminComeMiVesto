import { provideRouter, Routes } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { AppFormListComponent } from './views/app-views/app-form-list.component';
import { FormBuilderComponent } from './views/form-builder/form-builder.component';
import { UsersComponent } from './views/users/users.component';
import { OutfitsComponent } from './views/outfits/outfits.component';
import { OutfitCategoryComponent } from './views/outfit-category/outfit-category.component';
import { OutfitProductsComponent } from './views/outfit-products/outfit-products.component';


export const routes:Routes = [
    { path: 'dashboard', component: DashboardComponent },
    /* { path: 'utenti', component: UsersComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'form-list', component: AppFormListComponent },
     { path: 'form-builder/:id', component: FormBuilderComponent },
     { path: 'outfit-list', component: OutfitsComponent },
     { path: 'outfit-category', component: OutfitCategoryComponent },
     { path: 'outfit-category/:id', component: OutfitCategoryComponent },
     { path: 'outfit-product-list', component: OutfitProductsComponent }, */
  ];
  

export const AppRoutingModule = provideRouter(routes)