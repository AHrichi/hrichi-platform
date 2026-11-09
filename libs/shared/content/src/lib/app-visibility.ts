/**
 * Master Registry of Portfolio Applications and Labs.
 *
 * To hide or show any application or lab across the entire platform
 * (catalog cards, jump links, shell route guards, and 3D constellation links),
 * simply change the corresponding boolean from true to false (or vice-versa).
 */
export type PortfolioAppKey =
  | 'lighting'
  | 'strategy'
  | 'dispatch'
  | 'studylm'
  | 'whatsapp'
  | 'basecamp'
  | 'alarm-engine'
  | 'sky'
  | 'rxjs'
  | 'ngrx'
  | 'autosphere';

export const PORTFOLIO_APPS_CONFIG: Record<PortfolioAppKey, boolean> = {
  // --- Production / Commercial Applications ---
  // Stage 1: SolarLux (Solar & AC Public Lighting) is enabled; others hidden for now.
  lighting: true, // LuxPath (SolarLux) · Public & Solar Street Lighting
  strategy: false, // StrategyApp · Financial Planning
  dispatch: false, // PulseOps · Logistics & Dispatch Control Center
  studylm: true, // StudyLM · AI Software Engineering Curriculum
  whatsapp: false, // ChatPulse · WhatsApp Intelligence Analyzer
  basecamp: false, // Basecamp · Camping Trip Planner
  'alarm-engine': false, // Nightly Alarm Decision Engine

  // --- Interactive Engineering Labs ---
  sky: true, // Sky Lab · Three.js 3D Astronomy & Ephemeris
  rxjs: true, // RxJS Practice Pad · Stream Operators & Reactive Patterns
  ngrx: true, // NgRx State Lab · SignalStore & Redux Architecture

  // --- Showcases in Progress ---
  autosphere: true, // AutoSphere · Headless Automotive Showroom & Configurator
};

/**
 * Checks whether an app or lab is currently enabled.
 */
export function isAppEnabled(key: string): boolean {
  if (key in PORTFOLIO_APPS_CONFIG) {
    return PORTFOLIO_APPS_CONFIG[key as PortfolioAppKey];
  }
  return true;
}

/**
 * Maps route paths (e.g. '/apps/strategy', '/labs/sky') to their app key
 * and checks if the route is enabled.
 */
export function isRouteEnabled(route: string): boolean {
  if (!route) return false;

  const match = route.match(/^\/(apps|labs)\/([^/?#]+)/);
  if (!match) return true;

  const segment = match[2];

  // Map known aliases to their canonical app key
  const aliasMap: Record<string, PortfolioAppKey> = {
    lighting: 'lighting',
    luxpath: 'lighting',
    solarlux: 'lighting',
    strategy: 'strategy',
    dispatch: 'dispatch',
    studylm: 'studylm',
    study: 'studylm',
    whatsapp: 'whatsapp',
    chatpulse: 'whatsapp',
    basecamp: 'basecamp',
    'alarm-engine': 'alarm-engine',
    alarm: 'alarm-engine',
    'nightly-alarm': 'alarm-engine',
    sky: 'sky',
    orbit: 'sky',
    rxjs: 'rxjs',
    ngrx: 'ngrx',
    autosphere: 'autosphere',
  };

  const appKey = aliasMap[segment];
  return appKey ? isAppEnabled(appKey) : true;
}

/**
 * Filters any list of items possessing an `id` field against PORTFOLIO_APPS_CONFIG.
 */
export function filterEnabledApps<T extends { id: string }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => isAppEnabled(item.id));
}
