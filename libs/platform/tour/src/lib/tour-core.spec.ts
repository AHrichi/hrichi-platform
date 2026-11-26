import { describe, expect, it, vi } from 'vitest';
import { placeCard, type PlacementRequest } from './placement';
import { findTarget, waitForTarget } from './target-locator';
import { TOUR_COPY } from './tour-copy';
import { checkTour, type TourDefinition } from './tour.model';
import { tourKey, TourProgress } from './tour-progress';

const TOUR: TourDefinition = {
  app: 'serracalc',
  id: 'main',
  version: 1,
  steps: [
    { id: 'welcome', targets: [] },
    { id: 'navigation', targets: ['nav-rail', 'nav-bottom'] },
  ],
};

describe('checkTour', () => {
  it('accepts slugs and refuses what would break a selector', () => {
    expect(checkTour(TOUR)).toEqual([]);
    expect(
      checkTour({
        ...TOUR,
        steps: [
          { id: 'a', targets: ['ok', 'not ok'] },
          { id: 'a', targets: ['x"]'] },
        ],
      }),
    ).toEqual([
      'target "not ok" in "a"',
      'step "a" twice',
      'target "x"]" in "a"',
    ]);
  });
});

describe('TourProgress', () => {
  it('keeps the demo apart from the app itself', () => {
    expect(tourKey(TOUR, false)).toBe('ah.tour.serracalc.main');
    expect(tourKey(TOUR, true)).toBe('ah-demo.ah.tour.serracalc.main');
  });

  it('writes and reads a record, and ignores anything damaged', () => {
    const store = new Map<string, string>();
    const progress = new TourProgress({
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
    });
    expect(progress.read('k')).toBeNull();
    progress.write('k', { v: 1, version: 2, status: 'finished', at: 'now' });
    expect(progress.read('k')).toEqual({
      v: 1,
      version: 2,
      status: 'finished',
      at: 'now',
    });
    store.set('k', '{not json');
    expect(progress.read('k')).toBeNull();
    store.set(
      'k',
      JSON.stringify({ v: 1, version: 1, status: 'maybe', at: 'x' }),
    );
    expect(progress.read('k')).toBeNull();
  });

  it('falls back to memory when storage throws', () => {
    const progress = new TourProgress({
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    progress.write('k', { v: 1, version: 1, status: 'skipped', at: 'now' });
    expect(progress.read('k')?.status).toBe('skipped');
  });
});

describe('placeCard', () => {
  const base: PlacementRequest = {
    target: { x: 100, y: 100, width: 200, height: 40 },
    card: { width: 300, height: 160 },
    viewport: { width: 1280, height: 800 },
    insets: { top: 60, bottom: 0 },
    dir: 'ltr',
  };

  it('goes below the target, centred on it, pointing at its middle', () => {
    expect(placeCard(base)).toEqual({
      side: 'block-end',
      x: 50,
      y: 152,
      arrow: 150,
    });
  });

  it('goes above when there is no room below', () => {
    const placement = placeCard({
      ...base,
      target: { x: 100, y: 700, width: 200, height: 40 },
    });
    expect(placement.side).toBe('block-start');
    expect(placement.y).toBe(700 - 12 - 160);
  });

  it('keeps clear of a floating header and a bottom bar', () => {
    const tall = { ...base, card: { width: 300, height: 300 } };
    const placement = placeCard({
      ...tall,
      target: { x: 100, y: 300, width: 200, height: 200 },
      insets: { top: 120, bottom: 80 },
    });
    // Neither below (500 + 12 + 300 > 800 - 80 - 12) nor above (300 - 312 < 132).
    expect(placement.side).toBe('inline-end');
    expect(placement.x).toBe(312);
  });

  it('flips sides right to left', () => {
    const request = {
      ...base,
      preferred: 'inline-end' as const,
      target: { x: 800, y: 300, width: 100, height: 40 },
    };
    expect(placeCard(request).side).toBe('inline-end');
    expect(placeCard(request).x).toBe(912);
    expect(placeCard({ ...request, dir: 'rtl' }).x).toBe(800 - 12 - 300);
  });

  it('keeps the pointer off the card corners', () => {
    const placement = placeCard({
      ...base,
      target: { x: 0, y: 100, width: 10, height: 10 },
    });
    expect(placement.x).toBe(12);
    expect(placement.arrow).toBe(18);
  });

  it('centres a card without a target, between the insets', () => {
    expect(placeCard({ ...base, target: null })).toEqual({
      side: 'center',
      x: 490,
      y: (72 + 788 - 160) / 2,
      arrow: null,
    });
  });

  it('docks at the bottom on a phone, above its bottom bar', () => {
    expect(
      placeCard({
        ...base,
        viewport: { width: 375, height: 812 },
        insets: { top: 64, bottom: 72 },
      }),
    ).toEqual({ side: 'sheet', x: 12, y: 812 - 72 - 160 - 12, arrow: null });
  });
});

describe('the target locator', () => {
  function element(id: string, shown: boolean): HTMLElement {
    const el = document.createElement('div');
    el.dataset['tour'] = id;
    el.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: shown ? 10 : 0,
        height: shown ? 10 : 0,
      }) as DOMRect;
    return el;
  }

  it('takes the first shown element for the first id that has one', () => {
    const root = document.createElement('div');
    const rail = element('nav-rail', false);
    const bottom = element('nav-bottom', true);
    root.append(rail, bottom);
    expect(findTarget(root, ['nav-rail', 'nav-bottom'])).toBe(bottom);
    expect(findTarget(root, ['missing'])).toBeNull();
  });

  it('matches one id among several on an element', () => {
    const root = document.createElement('div');
    const both = element('brand project-chip', true);
    root.append(both);
    expect(findTarget(root, ['project-chip'])).toBe(both);
  });

  it('waits for a target that shows up later, and gives up in time', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const later = waitForTarget(root, ['fields'], 1000);
    root.append(element('fields', true));
    await expect(later).resolves.toBe(root.querySelector('[data-tour]'));

    vi.useFakeTimers();
    const never = waitForTarget(root, ['nothing'], 1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(never).resolves.toBeNull();
    vi.useRealTimers();
    root.remove();
  });
});

describe('the card copy', () => {
  it('speaks every language, with Latin digits', () => {
    for (const copy of Object.values(TOUR_COPY)) {
      expect(copy.next && copy.back && copy.finish && copy.close).toBeTruthy();
      expect(copy.progress(3, 8)).toMatch(/3.*8/);
    }
  });
});
