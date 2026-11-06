import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { AutoSphereStore } from './autosphere-store';

describe('AutoSphereStore', () => {
  let store: AutoSphereStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), AutoSphereStore],
    });
    store = TestBed.inject(AutoSphereStore);
  });

  it('initializes with active model and valid selections', () => {
    expect(store.activeModel().name).toBe('AutoSphere GT-V');
    expect(store.activeTrim().id).toBe('performance-awd');
    expect(store.totalPrice()).toBeGreaterThan(90000);
  });

  it('updates total price when trim changes', () => {
    const initialPrice = store.totalPrice();
    store.selectTrim('pure-rwd'); // Pure RWD is cheaper than Performance AWD
    expect(store.totalPrice()).toBeLessThan(initialPrice);
  });

  it('updates effective range when wheels change', () => {
    const initialRange = store.effectiveRangeKm();
    store.selectWheel('wheel-22'); // 22" wheel reduces range by -22km
    expect(store.effectiveRangeKm()).toBe(initialRange - 22);
  });

  it('toggles package selection properly', () => {
    expect(store.selectedPackageIds().has('pilot-pack')).toBe(true);
    store.togglePackage('pilot-pack');
    expect(store.selectedPackageIds().has('pilot-pack')).toBe(false);
  });
});
