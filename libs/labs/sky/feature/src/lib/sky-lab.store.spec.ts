import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { cities, gmst, placeAt, placeFromCity } from '@ah/labs/sky/domain';
import type { SiteLanguage } from '@ah/shared/state';
import { SKY_LAB_COPY } from './sky-lab-copy';
import { earthFrame, SkyLabStore, skyFrame } from './sky-lab.store';

const augustNight = Date.parse('2026-08-12T22:00:00Z');

describe('SkyLabStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(augustNight);
    TestBed.configureTestingModule({
      providers: [SkyLabStore, provideZonelessChangeDetection()],
    });
  });
  afterEach(() => vi.useRealTimers());

  it('runs a simulated clock at the chosen speed, and pauses it', () => {
    const store = TestBed.inject(SkyLabStore);
    store.setTime(augustNight);
    store.setSpeed(600);
    vi.advanceTimersByTime(1000);
    expect(store.clock()).toBe(Date.parse('2026-08-12T22:10:00Z'));

    store.setSpeed(0);
    vi.advanceTimersByTime(5000);
    expect(store.clock()).toBe(Date.parse('2026-08-12T22:10:00Z'));
    expect(store.playing()).toBe(false);

    store.now();
    expect(store.clock()).toBe(Date.now());
    expect(store.speed()).toBe(1);
  });

  it('faces the side of the sky where the Moon and planets cross', () => {
    const store = TestBed.inject(SkyLabStore);
    store.setPlace(placeFromCity(cities[0]));
    expect(store.facing()).toBe(180);
    store.setPlace(placeAt(-33.87, 151.21));
    expect(store.facing()).toBe(0);
  });

  it('gives the scene a new sky function when the place changes', () => {
    const store = TestBed.inject(SkyLabStore);
    const before = store.skyAt();
    store.setPlace(placeAt(-33.87, 151.21));
    expect(store.skyAt()).not.toBe(before);
  });
});

describe('frames for the scene', () => {
  it('shapes the sky, with the Perseids on their peak night', () => {
    const frame = skyFrame(placeFromCity(cities[0]), augustNight);

    expect(frame.equatorialToLocal).toHaveLength(9);
    expect(frame.planets.map((planet) => planet.name)).toHaveLength(5);
    const perseids = frame.showers.find((s) => s.name === 'Perseids');
    expect(perseids?.rate).toBeGreaterThan(80);
    expect(Math.hypot(...(perseids?.radiant ?? [0, 0, 0]))).toBeCloseTo(1, 6);
  });

  it('turns the Earth by sidereal time', () => {
    expect(earthFrame(augustNight).gmst).toBe(gmst(new Date(augustNight)));
  });
});

describe('SKY_LAB_COPY', () => {
  const languages: SiteLanguage[] = ['en', 'fr', 'ar', 'it', 'de'];

  it.each(languages)('provides complete localized copy for %s', (lang) => {
    const copy = SKY_LAB_COPY[lang];
    expect(copy.lookUpAtSky.length).toBeGreaterThan(0);
    expect(copy.backToEarth.length).toBeGreaterThan(0);
    expect(copy.twilight.night.length).toBeGreaterThan(0);
    expect(copy.localTimeIn('Tunis')).toContain('Tunis');
    expect(copy.highInThe(45, 'S')).toContain('45');
    expect(copy.lit('80%')).toContain('80%');
    expect(copy.moonFact('Full Moon', '100%', '20:00', '06:00')).toContain(
      '100%',
    );
    expect(copy.planetUpNow(30, 'SE', '-2.1')).toContain('-2.1');
    expect(copy.planetBelowHorizon('22:00', '05:00')).toContain('22:00');
    expect(copy.showerText(90, copy.radiantUp(50), 59, '109P')).toContain('90');
    expect(copy.planetSubtitle('-1.5')).toContain('-1.5');
    expect(copy.starSubtitle('Orion', '0.1')).toContain('Orion');
    expect(copy.moonlessDark('4h 30m')).toContain('4h 30m');
    expect(copy.moonPct('12%')).toContain('12%');
  });
});
