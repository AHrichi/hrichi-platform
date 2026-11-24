import { InjectionToken } from '@angular/core';

/**
 * A scanner the device brings itself, such as the Android app's Google code
 * scanner. It opens its own camera screen, so the page needs no camera.
 */
export interface NativeBadgeScanner {
  /**
   * Reads one QR code: its text, or `null` when the person cancels. It
   * throws when the device can't scan at all.
   */
  scan(): Promise<string | null>;
}

/** `null` (the default) means the browser's camera and `BarcodeDetector`. */
export const NATIVE_BADGE_SCANNER =
  new InjectionToken<NativeBadgeScanner | null>('NATIVE_BADGE_SCANNER', {
    factory: () => null,
  });
