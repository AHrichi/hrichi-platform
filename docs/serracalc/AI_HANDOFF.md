# AI handoff: SerraCalc (hrichi-platform)

A briefing for whichever AI agent or IDE picks up SerraCalc, the greenhouse heat, water and climate engineering app. It assumes no memory of earlier sessions. Read it top to bottom before touching code; [AGENTS.md](../../AGENTS.md) has the protocol, [ADR-0027](../adr/0027-serracalc.md) the decisions.

Last updated 2026-11-25: **S1–S3 are live on `main` (PR #35). The parity work (Italian and German, a theme switch, backups, a printable report, axe on every screen) is on `feat/serracalc-parity`, in a pull request to `main`.**

## 0. Resume in five minutes

1. **Get the branch:**

   ```bash
   git fetch origin && git switch feat/serracalc-parity
   ```

   It was built in the worktree `.claude/worktrees/funny-cartwright-dcfc46`. Check `git worktree list` first: one agent per checkout. Once its PR is merged, branch from `main`.

2. **Install:** `pnpm install --frozen-lockfile` (Node 24, pnpm 10.34.9).
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-serracalc*" --output-style=static
   pnpm exec stylelint "libs/products/serracalc/**/*.scss" "apps/products/serracalc/**/*.scss"
   ```

   That's 3 projects and 82 tests (52 domain, 30 feature).

4. **See it:** `pnpm nx run product-serracalc:build:development`, then `node tools/scripts/serve-static.mjs dist/apps/products/serracalc/web/browser 4314` and open `http://localhost:4314`. Inside the portfolio it is `/apps/serracalc`.

## 1. What this is

LuxPath (ADR-0019) for greenhouses: a field kit where an engineer describes a greenhouse once, then sizes its heating, cooling and water, sees every formula with its numbers, and saves results to projects on the phone. Offline, no backend, in French, Arabic, English, Italian and German.

It is **not** the Greenhouse Labor Planner (`product-greenhouse*`, ADR-0026). Keep the two apart; don't name a real farm or company in either (see that hand-off's brand-pack rule).

## 2. Status

| Phase                                 | State                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 domain, screens, portfolio wiring  | **Done.** Domain: geometry, peak load, year of heating, hot-water pipes, ventilation, fan and pad, crop water, rainwater, nine climates, physics helpers (33 tests). Feature: projects, greenhouse, heating, cooling, water, climate, guide; save / open & edit / rename / delete; FR, AR, EN copy; store tests (6). Shell route, remote registry, visibility flag (on), apps cards in five languages, constellation links, icons.                                                                                                                                                                                                        |
| S2 drawings you can drag              | **Done.** `DragHandle` (`g[scHandle]`: a slider with arrow keys, over LuxPath's pointer-to-viewBox `SvgDrag`) on seven drawings: the cross-section (gutter, ridge, span), heat loss (inside and outside thermometers, arrows by share), hot-water loops (supply, return, loop length), ventilation (outside, allowed rise, vent opening), fan and pad (pad-to-fan distance, rise), crop water (canopy, drain share) and the rain basin (its size). Scales hold while a handle is dragged. 5 handle tests.                                                                                                                                 |
| S3 light, CO₂ and humidity            | **Done.** A **Light & air** screen (`/air`, under More on phones) with three tabs, each with a drawing you can drag: grow lights and shade (DLI from radiation, lamps sized for the darkest month, kWh, cost, CO₂ of the electricity, summer shade; drag the target, the shade ceiling and the lamp hours), CO₂ enrichment (leak + uptake, burner gas and heat or liquid CO₂, cost; drag the target ppm and the air changes) and night humidity (VPD, dew point, cover temperature and drips, outside air and heat to dry the house; drag both temperatures and the humidity). Monthly charts take reference lines. 10 more domain tests. |
| S4 fertigation, pumps and pipes, PV   | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| S5 report, backups, any-place climate | **Partly done** (parity branch): JSON backups with Web Share and a printable report. Left: climate for any place, a materials catalogue with prices.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| S6 shell e2e and go-live polish       | **Partly done.** `shell-e2e/src/serracalc.spec.ts` (16 tests): samples and the heating result, a drawing handle by keyboard, save and "Open & edit", axe on every screen (light/dark, phone/desktop), IT and DE, the theme switch, backups, the report and print, Arabic RTL with drawings kept LTR, the catalog link and the redirect inside the portfolio under the production CSP. Standalone, the shell renders `<main>` and a hidden `<h1>` (the portfolio provides both when embedded). Left: phone testing.                                                                                                                        |

### Parity audit (2026-11-25, against LuxPath and the other apps)

Written before any change on `feat/serracalc-parity`; the last column says what that branch did with each gap.

| Area                  | Gap found                                                                                                                                | Outcome                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Languages             | Only FR, AR, EN. Italian and German readers get English words and `en-GB` numbers; the standalone switch offers three languages.         | **Done.** Full typed IT and DE copies, `it-IT` / `de-DE`.   |
| Typed copies          | `fields`, `hints` and `notes` are `Record<string, …>`, so a copy missing a key still compiles.                                           | **Done.** `i18n/copy.spec.ts` (keys and placeholders).      |
| Shell theme           | Tokens follow `:root[data-theme]` live, but standalone there is no theme switch (System Design has one), so only the OS setting applies. | **Done.** A Dark button next to the language switch.        |
| Sunlight mode         | Works, but forgets the choice on reload.                                                                                                 | **Done.** `serracalc.sunlight` in `localStorage`.           |
| Scrolling tables      | `.table-wrap` scrolls sideways on phones but can't take focus, so keyboard users can't scroll it (axe `scrollable-region-focusable`).    | **Done.** Labelled, focusable regions with a focus ring.    |
| Dead style            | `chip-row` mixin in `_serra.scss` is unused.                                                                                             | **Done.** Removed.                                          |
| axe coverage          | The e2e scans the five calculators in light, at desktop width only.                                                                      | **Done.** Nine screens × light/dark × 375/1280 px.          |
| Backups               | None: projects live in this browser's IndexedDB only. LuxPath has JSON backup, restore and Web Share.                                    | **Done.** Domain + `sc-backup-panel` on Projects.           |
| Report                | None. LuxPath prints a project report.                                                                                                   | **Done.** `/report`, with `summarizeSaved()` in the domain. |
| Guide                 | Present (tools, sources, limits).                                                                                                        | **Done.** Projects-and-backups and Report entries.          |
| Empty start, samples  | Present: starts empty, samples on request.                                                                                               | Nothing to do.                                              |
| Save copy / update    | Present (`SaveBar`: update, save as a copy, stop editing).                                                                               | Nothing to do.                                              |
| Map or place picking  | None: nine fixed climates. LuxPath has a map picker.                                                                                     | **Deferred** with S5 "climate for any place" (§6).          |
| S4 and S5 calculators | Fertigation, pumps and pipes, solar PV, materials with prices, climate for any place: not built.                                         | **Deferred:** each is its own phase (§6).                   |

**Verified** (2026-11-24, standalone build in the browser):

- the empty start, "Load sample projects", the project card and the links to each tool;
- Heating peak on the Kebili sample (825 kW, 78 W/m²), the year tab's stacked monthly chart and notes;
- Save, then "Open & edit" from Projects after a reload: lands on the right tab with the "Editing" badge;
- French and Arabic copy, RTL layout with the chart kept left to right, the phone bottom bar;
- the greenhouse cross-section (three spans to scale, "+7" for the rest);
- lint, tests, stylelint (strict list), zoneless check, production builds of `product-serracalc` and `shell`.

**Verified** (2026-11-24, S2):

- dragging with the mouse on the ridge (6.3 → 10.1 m), the outside thermometer (0 → −10.5 °C, plant 825 → 1,367 kW) and the fan wall (100 → 64 m, the distance warning updated), each mirrored in the number fields, results and notes;
- the arrow keys on a focused handle; each handle is a labelled `slider` with its value and unit;
- the seven drawings in English and Arabic (geometry stays left to right; words isolated with `i18n.word`).

**Verified** (2026-11-24, S3):

- the three tabs on the Kebili sample: December sun 13.3 mol/m², lamps at 203 µmol/m²·s, 20 % shade at most; CO₂ 55.8 kg/h with 52 % taken up and 250 kW from the burner; a 16 °C, 85 % night dripping on a 11.8 °C cover;
- the humidity gauge from the keyboard (85 → 75 %: the drip warning goes, the air needed rises) and the lamp hours by mouse (16 → 8 h: the PPFD and the lamps double);
- Save on the Light tab, then "Open & edit" from Projects: back on `/air?tab=light` with 8 h and the Editing badge.

**Verified** (2026-11-25, go-live): the SerraCalc e2e, 7 of 7, run as CI does (`CI=1`).

**Verified** (2026-11-25, parity, rebased on `main` after PR #36):

- the SerraCalc e2e, **16 of 16** with `CI=1`: axe on all nine screens (the "Show the numbers" tables open) in light and dark at 375 and 1280 px; Italian (825,2 kW, title "Riscaldamento · SerraCalc") and German (9.600 m²); the Dark button and its reload; a backup downloaded and restored as three copies, a LuxPath file refused; the report with its saved result and print media hiding the app's bars; inside the portfolio, the site's language (IT, DE, AR) and theme switches followed live;
- in the browser: the report in dark at desktop width, Italian at 375 px, German at 320 px (the header's tools wrapping to two rows);
- lint, 82 unit tests, production builds of `product-serracalc` and `shell`, stylelint (strict list), `nx format:check`, the zoneless check; `nx affected -t test` (29 projects) after the energy page's text change.

**Not verified yet:**

- dragging with a finger on a real phone (the pointer handling and the touch-scroll guard are LuxPath's, but not tried here);
- the deploy target (Cloudflare worker `product-serracalc` is created on the first deploy from `main`);
- sharing a backup to Drive from a real Android phone (Web Share is feature-detected; the e2e covers the file download and restore);
- printing on paper or to PDF from a real print dialog (the e2e emulates print media);
- the Italian and German wording by a native speaker (the copy spec checks keys and numbers, not style);
- every formula against a published worked example (only hand checks and sanity ranges).

## 3. Code map

| Where                                           | What                                                                                                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/src/lib/models/serra.models.ts`         | Every input and result type, `CalcNote`, `SavedCalculation` (a union by `kind`), projects                                                                                         |
| `domain/src/lib/data/climates.data.ts`          | Nine climate presets (monthly normals, design night and afternoon)                                                                                                                |
| `domain/src/lib/data/catalogue.data.ts`         | Covers (U, τ, air changes), screens, fuels, pipes, crops, the default house                                                                                                       |
| `domain/src/lib/calculations/*.ts`              | `geometry`, `heating` (peak + year), `hot-water`, `cooling`, `water`, `light`, `co2`, `humidity`, `defaults`, `saved` (`summarizeSaved`: a saved result's figures for the report) |
| `domain/src/lib/utils/physics.ts`               | Air and water constants, vapour pressure, dew point, wet bulb, day length                                                                                                         |
| `domain/src/lib/utils/backup.ts`                | `createBackup`, `readBackup` (checks each project, counts the damaged ones), `withNewId`                                                                                          |
| `feature/src/lib/screens/calc-editing.ts`       | `?tab=…&edit=…` handling and saving for a calculator screen                                                                                                                       |
| `feature/src/lib/screens/fields.ts`             | Number field specs per calculator (unit, range, step); labels come from copy by key                                                                                               |
| `feature/src/lib/screens/<area>/`               | One screen per area; Heating, Cooling and Water have tabs that share the house's numbers                                                                                          |
| `feature/src/lib/diagrams/`                     | `svg-drag.ts` (pointer to viewBox), `drag-handle.ts` (`g[scHandle]`), one folder per drawing                                                                                      |
| `feature/src/lib/screens/report/`               | The printable report; `report-figures.ts` labels each figure with its calculator's words                                                                                          |
| `feature/src/lib/ui/`                           | Number field, field grid, notes, "How it's calculated", save bar, context bar, month bars, backup panel                                                                           |
| `feature/src/lib/i18n/copy.{en,fr,ar,it,de}.ts` | All words; `SerraCopy = typeof EN`. `copy.spec.ts` checks every key and placeholder                                                                                               |

## 4. Hard rules

- The domain stays pure TypeScript and language-neutral: numbers and note codes, no sentences, no Angular.
- Save inputs, never results.
- Tokens only in `.scss` (the paths are on stylelint's strict list), logical properties, no `innerHTML`, no `@angular/animations`.
- One axis per chart; a legend for two series; a table view next to each monthly chart.
- Every new calculator: a `defaults.ts` starter from `CalcContext`, tests against hand-worked numbers, a `kinds` label and an `OPENS_IN` entry in the projects screen.
- Add new copy keys to all five languages in the same commit; `copy.spec.ts` fails otherwise (a missing key, or a sentence that drops a number).

## 5. Commands and gotchas

- The preview tool's "serracalc (static build)" serves this checkout's `dist/apps/products/serracalc/web/browser` on 4314: build first. Stop it before the e2e, which starts its own server on 4314.
- Standalone, the e2e's `beforeEach` sets English on every page load: when a test switches language, move between screens by clicking, not with `page.goto`.
- `/apps/greenhouse-energy` redirects to `/apps/serracalc`.
- Icons: `node tools/scripts/generate-app-icons.mjs serracalc`.

## 6. Next step: S4, fertigation, pumps and solar

Same pattern as S3 (domain first with tests, `defaults.ts`, a drawing with handles, copy in all five languages, a saved `kind`, its `OPENS_IN` entry and its figures in `summarizeSaved`):

1. **Fertigation:** a nutrient recipe (target EC and N-P-K-Ca-Mg in mmol/L) against the source water's EC, the A and B stock tanks at a dilution (1:100 or 1:200), kg of each fertiliser a week, and acid for the bicarbonates. Brackish water in the south makes the drain share and the starting EC matter.
2. **Pumps and pipes:** head loss in the mains and laterals (Hazen–Williams with C = 150 for PE), velocity checks (0.5–1.5 m/s), the pump's head and power for the irrigation sections from the Water tab.
3. **Solar PV for pumps and fans:** daily kWh of pumps, fans and lamps, the PV array from the climate's sun hours, and the battery or the hours it covers.

Then the rest of S5:

- **Climate for any place:** a map picker (LuxPath's) and monthly normals from Open-Meteo's free historical API. It lives on `archive-api.open-meteo.com`, which the shell's CSP doesn't allow yet: add it to `connect-src` in `tools/scripts/prepare-hosting.mjs` (only `api.open-meteo.com` is there, for Basecamp). Keep the fetched normals in the project, so it still works offline.
- **A materials catalogue with prices** (covers, screens, pipes, pads, fans), editable, carried in backups.
