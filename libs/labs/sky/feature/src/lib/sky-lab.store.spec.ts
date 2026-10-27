import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { cities, gmst, placeAt, placeFromCity } from '@ah/labs/sky/domain';
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
