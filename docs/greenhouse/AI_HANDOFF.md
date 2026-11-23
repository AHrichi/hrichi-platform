# AI handoff: Greenhouse Labor Planner (hrichi-platform)

A briefing for whichever AI agent or IDE picks up the Greenhouse Labor Planner. It assumes no memory of earlier sessions. Read it top to bottom before touching code; [AGENTS.md](../../AGENTS.md) has the protocol.

Last updated 2026-11-23:

- **G1, G2 and the design system are merged into `main`.** G1 (foundation) came in through PR [#22](https://github.com/AHrichi/hrichi-platform/pull/22). G2 (supervisor sign-in and real sync, verified against local Supabase), the design system and brand packs, and the tomato demo farm came in through PR [#23](https://github.com/AHrichi/hrichi-platform/pull/23). See [design-system.md](design-system.md).
- **G3 (the dashboard on Supabase) is merged** (PR [#24](https://github.com/AHrichi/hrichi-platform/pull/24)). Its architecture clean-up missed that merge and is in PR [#25](https://github.com/AHrichi/hrichi-platform/pull/25).
- **G5 is done** on `feat/greenhouse-g5-performance` (built on #25): performance and labour cost (G5a), and the hygiene checklist with photos and sign-off (G5b), both verified against local Supabase.
- **Then:** the hosted Supabase project (G2b, waiting on the owner's sign-in) and G4 (§6). Start each phase on a new branch from `main`.

## 0. Resume in five minutes

1. **Get the branch:**

   ```bash
   git fetch origin && git switch main   # or the open phase branch
   ```

   It was built in the worktree `.claude/worktrees/greenhouse-labor`. If that folder still exists, check `git worktree list` first: one agent per checkout.

2. **Install:** run `pnpm install --frozen-lockfile` (Node 24, pnpm 10.34.9).
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-greenhouse*" --output-style=static
   ```

   That's 8 projects and 215 tests.

4. **Read:**
   1. this file;
   2. [ADR-0026](../adr/0026-greenhouse-labor-planner.md);
   3. [the Supabase README](../../apps/products/greenhouse/supabase/README.md).
5. Do the next phase (section 6), then update section 2 here in the same PR.

## 1. What this is

An app for a greenhouse **labour manager**. The manager turns expected kg into a weekly plan and headcount, reports shortages to HR, tracks worker speed and quality, enforces hygiene, and answers for cost per kg. Every farm, name and number in it is invented.

There are three roles:

- the **manager**, on the web dashboard;
- **supervisors**, on phones in greenhouses with poor signal (offline first, Arabic first);
- **HR**, read-only.

It supports Arabic (RTL), French and English. Units are kg and TND.

**Stack:** Angular 22 (zoneless, signals, standalone, OnPush), Nx 24, Native Federation (dashboard), NgRx SignalStore, Dexie, Supabase (Postgres, RLS, Auth, Storage), Capacitor 8, Vitest 4 and PGlite.

There is **no Ionic**: `@ionic/angular` peers on `zone.js` (ADR-0026).

## 2. Status

| Phase                               | State                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1a domain lib                      | Done. Models, ISO-day helpers on the farm clock, `buildRateTable`, `planWeek`, `teamAvailability`, `staffingGap`, `checkWorkLog` and `createWorkLog`, badge parsing, `sampleFarm(weekStart)`. 48 tests, 100% lines.                                                                                                                                                                                                                                              |
| G1b Supabase schema and RLS         | Done. 2 migrations, seed and 23 PGlite tests acting as each role. A mutation check (weakening the pay policy) makes the tests fail.                                                                                                                                                                                                                                                                                                                              |
| G1c offline store and sync          | Done. `FieldDatabase`, `FieldRepository`, `WorkLogSync`, `SupabaseFieldRemote`, `DemoFieldRemote`. 29 tests.                                                                                                                                                                                                                                                                                                                                                     |
| G1d field app (supervisors)         | Done on the **demo** backend. Choose a greenhouse, scan, type or pick a badge, count on big steppers, save on the phone, send when online. Includes the PWA service worker and `capacitor.config.ts` (no `android/` yet).                                                                                                                                                                                                                                        |
| G1e dashboard (manager)             | Done on the **sample farm**. Editable weekly plan, workers per cell, required, available and short per day, KPIs, the HR shortage report (copy, WhatsApp, email, print). It is a remote, not registered in the shell.                                                                                                                                                                                                                                            |
| G2 supervisor sign-in and real sync | Done against **local** Supabase. Covers `FieldAuth` (session in localStorage, works offline), the sign-in screen, sign-in again as the same account when a session ends, sign-out (refused while entries wait), `environment.{local,production}.ts`, and `local-users.mjs`.                                                                                                                                                                                      |
| G2c design system and brand packs   | Done. The `greenhouse` look (contrast-gated), the `product-greenhouse-ui` kit (app bar, buttons, stepper, status chip, scanner, language switch) with **Greenhouse/UI Kit** stories, both apps on the kit, and brand packs (`brands/`, private except `example/`) built with `-c brand-*`.                                                                                                                                                                       |
| G2d tomato demo farm and pitch      | Done. `sampleFarm()` is now a made-up 32 ha tomato glasshouse: compartments A1–B4 (six truss, two cherry), one crew each plus 8 floaters, 122 workers, about 169 t a week, short on Friday. Branded app bars show the pack's organisation and wrap to two rows on phones. The pitch document lives outside the repo (a Claude doc).                                                                                                                              |
| G2b hosted Supabase project         | **Next.** Waiting on the owner's Supabase sign-in (§6).                                                                                                                                                                                                                                                                                                                                                                                                          |
| G3 dashboard on Supabase            | Done against **local** Supabase. Manager and HR sign-in (and sign-up), creating a farm, a `FarmStore` over a `FarmRemote` (Supabase or demo), screens for the plan (saved per greenhouse row, team per row, copy last week, kg picked so far), absences, workers (pay for managers and HR), printable QR badges, teams, greenhouses and people (invitations). HR and supervisors get the same screens read-only.                                                 |
| G4 Android                          | To do: `cap add android`, a camera barcode plugin for phones without `BarcodeDetector`, a network-status plugin.                                                                                                                                                                                                                                                                                                                                                 |
| G5a performance and cost            | Done against **local** Supabase. A **Performance** screen: kg, kg/h, rejected crates and labour cost per kg for the last 4, 8 or 12 whole weeks, week by week against the cost target, teams and workers ranked (16 h minimum), for the farm or one team. Targets are set there and hold until the next; the plan screen shows the week's kg target. Cost is for managers and HR only.                                                                           |
| G5b hygiene checklist               | Done against **local** Supabase. On the phone: each greenhouse's check for the day (fine or not, a note, photos where the farm asks), saved offline with its photos, sent by `HygieneSync` (photos first), signed off and then locked. On the dashboard: the day's checks per greenhouse (failed first), each answer with its note and photos (signed URLs), and the checklist in three languages (add, edit, reorder, retire, or start from the standard list). |
| G6 go live in the portfolio         | To do: register `product-greenhouse` (section 3 list), a `deploy` target, the e2e, the visibility flag.                                                                                                                                                                                                                                                                                                                                                          |

**Verified** (2026-11-23, G5b):

- Lint, test and build for all 8 projects (215 tests, 35 of them PGlite security tests), stylelint, zoneless, format.
- A PGlite test pins down what the phone relies on: upserting over a signed check raises an RLS error (not a silent no-op), and a second check of the same greenhouse and day is refused.
- On local Supabase, as `supervisor@farm.test` in the field app's `local` build: the seed's four-item checklist came with the roster; one item marked not fine with a note, two photos (made with a canvas: the pane has no camera) uploaded to `<farm>/<check>/…jpg`, the check signed and locked. As `manager@farm.test` on the dashboard: Serre 1 signed at 20:08, 1 not fine, the note, and both photos loaded through signed URLs. That check is still in the local database.
- The demo builds: the field app shrinks a 2400×1800 photo to 1600×1200 JPEG, sends it and the check, signs (the chosen answers stay readable when locked); the dashboard shows 6 of 8 signed, B3 started, B4 not started, A2's failed crates item with its note and stand-in photos; adding a French-only item, moving it up and retiring it work; no console errors.

**Verified** (2026-11-23, G5a):

- Lint, test and build for all 8 projects (185 tests, 33 of them PGlite security tests), stylelint, format.
- `…_performance.sql` applies on local Supabase. Signed in as `manager@farm.test` with five weeks of test logs added (then removed): the screen shows 44.5 kg/h and 0.059 TND/kg (about 2.6 TND/h over 44.5 kg/h); a target of 0.065 TND/kg survives a reload.
- The demo build: 8 weeks of the sample farm, 35.4 kg/h, 0.074 TND/kg against 0.075; the cherry-tomato crew B1 is over target (0.182); a new target shows on the plan screen; Arabic lays out right to left; no console errors.

**Verified** (2026-11-23, G3):

- Lint, test and build for all 8 `product-greenhouse*` projects (164 tests after the clean-up below, 29 of them PGlite security tests), stylelint, `pnpm check:zoneless`, `pnpm nx format:check`; `graph.json` regenerated after `nx reset` (265 after the clean-up).
- The new migration applies on the local Supabase stack (`migration up`).
- The dashboard's `local` build in the browser pane, against local Supabase:
  - `manager@farm.test` signs in and the seed farm opens; 324 kg logged by the field app in G2 shows as picked on Monday;
  - choosing Équipe A for Serre 1 and 1200 kg on Monday survives a reload (3.3 workers);
  - a new worker gets badge GH-0013 and pay 2.7; the next suggested badge is GH-0014;
  - an absence (Thursday, "Sick") survives a reload;
  - inviting `lina@farm.test`, then creating that account from the sign-in screen, puts Lina on the farm as a supervisor, with the read-only notice;
  - badges filtered to Équipe B print five cards; the QR path is unit-tested against `uqr`'s matrix;
  - Arabic is RTL; there are no console errors.
- The default (demo) build shows the sample farm as before: 169,400 kg, 10 worker-days short, Friday the shortest day.
- Architecture clean-up afterwards: `FarmStore` became an NgRx signal store with its own tests, data-access split into `auth/`, `remote/`, `field/` and `farm/`, one `newId` (with a plain-HTTP fallback), `isRole`, `upsertById` and `withoutId` in the domain, the plan's cell edit moved into the pure `withCellKg`, and unused copy removed. ADR-0026 records the layering.

**Verified** (2026-11-23, G2):

- Lint, test and build for all 7 projects (123 tests), stylelint, zoneless and format.
- Both migrations and the seed apply on the real Supabase Postgres 17 (`supabase start`, CLI 3.1.0), not only on PGlite.
- End to end in Chrome, with the field app's `local` build against local Supabase:
  - signing in as `supervisor@farm.test` downloads the seed farm;
  - with the API gateway stopped (`docker stop supabase_kong_greenhouse-labor`), a reload opens from cache, still signed in;
  - an entry saved then shows "No signal" and waits;
  - restarting the gateway sends it on its own within about 3 s;
  - in Postgres the row has `recorded_by` = the supervisor (stamped by the server) and the worker's team;
  - sign-out returns to a clean sign-in screen.

**Verified** (2026-11-21, G1):

- Lint, test and build for all 7 `product-greenhouse*` projects (116 tests), `pnpm check:zoneless`, `pnpm nx format:check`, and stylelint on the greenhouse `.scss` files (now in STRICT).
- `export-graph.mjs` regenerated `graph.json`. The constellation and home tests pass.
- The field app in the browser pane:
  - opens in Arabic, RTL;
  - French switches it to LTR;
  - a lower-case typed badge finds the worker;
  - `٢٨` crates parse as 28, and the kg estimate follows;
  - a saved entry shows "not sent yet", then "sent" about 2 s later;
  - with "no signal" on, an entry waits, and is sent when the switch is turned off.
- In headless Chromium (390×844): the service worker activates; the app opens with the network off; an entry survives a reload offline and is sent once the network is back; 2500 kg in 8 h asks for "Save anyway"; there are no page errors.
- The dashboard in the browser pane:
  - it renders with no console errors;
  - editing Serre 1 on Friday to 4000 kg moves Friday from 42 to 45 needed and the gap from 9 to 12, and the report follows;
  - Arabic is RTL.

**Not verified yet:**

- A **hosted** Supabase project. Local is verified.
- Invitation sign-up with email confirmation on (local has it off). The trigger runs at account creation either way.
- Printing the badges on paper, and scanning a printed badge with a phone.
- Signing in again after a session expires (the `auth` path) against a real server; the code path is in place, but only the error mapping is unit-tested.
- Camera scanning with `BarcodeDetector` on a real phone. The browser pane has no camera API, and iOS Safari has no `BarcodeDetector` at all, so typing is the fallback there.
- The Capacitor Android build, the print layout, and the WhatsApp link on a phone.
- Full CI. `package.json` changed, so every project is affected; locally only the greenhouse, constellation and home projects were run.
- The service worker inside the browser pane: it refuses to register service workers on localhost, while headless Chromium accepts them.

## 3. Code map

| Area                              | Location                                     | What's there                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain (pure, `runtime:agnostic`) | `libs/products/greenhouse/domain`            | `dates`, `ids` (`newId`, `upsertById`, `withoutId`), `models` (incl. `WorkerPay`, `Member`, `Invitation`, `isRole`), `productivity`, `planning`, `staffing`, `work-log`, `hygiene` (`checklist`, `hygieneProgress`, `checkHygieneItem`, `STANDARD_HYGIENE_ITEMS`), `performance` (totals, rates, `rank`, `targetFor`, `summarizeLogs`), `setup` (form checks, `nextBadgeCode`, `checkTarget`), `sample` |
| UI kit (prefix `gh`)              | `libs/products/greenhouse/ui`                | `gh-app-bar`, `ghButton`, `gh-stepper`, `gh-status-chip`, `gh-badge-scanner`, `gh-lang-switch`, `GREENHOUSE_BRAND`, `styles/greenhouse.scss`                                                                                                                                                                                                                                                            |
| Data access                       | `libs/products/greenhouse/data-access`       | `auth/` (`GreenhouseAuth`, `GREENHOUSE_SUPABASE`, sign-in errors), `remote/` (`RemoteError`, `callPostgrest`, `classifyFailure`, row mappers, `storage` for the photo bucket), `field/` (`FieldDatabase` v2, `FieldRepository`, `WorkLogSync`, `HygieneSync`, `FieldRemote` and its adapters), `farm/` (`FarmRemote` and its adapters)                                                                  |
| Field feature (prefix `gh`)       | `libs/products/greenhouse/feature-field`     | `FIELD_ROUTES`, `FieldStore` (sync scheduling, hygiene checks), `FieldAuth`, the screens (home, log, hygiene, sign-in), `shrinkPhoto`                                                                                                                                                                                                                                                                   |
| Dashboard feature                 | `libs/products/greenhouse/feature-dashboard` | `GREENHOUSE_DASHBOARD_ROUTES`, `FarmStore` (signal store, `DEMO_FARM_REMOTE`), `DashboardAuth`, `buildWeekView` and row helpers, `shortageReport`, `buildPerformanceView`, `buildHygieneView`, the screens (plan, performance, hygiene, absences, workers, badges, teams, greenhouses, people)                                                                                                          |
| Field app                         | `apps/products/greenhouse/field`             | Port 4314, `ngsw-config.json`, `capacitor.config.ts`, app mode `embedded-demo` until G2                                                                                                                                                                                                                                                                                                                 |
| Dashboard app                     | `apps/products/greenhouse/dashboard`         | Remote `product-greenhouse`, port 4313, exposes `./routes` and `./meta`; `-c local` talks to local Supabase, the default build is the demo; no `deploy` target                                                                                                                                                                                                                                          |
| Supabase                          | `apps/products/greenhouse/supabase`          | `migrations/`, `seed.sql`, `config.toml`, `spec/` (PGlite)                                                                                                                                                                                                                                                                                                                                              |

**Registration done in G1:**

- path aliases in `tsconfig.base.json`;
- the `scope:product-greenhouse` rule in `eslint.config.mjs`;
- the STRICT paths in `stylelint.config.mjs`;
- `.claude/launch.json` static previews on 4313 and 4314;
- the icon set (`generate-app-icons.mjs`, key `greenhouse-field`);
- `graph.json`.

**Left for G6 (go live):**

- `tools/federation/remotes.json`;
- the shell's `federation.manifest.json` and route `/apps/greenhouse`;
- `app-visibility.ts`;
- the apps hub card in `apps-page.ts`;
- constellation labels;
- the shell e2e;
- the `deploy` target (CI deploys every affected project that has one, so add it together with the registration).

## 4. Hard rules

These come from the platform (see AGENTS.md and the System Design technical design §0, which the platform shares).

- **Module boundaries:**
  - `type:domain` imports nothing but `type:util`, and is `runtime:agnostic` (no Angular).
  - `type:data-access` never imports `@ah/platform/*`; the feature passes the database name in.
  - The two feature libs can't import each other.
- **Styles:** tokens only (no hex), logical properties, `.scss` files only. The greenhouse paths are STRICT in stylelint.
- **Components:** standalone, OnPush, signal inputs and outputs, `inject()`, `@if` and `@for`. Template accessibility rules are errors (`legacy` is off).
- **Copy:** every visible string is in `copy.{en,fr,ar}.ts`. Avoid plurals in templates (`short by {n}`): Arabic has six plural forms.
- **Security:**
  - Pay stays in `worker_pay`.
  - The phone never sets `recorded_by` or `synced_at`.
  - Any new table needs RLS plus a test in `spec/security.spec.ts`, run against a deliberately broken policy to prove it can fail.
- **Clean room:** no real farm, employer or worker names.

## 5. Commands and gotchas

```bash
pnpm nx run-many -t lint test build -p "product-greenhouse*" --output-style=static
pnpm nx test product-greenhouse-supabase        # migrations + RLS on PGlite, no Docker
pnpm exec stylelint "libs/products/greenhouse/**/*.scss" "apps/products/greenhouse/**/*.scss"
node tools/scripts/export-graph.mjs             # after adding projects; commit graph.json
pnpm nx build product-greenhouse-field && node tools/scripts/serve-static.mjs dist/apps/products/greenhouse/field/browser 4314
pnpm nx build product-greenhouse && node tools/scripts/serve-static.mjs dist/apps/products/greenhouse/dashboard/browser 4313
```

Gotchas:

- **Dexie in tests** keeps the first `indexedDB` it sees. Give each test its own database name; swapping `globalThis.indexedDB` does nothing.
- **The browser pane's preview tool** reads `.claude/launch.json` from the **main** checkout. In a worktree, start the static server yourself and open its URL.
- **The service worker** only runs in production builds. Check offline behaviour in headless Chromium with `context.setOffline(true)`.
- **With the service worker active, a request that can't be sent comes back as an empty HTTP 504**, not a network error. `classifyFailure` treats a 504 with no database error code as "offline".
- **Supabase CLI:** use `npx -y supabase@3.1.0 --workdir apps/products/greenhouse …`. `pnpm dlx` skips the postinstall that downloads its binary.
- **A rebuilt app in Chrome** keeps running the old build until the service worker updates. Reload twice, or call `registration.update()` first.
- **Photos in the browser pane:** it has no camera. Make a `File` from a canvas, put it in a `DataTransfer`, set the file input's `files` and dispatch `change`. Stub `window.confirm` in the page before signing.

## 6. Next step: the hosted Supabase project, then G4

1. **Hosted project** (G2b). The owner signs in to supabase.com; agents can't type passwords.
   - Create a free project named `greenhouse-labor` in the region closest to Tunisia (`eu-west-3`, Paris). Use the "Generate a password" button for the database password; nothing here needs it.
   - Run the migrations in order, then `seed.sql` if the demo farm is wanted, in the dashboard's SQL editor. The CLI's `db push` works too, but needs an access token and the database password.
   - Put the project URL and **publishable** key (never the secret key) in the field app's `environment.production.ts`, and in a new `environment.production.ts` for the dashboard with a `production` file replacement. The dashboard's default build must stay the demo while it is the portfolio's remote; give the real one its own configuration.
   - Auth: turn email confirmations on, and set the site URL to wherever the field app is hosted.
   - The owner creates their account on the dashboard's sign-in screen, creates the farm there, and invites supervisors and HR from **People**.
2. **Left over from G3:** a "create account" link in the field app (supervisors can use the dashboard's for now); editing a member's name. (Targets were done in G5a.)
3. **G4 Android** (the table in §2), then **G6** (go live in the portfolio).
