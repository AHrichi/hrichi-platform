import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from './preferences.store';

function setup(url: string, stored?: Record<string, string>) {
  const storage = new Map<string, string>(stored ? Object.entries(stored) : []);
  const fakeElement = {
    attributes: new Map<string, string>(),
    setAttribute(k: string, v: string) {
      this.attributes.set(k, v);
    },
    removeAttribute(k: string) {
      this.attributes.delete(k);
    },
    getAttribute(k: string) {
      return this.attributes.get(k) ?? null;
    },
  };
  const fakeWindow = {
    location: { href: url },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    matchMedia: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      {
        provide: DOCUMENT,
        useValue: {
          defaultView: fakeWindow,
          documentElement: fakeElement,
        },
      },
    ],
  });
  return {
    store: TestBed.inject(PreferencesStore),
    storage,
    docEl: fakeElement,
  };
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
    const { store } = setup('https://site.test/?for=hacker', {
      'ah.audience': 'engineer',
    });

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

  it('starts with system theme and toggles to dark and light', () => {
    const { store, storage, docEl } = setup('https://site.test/');

    expect(store.theme()).toBe('system');
    store.toggleTheme();
    expect(store.theme()).toBe('dark');
    expect(storage.get('ah.theme')).toBe('dark');
    expect(docEl.getAttribute('data-theme')).toBe('dark');

    store.toggleTheme();
    expect(store.theme()).toBe('light');
    expect(storage.get('ah.theme')).toBe('light');
    expect(docEl.getAttribute('data-theme')).toBe('light');
  });

  it('restores ?theme= from a shared link and remembers it', () => {
    const { store, storage, docEl } = setup('https://site.test/?theme=dark');

    store.restore();

    expect(store.theme()).toBe('dark');
    expect(storage.get('ah.theme')).toBe('dark');
    expect(docEl.getAttribute('data-theme')).toBe('dark');
  });

  it('restores stored theme from localStorage', () => {
    const { store, docEl } = setup('https://site.test/', {
      'ah.theme': 'dark',
    });

    store.restore();

    expect(store.theme()).toBe('dark');
    expect(docEl.getAttribute('data-theme')).toBe('dark');
  });
});
