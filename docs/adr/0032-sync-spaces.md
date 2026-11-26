# ADR-0032: Sync spaces, cloud sync without accounts, on a Worker and D1

- **Status:** Accepted
- **Date:** 2026-11-26
- **Milestone:** M2

## Context

The owner asked for backend support so SerraCalc's projects follow a user from phone to tablet to computer. It must cost nothing and stay easy to move to another database or cloud.

What the repo had:

- SerraCalc is local-first: projects live in IndexedDB, and backups are files.
- The Learning Engine and StudyLM sync one owner's devices: pairing goes through Telegram, data lives in Mongo on Render, and conflicts are last-writer-wins.
- Render's free hours are shared by four products, so public sync there would put them all at risk.

The owner chose a Cloudflare Worker with D1.

## Decision

**Sync spaces, with no accounts.**

- Sync is opt-in. Local-first and offline stay the default.
- The first device starts a space and gets a signed device token.
- Another device joins with a one-use code that a device already in the space shows:
  - 8 Crockford base32 characters (`4K7Q-9XMD`, about 40 bits);
  - it lasts ten minutes and works once;
  - the server keeps only its hash, and limits guesses per IP;
  - it can also be passed as a link, `/projects#link=CODE`. The part after `#` never reaches a server, and the link only fills the code in.
- Devices are listed and can be removed; a removed device's token stops working at once.
- "Delete the cloud copy" removes everything on the server, and a space idle for a year is deleted.
- No Telegram, email or password.

**Records, so concurrent edits survive.** An app turns its data into records: a kind, a key, the time, and the device that wrote it. Deletions are tombstones, so other devices learn of them.

SerraCalc's records:

| Kind          | Key            | Data                                     |
| ------------- | -------------- | ---------------------------------------- |
| `project`     | project id     | The project without its parts and time   |
| `calculation` | `projectId:id` | One saved result                         |
| `log`         | `projectId:id` | One log entry                            |
| `readings`    | project id     | Its imported readings                    |
| `site`        | site name      | Its plants and tariffs, without its time |

Two devices editing different results of one project both keep theirs. Saving a result doesn't rewrite the project's record, so it can't undo a title changed elsewhere.

**The conflict rule** is the later edit, then the larger device id: the same rule on every device and on the server.

- The server never stores an older version over a newer one, even when two pushes race.
- On a device, a pulled record older than an edit still in the outbox waits, and a newer one replaces the edit.
- A device's clock more than five minutes ahead is refused and asked to be fixed.

**Five pieces:**

- **`@ah/shared/sync`** (shared by browser, server and apps): records, the conflict rule, device tokens (`s1.<space>.<device>.<expiry>.<HMAC>` over Web Crypto, 180 days, renewed in the last 30), linking codes, the wire format, limits, and each app's `SyncAppSpec` (its kinds and their sizes).
- **`@ah/shared/sync-server`**:
  - `SyncService`, with every endpoint as a plain function over a `SyncRepository` port.
  - `runSyncRepositoryContract` (in `@ah/shared/sync-server/testing`): what every store must pass, tenant isolation included.
  - An in-memory store.
- **`apps/sync-edge`**, the Worker:
  - The D1 store (`migrations/0001_init.sql`), which passes the contract on Node's own SQLite.
  - CORS by exact origin, bodies capped, rate limits per IP (stricter for starting a space and trying a code), no caching, and logs that never carry records.
  - Crashes answer in the protocol, and a daily sweep runs.
  - CI deploys it with `deploy.mjs`: migrations first, and nothing until the database exists.
- **`@ah/platform/sync`**, the client: `SyncEngine` and `provideSync`. The app keeps its data and an outbox; the engine pushes and pulls in rounds:
  - shortly after a change, when back online, when the page is in view again, and every five minutes;
  - one tab at a time (Web Locks), the others told (BroadcastChannel);
  - failures retry, longer each time;
  - a removed device stops and keeps its data.
- **SerraCalc:**
  - The database goes to version 3 with an outbox, written in the same transaction as the change it stands for.
  - A Cloud sync panel on Projects, in five languages.
  - Inside the portfolio's demo, sync is left to the app.

## Consequences

**Zero cost:**

| Free tier | Allowance                                         | When it runs out                                       |
| --------- | ------------------------------------------------- | ------------------------------------------------------ |
| D1        | 5M reads and 100K writes a day, 500 MB a database | Sync waits and retries; local data and the outbox stay |
| Workers   | 100K requests a day, shared                       | Shared with `learning-edge` and `assistant-edge`       |

A space holds at most 5,000 records and 20 MB, and a record at most 128 KB.

**The owner's one-time steps** (in the hand-off) are to create the database, allow the CI token to edit D1, and set `SYNC_TOKEN_SECRET`. Until then the deploy skips the Worker, and the panel says sync isn't available.

**Moving later:**

- Another database: one `SyncRepository` adapter that passes the contract (Turso, Postgres, Mongo).
- Another host: `SyncService` is plain functions; a Nest controller could serve it.
- Another app: a `SyncAppSpec`, the outbox in its storage, and `provideSync`. `libs/platform/sync/README.md` has the recipe.

**Privacy:** the panel says what is kept and where before sync is turned on. Records are the app's data; the server checks only their kind and size, and logs none of it.

**Testing:**

- The contracts, tokens and codes.
- The service: linking, conflicts, refusals, quotas, rounds, removal, renewal and the sweep.
- The repository contract, on memory and on SQLite.
- The Worker through its handler.
- The engine: two devices against the real service in memory, an edit made while a pull is on its way, a fast clock, a removed device.
- SerraCalc's records and the outbox over fake IndexedDB.
- The e2e: two browser contexts as two devices against the real service.
- In the browser against `wrangler dev` with local D1: turn on, link a code to a second device, which pulled all 11 records, then a rename made there arrived back.
