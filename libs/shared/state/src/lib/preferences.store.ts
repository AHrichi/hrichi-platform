import { DOCUMENT } from '@angular/common';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  type Audience,
  defaultAudience,
  getAudienceCopy,
  isAudience,
} from '@ah/shared/content';

const audienceStorageKey = 'ah.audience';
const themeStorageKey = 'ah.theme';
export const languageStorageKey = 'preferred_language';

export type ThemePreference = 'system' | 'light' | 'dark';
export type SiteLanguage = 'fr' | 'ar' | 'en' | 'it' | 'de';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function isSiteLanguage(value: unknown): value is SiteLanguage {
  return (
    value === 'fr' ||
    value === 'ar' ||
    value === 'en' ||
    value === 'it' ||
    value === 'de'
  );
}

function applyThemeToDocument(
  doc: Document | null,
  theme: ThemePreference,
): void {
  if (!doc) return;
  const root = doc.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
}

function applyLanguageToDocument(
  doc: Document | null,
  lang: SiteLanguage,
): void {
  if (!doc) return;
  const root = doc.documentElement;
  root.setAttribute('lang', lang);
  root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}

/**
 * Site-wide visitor preferences. Shared as a federation singleton (ADR-0002),
 * so remotes read the same instance as the shell.
 */
export const PreferencesStore = signalStore(
  { providedIn: 'root' },
  withState({
    audience: defaultAudience as Audience,
    theme: 'system' as ThemePreference,
    // The site is written in English first; prerendered pages are English.
    language: 'en' as SiteLanguage,
    /** The OS colour scheme, followed while the theme is 'system'. */
    systemDark: false,
  }),
  withComputed(({ audience, theme, language, systemDark }) => ({
    copy: computed(() => getAudienceCopy(audience(), language())),
    isRtl: computed(() => language() === 'ar'),
    isDark: computed(() => {
      const pref = theme();
      return pref === 'system' ? systemDark() : pref === 'dark';
    }),
  })),
  withMethods((store) => {
    const doc = inject(DOCUMENT);
    const window = doc.defaultView;

    function readStorage(key: string): string | null {
      try {
        return window?.localStorage.getItem(key) ?? null;
      } catch {
        return null;
      }
    }

    function writeStorage(key: string, value: string): void {
      try {
        window?.localStorage.setItem(key, value);
      } catch {
        // Private mode or blocked storage: the choice just won't persist.
      }
    }

    return {
      setAudience(audience: Audience): void {
        patchState(store, { audience });
        writeStorage(audienceStorageKey, audience);
      },
      setTheme(theme: ThemePreference): void {
        patchState(store, { theme });
        writeStorage(themeStorageKey, theme);
        applyThemeToDocument(doc, theme);
      },
      setLanguage(language: SiteLanguage): void {
        patchState(store, { language });
        writeStorage(languageStorageKey, language);
        applyLanguageToDocument(doc, language);
      },
      toggleTheme(): void {
        const next: ThemePreference = store.isDark() ? 'light' : 'dark';
        patchState(store, { theme: next });
        writeStorage(themeStorageKey, next);
        applyThemeToDocument(doc, next);
      },
      /**
       * Applies `?for=` / `?theme=` (shared links) or the stored choice. Call it after
       * hydration: prerendered HTML is always the default audience and system theme.
       */
      restore(): void {
        const fromUrl = window
          ? new URL(window.location.href).searchParams.get('for')
          : null;
        if (isAudience(fromUrl)) {
          patchState(store, { audience: fromUrl });
          writeStorage(audienceStorageKey, fromUrl);
        } else {
          const stored = readStorage(audienceStorageKey);
          if (isAudience(stored)) {
            patchState(store, { audience: stored });
          }
        }

        // The stored choice, else the browser's language if the site speaks it.
        const storedLang = readStorage(languageStorageKey);
        const browserLang = window?.navigator?.language
          ?.slice(0, 2)
          .toLowerCase();
        const language: SiteLanguage = isSiteLanguage(storedLang)
          ? storedLang
          : isSiteLanguage(browserLang)
            ? browserLang
            : 'en';
        patchState(store, { language });
        applyLanguageToDocument(doc, language);

        const themeFromUrl = window
          ? new URL(window.location.href).searchParams.get('theme')
          : null;
        if (isThemePreference(themeFromUrl)) {
          patchState(store, { theme: themeFromUrl });
          writeStorage(themeStorageKey, themeFromUrl);
          applyThemeToDocument(doc, themeFromUrl);
        } else {
          const storedTheme = readStorage(themeStorageKey);
          if (isThemePreference(storedTheme)) {
            patchState(store, { theme: storedTheme });
            applyThemeToDocument(doc, storedTheme);
          } else {
            applyThemeToDocument(doc, 'system');
          }
        }

        const scheme = window?.matchMedia?.('(prefers-color-scheme: dark)');
        if (scheme) {
          patchState(store, { systemDark: scheme.matches });
          scheme.addEventListener('change', (event) =>
            patchState(store, { systemDark: event.matches }),
          );
        }
      },
    };
  }),
);
