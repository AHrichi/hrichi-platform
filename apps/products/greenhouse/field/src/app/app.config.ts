import {
  type ApplicationConfig,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';
import { provideAppMode } from '@ah/platform/app-mode';
import { provideGreenhouseBrand } from '@ah/products/greenhouse/ui';
import { brand } from '../brand/brand';
import { GREENHOUSE_SUPABASE } from '@ah/products/greenhouse/data-access';
import {
  FIELD_ROUTES,
  provideNativeDevice,
} from '@ah/products/greenhouse/feature-field';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // The neutral brand, or a private brand pack in a branded build.
    provideGreenhouseBrand(brand),
    provideRouter(FIELD_ROUTES, withComponentInputBinding()),
    // With a Supabase project: supervisors sign in and send to it.
    // Without one (the demo build): the sample farm and a pretend server.
    environment.supabase
      ? [
          provideAppMode('standalone'),
          { provide: GREENHOUSE_SUPABASE, useValue: environment.supabase },
        ]
      : provideAppMode('embedded-demo'),
    // In the Android app: the Google code scanner and the phone's radios.
    provideNativeDevice(),
    // The app has to open inside a greenhouse with no signal. The Android
    // app carries its files itself, so it needs no service worker.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !Capacitor.isNativePlatform(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
