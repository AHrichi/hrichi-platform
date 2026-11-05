import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from './preferences.store';

function setup(
  url: string,
  stored?: Record<string, string>,
  browser = { language: 'en-GB', dark: false },
) {
  let onSchemeChange: ((event: { matches: boolean }) => void) | null = null;
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
    navigator: { language: browser.language },
    matchMedia: (query: string) => ({
      matches: browser.dark,
      media: query,
      addEventListener: (
        _type: string,
        listener: (event: { matches: boolean }) => void,
      ) => {
        onSchemeChange = listener;
      },
      removeEventListener: () => void 0,
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
    setSystemDark: (matches: boolean) => onSchemeChange?.({ matches }),
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

  it('follows the system colour scheme while the theme is system', () => {
    const { store, setSystemDark } = setup('https://site.test/');

    store.restore();
    expect(store.isDark()).toBe(false);

    setSystemDark(true);
    expect(store.isDark()).toBe(true);

    store.setTheme('light');
    expect(store.isDark()).toBe(false);
  });

  it('prerenders in English, then picks the browser language it speaks', () => {
    const { store, docEl } = setup('https://site.test/', undefined, {
      language: 'ar-TN',
      dark: false,
    });

    expect(store.language()).toBe('en');
    store.restore();

    expect(store.language()).toBe('ar');
    expect(store.isRtl()).toBe(true);
    expect(docEl.getAttribute('dir')).toBe('rtl');
    expect(docEl.getAttribute('lang')).toBe('ar');
  });

  it('falls back to English for a language the site does not speak', () => {
    const { store } = setup('https://site.test/', undefined, {
      language: 'ja-JP',
      dark: false,
    });

    store.restore();

    expect(store.language()).toBe('en');
  });

  it('restores Italian when browser speaks it', () => {
    const { store, docEl } = setup('https://site.test/', undefined, {
      language: 'it-IT',
      dark: false,
    });
    store.restore();
    expect(store.language()).toBe('it');
    expect(store.isRtl()).toBe(false);
    expect(docEl.getAttribute('dir')).toBe('ltr');
    expect(docEl.getAttribute('lang')).toBe('it');
  });

  it('restores German when browser speaks it', () => {
    const { store, docEl } = setup('https://site.test/', undefined, {
      language: 'de-DE',
      dark: false,
    });
    store.restore();
    expect(store.language()).toBe('de');
    expect(store.isRtl()).toBe(false);
    expect(docEl.getAttribute('dir')).toBe('ltr');
    expect(docEl.getAttribute('lang')).toBe('de');
  });

  it('prefers the stored language and remembers a new choice', () => {
    const { store, storage, docEl } = setup('https://site.test/', {
      preferred_language: 'fr',
    });

    store.restore();
    expect(store.language()).toBe('fr');

    store.setLanguage('ar');
    expect(storage.get('preferred_language')).toBe('ar');
    expect(docEl.getAttribute('dir')).toBe('rtl');
  });
});
