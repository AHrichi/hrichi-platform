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

const storageKey = 'ah.audience';

/**
 * Site-wide visitor preferences. Shared as a federation singleton (ADR-0002),
 * so remotes read the same instance as the shell.
 */
export const PreferencesStore = signalStore(
  { providedIn: 'root' },
  withState({ audience: defaultAudience as Audience }),
  withComputed(({ audience }) => ({
    copy: computed(() => audienceCopy[audience()]),
  })),
  withMethods((store) => {
    const window = inject(DOCUMENT).defaultView;

    function readStorage(): string | null {
      try {
        return window?.localStorage.getItem(storageKey) ?? null;
      } catch {
        return null;
      }
    }

    function writeStorage(audience: Audience): void {
      try {
        window?.localStorage.setItem(storageKey, audience);
      } catch {
        // Private mode or blocked storage: the choice just won't persist.
      }
    }

    return {
      setAudience(audience: Audience): void {
        patchState(store, { audience });
        writeStorage(audience);
      },
      /**
       * Applies `?for=` (shared links) or the stored choice. Call it after
       * hydration: prerendered HTML is always the default audience.
       */
      restore(): void {
        const fromUrl = window
          ? new URL(window.location.href).searchParams.get('for')
          : null;
        if (isAudience(fromUrl)) {
          patchState(store, { audience: fromUrl });
          writeStorage(fromUrl);
          return;
        }
        const stored = readStorage();
        if (isAudience(stored)) {
          patchState(store, { audience: stored });
        }
      },
    };
  }),
);
