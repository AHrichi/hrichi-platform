import { InjectionToken, type Provider } from '@angular/core';

/**
 * Who the app is dressed for. The neutral build (the public repo, the
 * portfolio) uses `NEUTRAL_BRAND`; a private brand pack
 * (`apps/products/greenhouse/brands/`) swaps in a farm's name and logo, and
 * its CSS overrides the greenhouse look's colours under `[data-brand]`.
 */
export interface GreenhouseBrand {
  /** Sets `data-brand` on the app root, which the pack's CSS keys on. */
  id: string | null;
  /** The farm or group's name, shown with the logo. */
  organisation: string | null;
  /** The logo's URL, relative to the app's base; null draws the default mark. */
  logo: string | null;
  /** What the logo says, for screen readers. */
  logoAlt: string;
}

export const NEUTRAL_BRAND: GreenhouseBrand = {
  id: null,
  organisation: null,
  logo: null,
  logoAlt: '',
};

export const GREENHOUSE_BRAND = new InjectionToken<GreenhouseBrand>(
  'GREENHOUSE_BRAND',
  { providedIn: 'root', factory: () => NEUTRAL_BRAND },
);

export function provideGreenhouseBrand(brand: GreenhouseBrand): Provider {
  return { provide: GREENHOUSE_BRAND, useValue: brand };
}
