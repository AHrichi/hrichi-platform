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
    // StudyLM went public once its go-live gate landed.
    expect(isRouteEnabled('/apps/studylm')).toBe(true);
    expect(isRouteEnabled('/apps/study')).toBe(true);
    // The Learning Engine's seeded demo went public with the StudyLM link.
    expect(isRouteEnabled('/apps/learning')).toBe(true);
    // The System Design course went public at its go-live phase (ADR-0025, P12).
    expect(isRouteEnabled('/apps/system-design')).toBe(true);
    expect(isRouteEnabled('/apps/sysdesign')).toBe(true);
    expect(isRouteEnabled('/apps/scale-lab')).toBe(true);
    // The Greenhouse Labor Planner's demo went public at G6 (ADR-0026).
    expect(isRouteEnabled('/apps/greenhouse')).toBe(true);
    expect(isRouteEnabled('/apps/labor-planner')).toBe(true);

    // Disabled routes
    expect(isRouteEnabled('/apps/strategy')).toBe(false);
    expect(isRouteEnabled('/apps/dispatch')).toBe(false);
    expect(isRouteEnabled('/apps/whatsapp')).toBe(false);
    expect(isRouteEnabled('/apps/chatpulse')).toBe(false);
    expect(isRouteEnabled('/apps/basecamp')).toBe(false);
    expect(isRouteEnabled('/apps/alarm-engine')).toBe(false);
    expect(isRouteEnabled('/apps/alarm')).toBe(false);

    // General routes remain enabled
    expect(isRouteEnabled('/work')).toBe(true);
    expect(isRouteEnabled('/apps')).toBe(true);
    expect(isRouteEnabled('/experience')).toBe(true);
  });
});
