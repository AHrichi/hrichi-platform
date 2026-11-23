import {
  type ApplicationConfig,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAppMode } from '@ah/platform/app-mode';
import { FIELD_ROUTES } from '@ah/products/greenhouse/feature-field';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(FIELD_ROUTES, withComponentInputBinding()),
    // The sample farm and a pretend server, until supervisor sign-in lands
    // (docs/greenhouse/AI_HANDOFF.md). Standalone mode sends to Supabase
    // once GREENHOUSE_SUPABASE is provided.
    provideAppMode('embedded-demo'),
    // The app has to open inside a greenhouse with no signal.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
