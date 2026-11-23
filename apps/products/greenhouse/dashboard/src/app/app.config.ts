import {
  type ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAppMode } from '@ah/platform/app-mode';
import { GREENHOUSE_SUPABASE } from '@ah/products/greenhouse/data-access';
import { provideGreenhouseBrand } from '@ah/products/greenhouse/ui';
import { brand } from '../brand/brand';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // The neutral brand, or a private brand pack in a branded build.
    provideGreenhouseBrand(brand),
    provideRouter(appRoutes),
    provideAppMode('standalone'),
    // With a Supabase project: managers sign in and work on their farm.
    // Without one (and inside the portfolio): the demo farm, in memory.
    { provide: GREENHOUSE_SUPABASE, useValue: environment.supabase },
  ],
};
