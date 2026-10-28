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
  audienceCopy,
  defaultAudience,
  isAudience,
} from '@ah/shared/content';

const audienceStorageKey = 'ah.audience';
const themeStorageKey = 'ah.theme';

export type ThemePreference = 'system' | 'light' | 'dark';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
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

/**
 * Site-wide visitor preferences. Shared as a federation singleton (ADR-0002),
 * so remotes read the same instance as the shell.
 */
export const PreferencesStore = signalStore(
  { providedIn: 'root' },
  withState({
    audience: defaultAudience as Audience,
    theme: 'system' as ThemePreference,
  }),
  withComputed(({ audience, theme }) => ({
    copy: computed(() => audienceCopy[audience()]),
    isDark: computed(() => {
      const pref = theme();
      if (pref === 'dark') return true;
      if (pref === 'light') return false;
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
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

        if (window && window.matchMedia) {
          const mql = window.matchMedia('(prefers-color-scheme: dark)');
          const listener = () => {
            if (store.theme() === 'system') {
              patchState(store, { theme: 'system' });
            }
          };
          try {
            mql.addEventListener('change', listener);
          } catch {
            mql.addListener?.(listener);
          }
        }
      },
    };
  }),
);
