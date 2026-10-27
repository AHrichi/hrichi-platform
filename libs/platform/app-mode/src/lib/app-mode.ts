import {
  InjectionToken,
  makeEnvironmentProviders,
  EnvironmentProviders,
} from '@angular/core';

/**
 * Execution mode for multi-shell products (ADR-0002, docs/architecture.md §2.3).
 * - 'embedded-demo': Running inside the portfolio with isolated IndexedDB (ah-demo-<app>)
 *   and seeded demo data.
 * - 'standalone': Running as an independent web app or desktop build with user's own data.
 */
export type AppMode = 'embedded-demo' | 'standalone';

export const APP_MODE = new InjectionToken<AppMode>('APP_MODE', {
  providedIn: 'root',
  factory: () => 'standalone',
});

export function provideAppMode(mode: AppMode): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_MODE,
      useValue: mode,
    },
  ]);
}
