import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAppMode } from '@ah/platform/app-mode';
import { appRoutes } from './app.routes';

/** Shared by the browser bootstrap and the prerender (server) config. */
export const appConfig: ApplicationConfig = {
  providers: [
    // Every app the portfolio mounts is a demo (architecture §2.3). Provided
    // at the root, where the remotes' root services and stores are created;
    // a route's provider would reach only what that route creates.
    provideAppMode('embedded-demo'),
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
