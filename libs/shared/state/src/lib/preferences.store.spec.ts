import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from './preferences.store';

function setup(url: string, stored?: string) {
  const storage = new Map<string, string>(
    stored ? [['ah.audience', stored]] : [],
  );
  const fakeWindow = {
    location: { href: url },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  };
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: DOCUMENT, useValue: { defaultView: fakeWindow } },
    ],
  });
  return { store: TestBed.inject(PreferencesStore), storage };
}

describe('PreferencesStore', () => {
  it('starts with the default audience, matching prerendered HTML', () => {
    const { store } = setup('https://site.test/?for=client');

    expect(store.audience()).toBe('recruiter');
    expect(store.copy().label).toBe('Recruiter');
  });

  it('restores ?for= from a shared link and remembers it', () => {
    const { store, storage } = setup('https://site.test/?for=client');

    store.restore();

    expect(store.audience()).toBe('client');
    expect(storage.get('ah.audience')).toBe('client');
  });

  it('falls back to the stored choice and ignores unknown values', () => {
    const { store } = setup('https://site.test/?for=hacker', 'engineer');

    store.restore();

    expect(store.audience()).toBe('engineer');
  });

  it('persists a choice made with the switch', () => {
    const { store, storage } = setup('https://site.test/');

    store.setAudience('engineer');

    expect(store.audience()).toBe('engineer');
    expect(store.copy().headline).toContain('Angular platforms');
    expect(storage.get('ah.audience')).toBe('engineer');
  });
});
