import { describe, expect, it } from 'vitest';
import {
  PORTFOLIO_APPS_CONFIG,
  filterEnabledApps,
  isAppEnabled,
  isRouteEnabled,
} from './app-visibility';

describe('app-visibility', () => {
  it('correctly reports enabled status according to PORTFOLIO_APPS_CONFIG', () => {
    expect(isAppEnabled('lighting')).toBe(PORTFOLIO_APPS_CONFIG.lighting);
    expect(isAppEnabled('sky')).toBe(PORTFOLIO_APPS_CONFIG.sky);
    expect(isAppEnabled('autosphere')).toBe(PORTFOLIO_APPS_CONFIG.autosphere);
    expect(isAppEnabled('strategy')).toBe(PORTFOLIO_APPS_CONFIG.strategy);
    expect(isAppEnabled('dispatch')).toBe(PORTFOLIO_APPS_CONFIG.dispatch);
  });

  it('filters apps accurately based on their enabled state', () => {
    const mockApps = [
      { id: 'lighting', name: 'LuxPath' },
      { id: 'strategy', name: 'StrategyApp' },
      { id: 'sky', name: 'Sky Lab' },
      { id: 'dispatch', name: 'PulseOps' },
    ];

    const filtered = filterEnabledApps(mockApps);
    const ids = filtered.map((a) => a.id);

    expect(ids).toContain('lighting');
    expect(ids).toContain('sky');
    expect(ids).not.toContain('strategy');
    expect(ids).not.toContain('dispatch');
  });

  it('evaluates route enablement for direct routes and aliases', () => {
    expect(isRouteEnabled('/apps/lighting')).toBe(true);
    expect(isRouteEnabled('/apps/solarlux')).toBe(true);
    expect(isRouteEnabled('/apps/luxpath')).toBe(true);
    expect(isRouteEnabled('/apps/autosphere')).toBe(true);
    expect(isRouteEnabled('/labs/sky')).toBe(true);

    // Disabled routes
    expect(isRouteEnabled('/apps/strategy')).toBe(false);
    expect(isRouteEnabled('/apps/dispatch')).toBe(false);
    expect(isRouteEnabled('/apps/whatsapp')).toBe(false);
    expect(isRouteEnabled('/apps/chatpulse')).toBe(false);
    expect(isRouteEnabled('/apps/studylm')).toBe(false);
    expect(isRouteEnabled('/apps/study')).toBe(false);
    expect(isRouteEnabled('/apps/basecamp')).toBe(false);
    expect(isRouteEnabled('/apps/alarm-engine')).toBe(false);
    expect(isRouteEnabled('/apps/alarm')).toBe(false);

    // General routes remain enabled
    expect(isRouteEnabled('/work')).toBe(true);
    expect(isRouteEnabled('/apps')).toBe(true);
    expect(isRouteEnabled('/experience')).toBe(true);
  });
});
