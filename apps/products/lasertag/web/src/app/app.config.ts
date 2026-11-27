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
 * Standalone BARQ. The service worker keeps the app itself on the device,
 * so the player's badge opens with no connection; the badge key and session
 * are in localStorage.
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
