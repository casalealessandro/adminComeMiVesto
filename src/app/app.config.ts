import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp, FirebaseAppModule } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { authInterceptor } from './auth.interceptor';
import { POPUP_REGISTRY } from './services/popup-registry';
import { starterKitEntryComponents } from './services/entryComponents';
import { comeMiVestoPopupComponents } from './app-popup-components';
import { NAVIGATION_ITEMS } from './services/navigation-registry';
import { comeMiVestoNavigation } from './app-navigation';

const popupComponents = [
  ...starterKitEntryComponents,
  ...comeMiVestoPopupComponents,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: POPUP_REGISTRY, useValue: popupComponents },
    { provide: NAVIGATION_ITEMS, useValue: comeMiVestoNavigation },
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFirestoreModule,
      AngularFireAuthModule,
      AngularFireFunctionsModule,
      FirebaseAppModule,
      HttpClientModule,
      

    ),
    
  
  ]
};
