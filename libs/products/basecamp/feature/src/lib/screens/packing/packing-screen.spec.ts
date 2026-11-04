import '@angular/compiler';
import {
  ɵChangeDetectionScheduler,
  ɵEffectScheduler,
  PendingTasks,
  Injector,
  signal,
} from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import type { Trip } from '@ah/products/basecamp/domain';
import { PreferencesStore } from '@ah/shared/state';
import { BasecampI18n } from '../../i18n/basecamp-i18n';
import { BasecampStore } from '../../store/basecamp.store';
import { PackingScreen } from './packing-screen';

describe('PackingScreen', () => {
  const sampleTrip: Trip = {
    id: 'trip-1',
    name: 'Weekend Camp',
    type: 'tent',
    start: '2026-08-10',
    nights: 2,
    campsite: { lat: 36.7, lng: 8.7, name: 'Forest' },
    people: [
      { id: 'p-1', name: 'Sami' },
      { id: 'p-2', name: 'Lina' },
    ],
    packing: [
      {
        id: 'item-tent',
        key: 'tent',
        category: 'shelter',
        quantity: 1,
        packed: false,
        personId: 'p-1',
        source: 'list',
        scope: 'shared',
      },
      {
        id: 'item-bag-sami',
        key: 'sleepingBag',
        category: 'sleep',
        quantity: 1,
        packed: false,
        personId: 'p-1',
        source: 'list',
        scope: 'personal',
      },
      {
        id: 'item-bag-lina',
        key: 'sleepingBag',
        category: 'sleep',
        quantity: 1,
        packed: true,
        personId: 'p-2',
        source: 'list',
        scope: 'personal',
      },
    ],
    notes: '',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  };

  const createScreen = (activeTrip = sampleTrip) => {
    const activeTripSignal = signal<Trip | null>(activeTrip);
    const gearSignal = signal([]);
    const setPackedMock = vi.fn();
    const removeItemMock = vi.fn();

    const mockStore = {
      activeTrip: activeTripSignal,
      gear: gearSignal,
      isLoading: signal(false),
      setPacked: setPackedMock,
      removeItem: removeItemMock,
      assign: vi.fn(),
      splitItem: vi.fn(),
      assignCategory: vi.fn(),
      distributeSharedGear: vi.fn(),
      addItem: vi.fn(),
      rebuildPacking: vi.fn(),
    };

    const mockPreferences = {
      language: signal('en' as const),
      isRtl: signal(false),
      setLanguage: vi.fn(),
    };

    const noop = () => undefined;
    const injector = Injector.create({
      providers: [
        {
          provide: ɵChangeDetectionScheduler,
          useValue: { notify: noop },
        },
        {
          provide: ɵEffectScheduler,
          useValue: { add: noop },
        },
        {
          provide: PendingTasks,
          useValue: { add: () => noop },
        },
        { provide: PreferencesStore, useValue: mockPreferences },
        BasecampI18n,
        { provide: BasecampStore, useValue: mockStore },
        PackingScreen,
      ],
    });

    const screen = injector.get(PackingScreen);
    return {
      screen,
      mockStore,
      activeTripSignal,
    };
  };

  it('consolidates personal gear when viewing everyone with multiple people', () => {
    const { screen } = createScreen();
    expect(screen['isConsolidated']()).toBe(true);

    const groups = screen['groups']();
    const sleepGroup = groups.find((g) => g.category === 'sleep');
    expect(sleepGroup).toBeDefined();
    expect(sleepGroup?.personalCards).toHaveLength(1);

    const sleepingBagCard = sleepGroup?.personalCards[0];
    expect(sleepingBagCard?.key).toBe('sleepingBag');
    expect(sleepingBagCard?.totalCampers).toBe(2);
    expect(sleepingBagCard?.packedCount).toBe(1);
    expect(sleepingBagCard?.allPacked).toBe(false);
    expect(sleepingBagCard?.campers).toEqual([
      {
        personId: 'p-1',
        personName: 'Sami',
        item: expect.objectContaining({ id: 'item-bag-sami' }),
        packed: false,
      },
      {
        personId: 'p-2',
        personName: 'Lina',
        item: expect.objectContaining({ id: 'item-bag-lina' }),
        packed: true,
      },
    ]);
  });

  it('separates shared items from personal cards in consolidated view', () => {
    const { screen } = createScreen();
    const groups = screen['groups']();
    const shelterGroup = groups.find((g) => g.category === 'shelter');
    expect(shelterGroup).toBeDefined();
    expect(shelterGroup?.sharedItems).toHaveLength(1);
    expect(shelterGroup?.sharedItems[0].item.id).toBe('item-tent');
    expect(shelterGroup?.personalCards).toHaveLength(0);
  });

  it('toggles all campers when master checkbox is clicked', () => {
    const { screen, mockStore } = createScreen();
    const groups = screen['groups']();
    const card = groups.find((g) => g.category === 'sleep')?.personalCards[0];
    expect(card).toBeDefined();

    if (!card) throw new Error('Expected sleeping bag card to be defined');
    screen['toggleAllCampers'](card, true);
    // Should call setPacked for Sami (unpacked -> packed), Lina is already packed
    expect(mockStore.setPacked).toHaveBeenCalledWith('item-bag-sami', true);
    expect(mockStore.setPacked).not.toHaveBeenCalledWith('item-bag-lina', true);
  });

  it('switches to single-person list mode when a specific camper is chosen', () => {
    const { screen } = createScreen();
    screen['person'].set('p-1'); // Select Sami
    expect(screen['isConsolidated']()).toBe(false);

    const groups = screen['groups']();
    const sleepGroup = groups.find((g) => g.category === 'sleep');
    expect(sleepGroup?.items).toHaveLength(1);
    expect(sleepGroup?.items[0].item.id).toBe('item-bag-sami');

    const shelterGroup = groups.find((g) => g.category === 'shelter');
    expect(shelterGroup?.items).toHaveLength(1);
    expect(shelterGroup?.items[0].item.id).toBe('item-tent');
  });

  it('hides completed personal cards when hidePacked is enabled', () => {
    const tripAllPacked: Trip = {
      ...sampleTrip,
      packing: sampleTrip.packing.map((p) =>
        p.key === 'sleepingBag' ? { ...p, packed: true } : p,
      ),
    };
    const { screen } = createScreen(tripAllPacked);
    screen['hidePacked'].set(true);

    const groups = screen['groups']();
    const sleepGroup = groups.find((g) => g.category === 'sleep');
    // All sleeping bags are packed, so sleep group should have no cards and be excluded
    expect(sleepGroup).toBeUndefined();
  });
});
