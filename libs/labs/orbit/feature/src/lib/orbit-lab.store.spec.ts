import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { bundledSnapshot, type Omm } from '@ah/labs/orbit/domain';
import type { CatalogResponse, PassesResponse } from '@ah/shared/api-client';
import type { OrbitApi } from './orbit-api';
import { OrbitLabStore } from './orbit-lab.store';
import type { Propagation } from './propagation/propagation';

const iss = bundledSnapshot.satellites.find(
  (s) => s.NORAD_CAT_ID === 25544,
) as Omm;

function fakePropagation() {
  return {
    load: vi.fn(),
    requestFrame: vi.fn(),
    requestPath: vi.fn(),
    dispose: vi.fn(),
  } as unknown as Propagation & {
    load: ReturnType<typeof vi.fn>;
    requestFrame: ReturnType<typeof vi.fn>;
    requestPath: ReturnType<typeof vi.fn>;
  };
}

const pass = {
  rise: { time: '2026-10-27T22:57:47Z', azimuthDeg: 205.7, elevationDeg: 10 },
  culmination: {
    time: '2026-10-27T23:00:57Z',
    azimuthDeg: 134,
    elevationDeg: 41,
  },
  set: { time: '2026-10-27T23:04:09Z', azimuthDeg: 62.7, elevationDeg: 10 },
  durationSeconds: 382,
  visible: true,
};

function fakeApi(live: Omm[]) {
  return {
    catalog: vi.fn(async (): Promise<CatalogResponse> => ({
      group: 'all',
      source: 'celestrak',
      fetchedAt: '2026-10-27T10:02:34Z',
      count: live.length,
      satellites: live as CatalogResponse['satellites'],
    })),
    passes: vi.fn(
      async (): Promise<PassesResponse> =>
        ({ passes: [pass] }) as unknown as PassesResponse,
    ),
  } as unknown as OrbitApi & {
    catalog: ReturnType<typeof vi.fn>;
    passes: ReturnType<typeof vi.fn>;
  };
}

function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), OrbitLabStore],
  });
  return TestBed.inject(OrbitLabStore);
}

describe('OrbitLabStore', () => {
  afterEach(() => TestBed.inject(OrbitLabStore).stop());

  it('propagates the bundled snapshot at once, with the ISS selected', async () => {
    const store = setup();
    const propagation = fakePropagation();

    await store.start(propagation, null);

    expect(store.api()).toBe('off');
    expect(store.source()).toBe('snapshot');
    expect(propagation.load).toHaveBeenCalledWith(bundledSnapshot.satellites);
    expect(propagation.requestFrame).toHaveBeenCalled();
    expect(store.selected()?.OBJECT_NAME).toBe('ISS (ZARYA)');
  });

  it('switches to the live catalog and loads passes from the API', async () => {
    const store = setup();
    const propagation = fakePropagation();
    const live = [iss, { ...iss, NORAD_CAT_ID: 99999, OBJECT_NAME: 'TESTSAT' }];
    const api = fakeApi(live);

    await store.start(propagation, api);

    expect(store.api()).toBe('ready');
    expect(store.source()).toBe('live');
    expect(store.count()).toBe(2);
    expect(propagation.load).toHaveBeenLastCalledWith(live);
    expect(api.passes).toHaveBeenCalledWith(
      25544,
      store.city(),
      expect.anything(),
    );
    expect(store.passes()).toMatchObject({ status: 'ready', passes: [pass] });
  });

  it('keeps the snapshot and says so when the API never answers', async () => {
    const store = setup();
    const api = fakeApi([]);
    api.catalog.mockRejectedValue(new Error('gave up'));

    await store.start(fakePropagation(), api);

    expect(store.api()).toBe('unavailable');
    expect(store.source()).toBe('snapshot');
  });

  it('selects by globe index, finds by name or number, and asks for the orbit', async () => {
    const store = setup();
    const propagation = fakePropagation();
    await store.start(propagation, null);

    store.setQuery('zarya');
    expect(store.results()[0]?.OBJECT_NAME).toBe('ISS (ZARYA)');
    store.setQuery('25544');
    expect(store.results()[0]?.NORAD_CAT_ID).toBe(25544);

    store.selectIndex(0);
    expect(store.selectedId()).toBe(bundledSnapshot.satellites[0].NORAD_CAT_ID);
    expect(store.query()).toBe('');
    expect(propagation.requestPath).toHaveBeenLastCalledWith(
      0,
      expect.any(Number),
    );

    store.pathReady(5, new Float32Array(3));
    expect(store.path()).toBeNull();
    store.pathReady(0, new Float32Array(3));
    expect(store.path()).not.toBeNull();
  });

  it('keeps simulated time continuous when the speed changes', async () => {
    const store = setup();
    await store.start(fakePropagation(), null);
    const before = store.clock();

    store.setSpeed(600);

    expect(store.clock() - before).toBeLessThan(1000);
    expect(store.speed()).toBe(600);
  });

  it('shows and hides groups with a bit mask', async () => {
    const store = setup();
    const all = store.groupMask();

    store.toggleGroup('starlink');
    expect(store.groupMask()).toBe(all & ~(1 << 1));
    store.toggleGroup('starlink');
    expect(store.groupMask()).toBe(all);
  });
});
