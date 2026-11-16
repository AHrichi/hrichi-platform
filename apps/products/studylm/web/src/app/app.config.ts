import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideLearningHost } from '@ah/learning/client';
import { provideAppMode } from '@ah/platform/app-mode';
import { SiteConfigService } from '@ah/shared/site-config';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(appRoutes),
    provideAppMode('standalone'),
    // Installable and offline-ready; it also shows push notifications.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // Standalone StudyLM can link to the Learning Engine (ADR-0024, design
    // §9); inside the portfolio it runs as a demo and never links.
    provideLearningHost('studylm', () =>
      inject(SiteConfigService)
        .load()
        .then((config) => config.apiUrl),
    ),
  ],
};
