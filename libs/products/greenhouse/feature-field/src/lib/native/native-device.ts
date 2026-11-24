import type { Provider } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NETWORK_STATUS, type NetworkStatus } from '../network/network-status';
import {
  NATIVE_BADGE_SCANNER,
  type NativeBadgeScanner,
} from '@ah/products/greenhouse/ui';

/**
 * Inside the Android app (ADR-0026, G4): badges are read with the Google code
 * scanner and the connection comes from the phone's radios. In a browser
 * nothing changes. The plugins load on first use, so the PWA never fetches
 * them.
 */
export function provideNativeDevice(): Provider[] {
  if (!Capacitor.isNativePlatform()) return [];
  return [
    { provide: NATIVE_BADGE_SCANNER, useValue: googleCodeScanner() },
    { provide: NETWORK_STATUS, useValue: capacitorNetwork() },
  ];
}

/** Play Services' own scanner screen: no camera permission for the app. */
export function googleCodeScanner(): NativeBadgeScanner {
  return {
    async scan() {
      const { BarcodeScanner, BarcodeFormat } =
        await import('@capacitor-mlkit/barcode-scanning');
      const { available } =
        await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!available) await installScannerModule();
      try {
        const { barcodes } = await BarcodeScanner.scan({
          formats: [BarcodeFormat.QrCode],
        });
        return barcodes.find((b) => b.rawValue)?.rawValue ?? null;
      } catch (error) {
        if (isCancelled(error)) return null;
        throw error;
      }
    },
  };
}

/** How long to wait for Play Services to fetch the scanner module. */
const INSTALL_TIMEOUT_MS = 60_000;

/**
 * The module normally arrives with the app (the manifest asks for it). If it
 * hasn't, fetch it now; with no signal this fails and the badge is typed.
 */
async function installScannerModule(): Promise<void> {
  const { BarcodeScanner, GoogleBarcodeScannerModuleInstallState: State } =
    await import('@capacitor-mlkit/barcode-scanning');
  let settle: (ok: boolean) => void = () => undefined;
  const done = new Promise<boolean>((resolve) => (settle = resolve));
  const listener = await BarcodeScanner.addListener(
    'googleBarcodeScannerModuleInstallProgress',
    ({ state }) => {
      if (state === State.COMPLETED) settle(true);
      if (state === State.FAILED || state === State.CANCELED) settle(false);
    },
  );
  const timer = setTimeout(() => settle(false), INSTALL_TIMEOUT_MS);
  try {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    if (!(await done)) throw new Error('Scanner module not installed');
  } finally {
    clearTimeout(timer);
    await listener.remove();
  }
}

/** The plugin rejects with this message when the person backs out. */
export function isCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel/i.test(message);
}

/** Capacitor's Network plugin: the phone's own view of its connection. */
export function capacitorNetwork(): NetworkStatus {
  const plugin = () =>
    import('@capacitor/network').then(({ Network }) => Network);
  return {
    async online() {
      const status = await (await plugin()).getStatus();
      return status.connected;
    },
    watch(onChange) {
      let stopped = false;
      const handle = plugin().then((network) =>
        network.addListener('networkStatusChange', (status) => {
          if (!stopped) onChange(status.connected);
        }),
      );
      return () => {
        stopped = true;
        void handle.then((h) => h.remove());
      };
    },
  };
}
