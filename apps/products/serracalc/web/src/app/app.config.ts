import {
  ApplicationConfig,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAppMode } from '@ah/platform/app-mode';
import { appRoutes } from './app.routes';

/**
 * Standalone SerraCalc. The service worker keeps the app itself (code,
 * styles, the Science photos) on the device, so it opens with no connection,
 * as the header's "Works offline" promises; projects are in IndexedDB.
 * Inside the portfolio this config isn't used: the portfolio's own worker
 * serves the page.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(appRoutes),
    provideAppMode('standalone'),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
