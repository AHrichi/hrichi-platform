import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { webcrypto } from 'node:crypto';

setupTestBed();

// jsdom's crypto has no `subtle`; badges, codes and sessions need Web Crypto,
// which Node has (browsers, Workers and Node all do in production).
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}
