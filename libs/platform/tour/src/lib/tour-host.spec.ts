import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_MODE } from '@ah/platform/app-mode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TourDefinition, TourRoute } from './tour.model';
import { TourHost } from './tour-host';
import { TourService } from './tour.service';

const TOUR: TourDefinition = {
  app: 'demoapp',
  id: 'main',
  version: 3,
  steps: [
    { id: 'welcome', targets: [] },
    {
      id: 'chart',
      targets: ['chart'],
      route: { path: 'charts', query: { tab: 'year' } },
    },
    { id: 'end', targets: ['wand'] },
  ],
};

const WORDS: Record<string, { title: string; body: string }> = {
  welcome: { title: 'Welcome', body: 'A short tour.' },
  chart: { title: 'Charts', body: 'Your year at a glance.' },
  end: { title: 'Again?', body: 'The wand starts it again.' },
};

@Component({
  imports: [TourHost],
  template: `
    <div #root>
      <div data-tour="chart" class="chart">chart</div>
      <button type="button" data-tour="wand" class="wand">wand</button>
    </div>
    <ah-tour-host [text]="text" [root]="root" lang="fr" [navigate]="navigate" />
  `,
})
class Host {
  readonly text = (id: string) => WORDS[id];
  readonly routes = signal<TourRoute[]>([]);
  readonly navigate = async (route: TourRoute) => {
    this.routes.update((all) => [...all, route]);
  };
}

/** jsdom has no layout: every element gets a 40 × 20 box. */
function giveBoxes() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 100,
    y: 200,
    width: 40,
    height: 20,
    top: 200,
    left: 100,
    right: 140,
    bottom: 220,
    toJSON: () => ({}),
  } as DOMRect);
  Element.prototype.scrollIntoView = vi.fn();
}

async function settle(fixture: { whenStable: () => Promise<unknown> }) {
  // Past a smooth scroll's settling time.
  for (let i = 0; i < 25; i++) {
    await new Promise((resolve) => setTimeout(resolve, 25));
    await fixture.whenStable();
  }
}

describe('TourHost', () => {
  beforeEach(() => {
    localStorage.clear();
    giveBoxes();
  });
  afterEach(() => vi.restoreAllMocks());

  async function setup(mode: 'standalone' | 'embedded-demo' = 'standalone') {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: APP_MODE, useValue: mode },
      ],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const tour = TestBed.inject(TourService);
    const card = () =>
      document.querySelector('ah-coachmark') as HTMLElement | null;
    return { fixture, tour, card, root: fixture.nativeElement as HTMLElement };
  }

  it('walks the steps, opening their screens, in the app’s language', async () => {
    const { fixture, tour, card, root } = await setup();
    const opener = root.querySelector('.wand') as HTMLButtonElement;
    tour.start(TOUR, opener);
    await settle(fixture);
    expect(card()?.textContent).toContain('Welcome');
    expect(card()?.textContent).toContain('Étape 1 sur 3');
    expect(document.activeElement).toBe(card());
    expect(document.querySelector('.veil')).not.toBeNull();

    tour.next();
    await settle(fixture);
    expect(fixture.componentInstance.routes()).toEqual([
      { path: 'charts', query: { tab: 'year' } },
    ]);
    expect(card()?.textContent).toContain('Charts');
    expect(document.querySelector('.ring')).not.toBeNull();
    expect(root.querySelector('.chart')?.scrollIntoView).toHaveBeenCalled();

    tour.next();
    await settle(fixture);
    expect(card()?.textContent).toContain('Terminer');
    tour.next();
    await settle(fixture);
    expect(card()).toBeNull();
    expect(tour.record(TOUR)?.status).toBe('finished');
    expect(tour.record(TOUR)?.version).toBe(3);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape and remembers it was skipped', async () => {
    const { fixture, tour, card } = await setup();
    tour.start(TOUR);
    await settle(fixture);
    card()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle(fixture);
    expect(card()).toBeNull();
    expect(tour.isNew(TOUR)).toBe(false);
    expect(tour.record(TOUR)?.status).toBe('skipped');
  });

  it('keeps the demo’s progress apart from the app’s', async () => {
    const { tour } = await setup('embedded-demo');
    expect(tour.isNew(TOUR)).toBe(true);
    tour.dismiss(TOUR);
    expect(tour.isNew(TOUR)).toBe(false);
    expect(localStorage.getItem('ah-demo.ah.tour.demoapp.main')).toContain(
      'dismissed',
    );
    expect(localStorage.getItem('ah.tour.demoapp.main')).toBeNull();
  });
});
