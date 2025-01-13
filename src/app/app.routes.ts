import { provideRouter, Routes } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { AppFormListComponent } from './views/app-views/app-form-list.component';
import { FormBuilderComponent } from './views/form-builder/form-builder.component';
import { UsersComponent } from './views/users/users.component';
import { OutfitsComponent } from './views/outfits/outfits.component';
import { OutfitCategoryComponent } from './views/outfit-category/outfit-category.component';
import { OutfitProductsComponent } from './views/outfit-products/outfit-products.component';
import { OutfitFormComponent } from './views/outfits/outfit-form/outfit-form.component';
import { authGuard } from './auth.guard';
import { LoginComponent } from './views/login/login.component';


export const routes:Routes = [
    { path: 'dashboard', component: DashboardComponent,canActivate:[authGuard]  },
    { path: 'utenti', component: UsersComponent,canActivate:[authGuard] },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'login', component: LoginComponent},
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