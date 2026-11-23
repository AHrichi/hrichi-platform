# ADR-0026: Greenhouse Labor Planner, a harvest staffing app for a farm manager

- **Status:** Accepted
- **Date:** 2026-11-21
- **Milestone:** M2

## Context

A product for a greenhouse **labour manager**, inspired by a job post for that role in Gabès, Tunisia. Every farm, person and number in it is invented. The manager:

- turns a week's expected kg into a production plan and the headcount it needs;
- reports shortages to HR;
- passes instructions to supervisors and workers;
- tracks each worker's speed and quality;
- enforces the hygiene protocol;
- answers for cost per kg and kg output.

There are three roles: the **manager** works at a desk, **supervisors** log work on phones inside greenhouses with poor signal, and **HR** reads.

The farm works in Arabic, French and English; supervisors mostly read Arabic. Units are kg and TND (three decimals: millimes).

The owner's brief suggested Ionic + Capacitor for the phones, Supabase as the backend, and an Nx workspace with a `dashboard` app, a `field` app and a shared `data-model` lib.

## Decision

- **A product in this monorepo, not a new workspace.** It lives under `scope:product-greenhouse`:

  | Project                                | Path                                         | Role                                                               |
  | -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
  | `product-greenhouse-domain`            | `libs/products/greenhouse/domain`            | The brief's `data-model` lib: models, plan, staffing gap (pure TS) |
  | `product-greenhouse-data-access`       | `libs/products/greenhouse/data-access`       | Sign-in, phone database (Dexie), sync, Supabase and demo adapters  |
  | `product-greenhouse-feature-field`     | `libs/products/greenhouse/feature-field`     | Supervisor screens, store, copy                                    |
  | `product-greenhouse-feature-dashboard` | `libs/products/greenhouse/feature-dashboard` | Manager and HR screens, store, copy                                |
  | `product-greenhouse-field`             | `apps/products/greenhouse/field`             | Supervisors' PWA and Capacitor shell, port 4314                    |
  | `product-greenhouse`                   | `apps/products/greenhouse/dashboard`         | Manager's federated remote, port 4313 (not in the shell yet)       |
  | `product-greenhouse-supabase`          | `apps/products/greenhouse/supabase`          | Migrations, RLS, seed and their tests                              |

- **The planning maths is pure and tested.**
  - The formula is `required = expectedKg / (kgPerHour × hoursPerDay)`.
  - A rate is total kg over total hours for the last four weeks: the team on that crop first, then the farm on that crop, then the team on any crop, then the manager's defaults. Crop matters more than team: cherry tomatoes pick at about a third of the kg/hour of tomatoes.
  - Headcount is rounded up per team and day, not per greenhouse, since a team moves between its greenhouses.
  - The staffing gap pools workers across teams for the shortage HR must fill, and also shows each team's own gap so the manager can move people first.

- **Supabase, with security in the database.**
  - Every table carries `farm_id`, and references use composite foreign keys, so a row can't point into another farm.
  - RLS gives each role what it needs: manager, supervisor or HR, per farm.
  - Pay is in its own table (`worker_pay`), so supervisors' phones never receive wages.
  - Work logs are stamped by a trigger (who wrote them, when they arrived).
  - The migrations and seed are tested against **PGlite** (Postgres in WebAssembly), acting as each role. Those tests need no Docker and run in CI.

- **Offline first on the phone.**
  - Every entry is saved to IndexedDB (Dexie) before anything else.
  - The entry's id is a UUID made on the phone, so re-sending is idempotent (`on conflict do nothing`), and the server never duplicates an entry after a lost reply.
  - `WorkLogSync` sends in batches. When the server refuses a batch, it retries one log at a time so one bad entry can't block the rest.
  - A `rev` counter keeps an edit made while its entry is in flight.
  - The app sends after a save, when the network returns, when it's reopened, and every 30 s while anything waits, with exponential back-off.
  - A PWA service worker prefetches the whole app, so it opens with no network.

- **Capacitor without Ionic.**
  - `@ionic/angular` 9 still peers on `zone.js`, and this repo is zoneless (ADR-0004).
  - The field app uses `@ah/ui` tokens and its own large controls instead, sized one step above the design system's largest for gloves and glare.
  - Capacitor 8 wraps the same build for Android.
  - Badges are QR codes read with the `BarcodeDetector` API (Chrome on Android). Typing the code or picking from the list are fallbacks.

- **A design system of its own, on the platform's** ([docs/greenhouse/design-system.md](../greenhouse/design-system.md)).
  - It is a `greenhouse` token look: a green accent and a blue focus ring, through the contrast gate. The gate now checks the scene pairs only for looks that draw scenes.
  - The `product-greenhouse-ui` kit is shared by both apps, with Storybook stories under Greenhouse/UI Kit.
  - **Brand packs** dress the apps for one farm: a `brand.ts`, a CSS override of the accent tokens under `[data-brand]`, and a logo. Only an example pack is committed. A real farm's pack stays out of this public repo and is built privately (`-c brand-*`), because its logo is not ours to publish.
- **Languages.**
  - Both apps speak Arabic, French and English through `PreferencesStore` (ADR-0018).
  - The field app defaults to Arabic until someone picks another language.
  - Arabic uses Latin digits and international separators: `ar-TN` groups thousands with a point, which reads like millimes.
  - Typed Arabic-Indic digits and decimal commas are accepted.

- **The demo comes first.** A build with no Supabase project runs on a seeded sample farm, and that is the build the portfolio loads. The field app sends to a pretend server, with a "no signal" switch to show the offline behaviour; the dashboard keeps changes in memory.

- **Layers, and ports with two adapters** (added with G2 and G3, 2026-11-23).
  - Dependencies point one way: apps → feature libs → data-access → domain. The domain is pure TypeScript and knows nothing of Angular or Supabase.
  - Each app reaches the server through a port: `FieldRemote` for the phone, `FarmRemote` for the dashboard. Each has a Supabase adapter and a demo adapter, and the stores never know which one they hold. Tests use the demo adapter with no delay (`DEMO_FARM_REMOTE`).
  - State lives in NgRx signal stores (`FieldStore`, `FarmStore`), like the rest of the repo. Screens read signals and call store methods; the planning maths stays in pure functions (`buildWeekView`, `withCellKg`, `withTeam`).
  - Sign-in is one class, `GreenhouseAuth`, with a session key per app, so a phone and a desk keep separate sessions.
  - The dashboard writes a change to the screen at once and to the server behind it; if the server refuses, it says why and reloads what the server has.
  - Ids are UUIDs made on the client, `crypto.randomUUID` or `getRandomValues` on plain HTTP, so every write is safe to repeat.

- **What the dashboard needs from the database** (G3, `…_dashboard.sql`).
  - People join a farm by invitation: `invite_member()` adds someone who has an account, otherwise leaves an invitation that a trigger on `auth.users` claims when that email signs up. This relies on email confirmation, which must stay on in a hosted project.
  - `save_plan_row()` writes one greenhouse's week of the plan in a single transaction.
  - `work_totals()` sums the work log per day, team and greenhouse, so history fits under the API's 1,000-row limit.
  - Badge QR codes are drawn by `uqr` (MIT, no dependencies) as one SVG path per badge.

- **Performance and labour cost** (G5, `…_performance.sql`).
  - Rates are ratios of totals (all kg over all hours), never averages of rates. Rankings leave out anyone with fewer than 16 logged hours in the period, where a rate is mostly luck.
  - The server sums per week and team, and per worker, with the labour cost at each worker's current rate. Pay keeps no history, so a raise reprices past weeks; a pay history table would fix that if it matters.
  - The cost per kg counts only the hours whose worker has a rate, and the screen says what share of hours had none.
  - A target holds from the week it is set until the next one, so changing it never rewrites the weeks before.
  - The periods are whole weeks before this one; the week in progress would always look short.

## Consequences

- One shared domain lib keeps the plan, the phone's validation and the database's checks in step. A test checks that the schema's crop list matches the domain's.
- The field app ships no Ionic look. If a native feel matters later, Capacitor plugins (camera barcode scanning, network status) can be added without Ionic.
- Real use still needs a hosted Supabase project, the Android project (`cap add android`) and registering the dashboard in the shell. See `docs/greenhouse/AI_HANDOFF.md`.
- `@supabase/supabase-js` is loaded only when a server is configured, so the demo never downloads it.
