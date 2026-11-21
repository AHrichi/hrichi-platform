# AI handoff: Greenhouse Labor Planner (hrichi-platform)

A briefing for whichever AI agent or IDE picks up the Greenhouse Labor Planner. It assumes no memory of earlier sessions. Read it top to bottom before touching code; [AGENTS.md](../../AGENTS.md) has the protocol.

Last updated 2026-11-21: **phase G1 (foundation) is done** on `feat/greenhouse-p1-foundation`, not merged. It has no PR yet.

## 0. Resume in five minutes

1. **Get the branch:**

   ```bash
   git fetch origin && git switch feat/greenhouse-p1-foundation
   ```

   It was built in the worktree `.claude/worktrees/greenhouse-labor`. If that folder still exists, check `git worktree list` first: one agent per checkout.

2. **Install:** run `pnpm install --frozen-lockfile` (Node 24, pnpm 10.34.9).
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-greenhouse*" --output-style=static
   ```

   That's 7 projects and 116 tests.

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

| Phase                               | State                                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1a domain lib                      | Done. Models, ISO-day helpers on the farm clock, `buildRateTable`, `planWeek`, `teamAvailability`, `staffingGap`, `checkWorkLog` and `createWorkLog`, badge parsing, `sampleFarm(weekStart)`. 48 tests, 100% lines.       |
| G1b Supabase schema and RLS         | Done. 2 migrations, seed and 23 PGlite tests acting as each role. A mutation check (weakening the pay policy) makes the tests fail.                                                                                       |
| G1c offline store and sync          | Done. `FieldDatabase`, `FieldRepository`, `WorkLogSync`, `SupabaseFieldRemote`, `DemoFieldRemote`. 29 tests.                                                                                                              |
| G1d field app (supervisors)         | Done on the **demo** backend. Choose a greenhouse, scan, type or pick a badge, count on big steppers, save on the phone, send when online. Includes the PWA service worker and `capacitor.config.ts` (no `android/` yet). |
| G1e dashboard (manager)             | Done on the **sample farm**. Editable weekly plan, workers per cell, required, available and short per day, KPIs, the HR shortage report (copy, WhatsApp, email, print). It is a remote, not registered in the shell.     |
| G2 supervisor sign-in and real sync | **Next.**                                                                                                                                                                                                                 |
| G3 dashboard on Supabase            | To do: setup screens (greenhouses, teams, workers, printable QR badges), plan and absences saved, the report reading real data.                                                                                           |
| G4 Android                          | To do: `cap add android`, a camera barcode plugin for phones without `BarcodeDetector`, a network-status plugin.                                                                                                          |
| G5 performance, hygiene, cost       | To do: kg/h and rejection-rate rankings and trends, the hygiene checklist with photos and sign-off, labour cost per kg against target.                                                                                    |
| G6 go live in the portfolio         | To do: register `product-greenhouse` (section 3 list), a `deploy` target, the e2e, the visibility flag.                                                                                                                   |

**Verified** (2026-11-21):

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

- A real Supabase project, local or hosted. Docker wasn't running, and nothing calls Supabase until G2.
- Camera scanning with `BarcodeDetector` on a real phone. The browser pane has no camera API, and iOS Safari has no `BarcodeDetector` at all, so typing is the fallback there.
- The Capacitor Android build, the print layout, and the WhatsApp link on a phone.
- Full CI. `package.json` changed, so every project is affected; locally only the greenhouse, constellation and home projects were run.
- The service worker inside the browser pane: it refuses to register service workers on localhost, while headless Chromium accepts them.

## 3. Code map

| Area                              | Location                                     | What's there                                                                                                     |
| --------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Domain (pure, `runtime:agnostic`) | `libs/products/greenhouse/domain`            | `dates`, `models` (incl. `WorkerPay`), `productivity`, `planning`, `staffing`, `work-log`, `sample`              |
| Data access                       | `libs/products/greenhouse/data-access`       | `FieldDatabase` v1, `FieldRepository`, `WorkLogSync`, `FieldRemote` and `RemoteError`, Supabase and demo remotes |
| Field feature (prefix `gh`)       | `libs/products/greenhouse/feature-field`     | `FIELD_ROUTES`, `FieldStore` (sync scheduling), `GREENHOUSE_SUPABASE` token, `gh-stepper`, `gh-badge-scanner`    |
| Dashboard feature                 | `libs/products/greenhouse/feature-dashboard` | `GREENHOUSE_DASHBOARD_ROUTES`, `buildWeekView`, `withExpectedKg`, `shortageReport`, `PlanScreen`                 |
| Field app                         | `apps/products/greenhouse/field`             | Port 4314, `ngsw-config.json`, `capacitor.config.ts`, app mode `embedded-demo` until G2                          |
| Dashboard app                     | `apps/products/greenhouse/dashboard`         | Remote `product-greenhouse`, port 4313, exposes `./routes` and `./meta`; no `deploy` target                      |
| Supabase                          | `apps/products/greenhouse/supabase`          | `migrations/`, `seed.sql`, `config.toml`, `spec/` (PGlite)                                                       |

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

## 6. Next step: G2, supervisor sign-in and real sync

Goal: a supervisor signs in once while online, downloads the farm, logs work offline, and the entries reach Supabase.

1. **Config.** Provide `GREENHOUSE_SUPABASE` (URL and anon key) from `@ah/shared/site-config`, or an environment file. Switch the field app to `provideAppMode('standalone')` when it's configured, and keep `embedded-demo` otherwise.
2. **Sign-in screen** in `feature-field`:
   - email and password, or a phone OTP if the farm prefers it;
   - supabase-js keeps the session in `localStorage`, so it survives offline restarts;
   - on an `auth` sync state, send the supervisor to sign-in;
   - copy in all three languages.
3. **`FieldStore`:**
   - create the Supabase client once and share it between sign-in and `SupabaseFieldRemote`;
   - download the roster right after sign-in.
4. **Local end to end.**
   - Start Supabase: `pnpm dlx supabase --workdir apps/products/greenhouse start`, then `db reset`.
   - Add a supervisor member as the README says.
   - Log entries offline in the field app, reconnect, and see the rows in Studio with `recorded_by` set.
5. **Tests:** add a `FieldStore` test with a fake remote, and keep the PGlite suite green.
