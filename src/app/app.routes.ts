import { provideRouter, Routes } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { AppFormListComponent } from './views/app-views/app-form-list.component';
import { FormBuilderComponent } from './views/form-builder/form-builder.component';
import { UsersComponent } from './views/users/users.component';


export const routes:Routes = [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'utenti', component: UsersComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'form-list', component: AppFormListComponent },
     { path: 'form-builder/:id', component: FormBuilderComponent },
  ];
  

export const AppRoutingModule = provideRouter(routes)