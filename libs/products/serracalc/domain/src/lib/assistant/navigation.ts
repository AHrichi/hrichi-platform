import type { CalcKind } from '../models/serra.models';

/** SerraCalc's screens, as routes under the app. */
export const SERRA_SCREENS = [
  'projects',
  'site',
  'energy',
  'calendar',
  'greenhouse',
  'heating',
  'cooling',
  'water',
  'supply',
  'air',
  'operations',
  'data',
  'climate',
  'science',
  'report',
  'guide',
] as const;

export type SerraScreen = (typeof SERRA_SCREENS)[number];

/** Where each kind of saved result opens: its screen and tab. */
export const OPENS_IN: Readonly<
  Record<CalcKind, { readonly screen: SerraScreen; readonly tab: string }>
> = {
  heatPeak: { screen: 'heating', tab: 'peak' },
  heatYear: { screen: 'heating', tab: 'year' },
  hotWater: { screen: 'heating', tab: 'pipes' },
  ventilation: { screen: 'cooling', tab: 'ventilation' },
  padFan: { screen: 'cooling', tab: 'padFan' },
  cropWater: { screen: 'water', tab: 'crop' },
  rainwater: { screen: 'water', tab: 'rain' },
  light: { screen: 'air', tab: 'light' },
  co2: { screen: 'air', tab: 'co2' },
  humidity: { screen: 'air', tab: 'humidity' },
  vpd: { screen: 'air', tab: 'vpd' },
  fog: { screen: 'cooling', tab: 'fog' },
  calendar: { screen: 'calendar', tab: 'plan' },
  ro: { screen: 'supply', tab: 'ro' },
  fertigation: { screen: 'supply', tab: 'fertigation' },
  energy: { screen: 'energy', tab: 'chp' },
  heatReuse: { screen: 'energy', tab: 'reuse' },
  coolingYear: { screen: 'energy', tab: 'cooling' },
  solarPv: { screen: 'energy', tab: 'solar' },
  economics: { screen: 'site', tab: 'economics' },
};

/** Every kind of saved result. */
export const CALC_KINDS = Object.keys(OPENS_IN) as CalcKind[];
