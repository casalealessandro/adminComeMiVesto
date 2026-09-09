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
import { HEADER_CONFIG } from './services/header-config';
import { comeMiVestoHeaderConfig } from './app-header-config';
import { HEADER_USER_PROVIDER } from './services/header-user-provider';
import { ComeMiVestoHeaderUserService } from './app-header-user.service';
import { OverlayService } from './services/overlay.service';
import { SCROLL_INTERACTION_POLICY, ScrollInteractionPolicy } from './components/custom-scrollbar/scroll-interaction-policy';

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
    { provide: HEADER_CONFIG, useValue: comeMiVestoHeaderConfig },
    { provide: HEADER_USER_PROVIDER, useClass: ComeMiVestoHeaderUserService },
    {
      provide: SCROLL_INTERACTION_POLICY,
      useFactory: (overlayService: OverlayService): ScrollInteractionPolicy => ({
        onScroll: () => overlayService.closeOverlay()
      }),
      deps: [OverlayService]
    },
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
