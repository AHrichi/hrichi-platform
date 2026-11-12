import {
  ApplicationConfig,
  inject,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideLearningHost } from '@ah/learning/client';
import { provideAppMode } from '@ah/platform/app-mode';
import { SiteConfigService } from '@ah/shared/site-config';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(appRoutes),
    provideAppMode('standalone'),
    // Standalone StudyLM can link to the Learning Engine (ADR-0024, design
    // §9); inside the portfolio it runs as a demo and never links.
    provideLearningHost('studylm', () =>
      inject(SiteConfigService)
        .load()
        .then((config) => config.apiUrl),
    ),
  ],
};
