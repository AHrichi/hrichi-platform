import { DOCUMENT, inject, InjectionToken } from '@angular/core';

/**
 * Whether the phone has a connection, and word when that changes. The
 * browser's `online`/`offline` events by default; the Android app provides
 * Capacitor's Network plugin, which follows the phone's own radios.
 */
export interface NetworkStatus {
  /** The current state, as far as the device knows. */
  online(): Promise<boolean>;
  /** Calls back on every change; the returned function stops listening. */
  watch(onChange: (online: boolean) => void): () => void;
}

/** The browser's view: `navigator.onLine` and the window's events. */
export function browserNetworkStatus(win: Window | null): NetworkStatus {
  return {
    online: async () => win?.navigator.onLine !== false,
    watch(onChange) {
      if (!win) return () => undefined;
      const up = () => onChange(true);
      const down = () => onChange(false);
      win.addEventListener('online', up);
      win.addEventListener('offline', down);
      return () => {
        win.removeEventListener('online', up);
        win.removeEventListener('offline', down);
      };
    },
  };
}

export const NETWORK_STATUS = new InjectionToken<NetworkStatus>(
  'NETWORK_STATUS',
  { factory: () => browserNetworkStatus(inject(DOCUMENT).defaultView) },
);
