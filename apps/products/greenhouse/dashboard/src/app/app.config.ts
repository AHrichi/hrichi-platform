import {
  type ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAppMode } from '@ah/platform/app-mode';
import { provideGreenhouseBrand } from '@ah/products/greenhouse/ui';
import { brand } from '../brand/brand';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // The neutral brand, or a private brand pack in a branded build.
    provideGreenhouseBrand(brand),
    provideRouter(appRoutes),
    provideAppMode('standalone'),
  ],
};
