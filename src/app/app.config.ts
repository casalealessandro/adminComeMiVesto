import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { FirebaseAppModule } from '@angular/fire/app';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { routes } from './app.routes';
import { APP_NAVIGATION_ITEMS } from './config/navigation.config';
import { ADMIN_NAVIGATION } from './core/navigation/admin-navigation';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ADMIN_NAVIGATION, useValue: APP_NAVIGATION_ITEMS },
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFirestoreModule,
      AngularFireAuthModule,
      AngularFireFunctionsModule,
      FirebaseAppModule,
      HttpClientModule
    )
  ]
};
