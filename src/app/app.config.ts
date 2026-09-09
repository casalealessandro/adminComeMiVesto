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
import {
  FORM_DEFINITION_REPOSITORY,
  FORM_OPTIONS_PROVIDER,
  HEADER_CONFIG,
  HEADER_USER_PROVIDER,
  LAYOUT_SESSION_PROVIDER,
  NAVIGATION_ITEMS,
  OverlayService,
  POPUP_REGISTRY,
  SCROLL_INTERACTION_POLICY,
  ScrollInteractionPolicy,
  starterKitEntryComponents,
} from './core/public-api';
import { comeMiVestoPopupComponents } from './app-popup-components';
import { comeMiVestoNavigation } from './app-navigation';
import { comeMiVestoHeaderConfig } from './app-header-config';
import { ComeMiVestoHeaderUserService } from './app-header-user.service';
import { FormService } from './services/form.service';
import { ComeMiVestoLayoutSessionService } from './app-layout-session.service';

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
    { provide: LAYOUT_SESSION_PROVIDER, useClass: ComeMiVestoLayoutSessionService },
    { provide: FORM_DEFINITION_REPOSITORY, useExisting: FormService },
    { provide: FORM_OPTIONS_PROVIDER, useExisting: FormService },
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
