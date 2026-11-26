# platform-sync (`@ah/platform/sync`)

An app's opt-in cloud sync on one device (ADR-0032). The app keeps its data and an outbox of changes. `SyncEngine` pushes the outbox, pulls what other devices changed, and keeps the device's place in its space. No accounts: a device joins a space with a one-use code from a device already in it.

The server side is `apps/sync-edge` (a Cloudflare Worker on D1) over `@ah/shared/sync-server`. The contract between them is `@ah/shared/sync`.

## Add sync to an app

1. **Say what syncs**, in the app's domain library, and register it on the Worker (`SPECS` in `apps/sync-edge/src/worker.ts`, and the app's origins in `ALLOWED_ORIGINS`):

   ```ts
   export const MY_SYNC = {
     app: 'myapp',
     kinds: { item: { maxBytes: 32_768 }, note: { maxBytes: 8_192 } },
   } as const satisfies SyncAppSpec;
   ```

   Split large things into records that change on their own (SerraCalc sends a project, each saved result, each log entry). Two devices editing different records both keep their edits; the same record, the later edit wins.

2. **Keep an outbox** in the app's storage, written in the same transaction as each change, while sync is on:

   ```ts
   const device = readSyncState(syncStateKey('myapp'))?.deviceId; // null: sync is off
   // in the change's transaction:
   outbox.put({
     id: recordId(record),
     record: {
       kind,
       key,
       updatedAt: new Date().toISOString(),
       by: device,
       data,
     },
   });
   ```

   Read the device id fresh at each save, so every tab writes the outbox once sync is on. A deletion is a record with `deleted: true` and no data.

3. **Answer the engine** (`SyncLocalStore`):
   - `outbox()`;
   - `acknowledge(records)`: remove an entry only if its `updatedAt` is the one pushed, since a newer edit must still go;
   - `apply(records)`: save other devices' records, checked as you'd check a backup;
   - `queueAll(deviceId)`: everything, each with the time it last changed;
   - `clearOutbox()`.

4. **Provide it** in the component that holds the app (its shell), and tell it of changes:

   ```ts
   providers: [provideSync(() => ({ app: 'myapp', local, onPulled: () => store.refresh() }))],
   // after an outbox write: inject(SyncEngine).changed();
   ```

5. **Show it:** `turnOn(name)`, `join(code, name)`, `linkCode()`, `devices()`, `removeDevice(id)`, `turnOffHere()`, `deleteCloudCopy()`, `syncNow()`; and the signals `on`, `status`, `problem`, `usage`, `lastSyncAt`. SerraCalc's `ui/sync-panel` is the full example: the words, the code with its countdown, the devices list and the ways out. `deviceKind()` gives a default name for the device.

6. **Point it at the Worker:** `syncUrl` in `tools/hosting/environments.json` goes into `site-config.json`.

## Run it locally

1. Copy `apps/sync-edge/.dev.vars.example` to `.dev.vars` (ignored by git).
2. Create the local database:

   ```bash
   pnpm exec wrangler d1 migrations apply sync-edge --local --config apps/sync-edge/wrangler.jsonc
   ```

3. Start the Worker on :8789: the `sync-edge (wrangler dev)` launch config, or `pnpm nx serve sync-edge`.
4. Build the app and write its development config: `node tools/scripts/prepare-hosting.mjs <dist>/browser --env development --cors --site-config`.

## Tests

- `pnpm nx test platform-sync`: two devices against the real `SyncService` in memory. They cover:
  - linking, and both devices ending up with both devices' data;
  - the later of two edits winning;
  - an edit made while a pull is on its way;
  - rounds;
  - a fast clock;
  - a removed device;
  - turning off, and deleting the cloud copy.
- In an app's e2e, answer the sync URL from an in-process `SyncService` with `page.route`, one browser context per device (see `apps/portfolio/shell-e2e/src/serracalc.spec.ts`).
