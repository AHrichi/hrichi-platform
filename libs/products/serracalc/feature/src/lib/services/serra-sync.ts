import { inject, type Provider } from '@angular/core';
import { provideSync } from '@ah/platform/sync';
import { SERRA_SYNC } from '@ah/products/serracalc/domain';
import { SerraStore } from '../store/serra.store';
import { SerraDbService } from './serra-db.service';

/**
 * SerraCalc's cloud sync (ADR-0032), for the shell's providers: the
 * projects' database is its outbox and where pulled records go, and the
 * store reloads after a pull.
 */
export function provideSerraSync(): Provider[] {
  return provideSync(() => {
    const db = inject(SerraDbService);
    const store = inject(SerraStore);
    return {
      app: SERRA_SYNC.app,
      local: {
        outbox: () => db.syncOutbox(),
        acknowledge: (records) => db.syncAcknowledge(records),
        apply: (records) => db.syncApply(records),
        queueAll: (deviceId) => db.syncQueueAll(deviceId),
        clearOutbox: () => db.syncClearOutbox(),
      },
      onPulled: () => void store.refresh(),
    };
  });
}
