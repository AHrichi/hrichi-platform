import { effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals';
import type { DispatchState } from './dispatch.state';

const STORAGE_KEY = 'ah_pulseops_state_scratch_v2';

export function withDispatchHooks() {
  return signalStoreFeature(
    { state: type<DispatchState>() },
    withHooks((state) => {
      const platformId = inject(PLATFORM_ID);
      const isBrowser = isPlatformBrowser(platformId);

      return {
        onInit() {
          if (!isBrowser) return () => undefined;

          // 1. Restore state from localStorage if available
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              patchState(state, {
                orders: parsed.orders ?? state.orders(),
                drivers: parsed.drivers ?? state.drivers(),
                subcontractors: parsed.subcontractors ?? state.subcontractors(),
                stock: parsed.stock ?? state.stock(),
                messages: parsed.messages ?? state.messages(),
                incidents: parsed.incidents ?? state.incidents(),
                activeShift: parsed.activeShift ?? state.activeShift(),
              });
            }
          } catch {
            // Ignore parse errors, fallback to default state
          }

          // 2. Auto-persist changes to localStorage
          effect(() => {
            const snapshot = {
              orders: state.orders(),
              drivers: state.drivers(),
              subcontractors: state.subcontractors(),
              stock: state.stock(),
              messages: state.messages(),
              incidents: state.incidents(),
              activeShift: state.activeShift(),
            };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
            } catch {
              // Ignore storage errors (e.g. quota exceeded)
            }
          });

          // 3. Live London time clock
          const updateLondonTime = () => {
            try {
              const now = new Date();
              const timeString = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Europe/London',
                hour: '2-digit',
                minute: '2-digit',
              }).format(now);
              patchState(state, { londonTime: timeString });
            } catch {
              // fallback
            }
          };

          updateLondonTime();
          const timerId = setInterval(updateLondonTime, 30_000);

          return () => {
            clearInterval(timerId);
          };
        },
      };
    }),
  );
}
