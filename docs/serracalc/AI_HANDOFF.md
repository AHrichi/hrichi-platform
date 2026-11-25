# AI handoff: SerraCalc (hrichi-platform)

A briefing for whichever AI agent or IDE picks up SerraCalc, the greenhouse heat, water and climate engineering app. It assumes no memory of earlier sessions. Read it top to bottom before touching code; [AGENTS.md](../../AGENTS.md) has the protocol, [ADR-0027](../adr/0027-serracalc.md) the decisions.

Last updated 2026-11-25: **S1–S3 and the parity work are on `main` (PRs #35, #37). The whole greenhouse-manager spec (a desert look, a Science page with field advice, M1 climate core, M2 water chain, M3 site/energy/economics, M4 operations and live data) is on `claude/serracalc-greenhouse-manager-af74c7`, pushed, no pull request yet.** The plan it follows is §7; the decisions are [ADR-0029](../adr/0029-serracalc-greenhouse-manager.md).

## 0. Resume in five minutes

1. **Get the branch:**

   ```bash
   git fetch origin && git switch claude/serracalc-greenhouse-manager-af74c7
   ```

   It was built in the worktree `.claude/worktrees/studylm-learning-merge-8ffa5f` (the folder name is historical). Check `git worktree list` first: one agent per checkout.

2. **Install:** `pnpm install --frozen-lockfile` (Node 24, pnpm 10.34.9).
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-serracalc*" --output-style=static
   pnpm exec stylelint "libs/products/serracalc/**/*.scss" "apps/products/serracalc/**/*.scss"
   ```

   That's 3 projects and 126 tests (92 domain, 34 feature).

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
| M0 desert look and shell              | **Done.** Design-system look `desert` (sand by day, a new blue-black `night` primitive ramp after dark, teal accent, amber focus ring; WCAG gate passes) on `sc-serra-shell`. Grouped side rail (≥ 64 rem) with line icons (`ui/icon`), tabs on tablets, the phone bar; a dune horizon, glass panels (`--sc-glass`, `--sc-edge`, `--sc-glow` set on `.serra`, switched off by sunlight mode), this ISO week in the header.                                                                                                                                                                                                                |
| M1 climate core                       | **Done.** Humidity and VPD (`/air?tab=vpd`, a draggable VPD map), fogging (`/cooling?tab=fog`: heat and water balance, the on/off cycle that holds a humidity cap), the cooling advisor (`advice-card` on Ventilation and Fog: the Kebili sample's 26.6 % vents → shade + fog), the crop calendar (`/calendar`: 52-week strip, stages, heating/CO₂/shade/fog weeks, stage targets with sources). Setpoints and advice rules are data in `targets.data.ts`. 16 domain tests.                                                                                                                                                               |
| Science and field advice              | **Done.** `/science`: 16 phenomena (formula, assumptions, each input's method and instrument, related topics, calculators), 16 instruments. Every number field has an ⓘ popover (native `popover`, top layer) linking there; "How it's calculated" links the topics of the open tab. Data in `science.data.ts`; `science.spec.ts` checks that every field has a method.                                                                                                                                                                                                                                                                   |
| M2 water chain                        | **Done.** A **Water supply** screen (`/supply`): seawater RO by mass balance (feed, brine and its salinity, product EC, energy, cost, storage, coverage) and fertigation with drain recycling (drain EC from uptake, water and fertiliser saved, sodium in the loop solved exactly, flush day or level, stock per day, salinity yield loss). Both start from the crop's peak day; the loop can take the RO water. Drawings `ro-flow` and `fertigation-loop`.                                                                                                                                                                              |
| M3 site, energy, economics            | **Done.** **Site** (`/site`): projects sharing a site name are compartments (`project.areaHa`, set in the table via `store.setProjectArea`), totals, the shared RO and CHP checked from the newest saved results, and an Economics tab. **Energy** (`/energy`): an hourly CHP/buffer/boiler balance for a winter design day (`energy-day`, draggable run hours) and heat in chilled water.                                                                                                                                                                                                                                                |
| M4 operations and live data           | **Done.** **Operations** (`/operations`): log (WHO Ia/Ib sprays refused), hygiene checklist, maintenance schedule (due/overdue), NWS heat index plan for workers. **Live data** (`/data`): CSV import (comma/semicolon, decimal comma, columns by name), a sample week, VPD and temperature by hour against the band, a day table, grouped alerts. `project.logs` and `project.readings` ride in backups.                                                                                                                                                                                                                                 |

**Verified** (2026-11-25, greenhouse manager, standalone dev build in the browser): the desert look in light and dark at 1280 px; the Kebili sample's advisor (26.6 % vents flagged, 12.3 % with 50 % shade, 26.7 °C with shade and fog); the calendar (heating from week 42, CO₂ in winter, shade and fog in summer, today's week); the VPD map; an ⓘ popover under its button and its link to `/science?topic=fogging`, which scrolls to and highlights the entry; lint, 102 unit tests, builds, stylelint, `nx format:check`, the zoneless check.

**Verified** (2026-11-25, M2–M4, dev build in the browser): RO on the Kebili sample (124 m³/d pumped, 56 of product, 68 of brine at 71.6 g/L); fertigation (12 % water saved, drain EC 4.8, sodium levelling under 8 mmol/L); the Site with the sample set to 5 ha (277 m³/d, 1,250 t, 5,000 labour days, 1.38 m³/m²·a); the energy day chart. Unit gates: RO 0.49 and 15,300 m³ feed; EC 6.3 → 31 %; 2,055 and 5,014 m³/day within 5 %; 29 kWh/m³; a sample week round-tripped through CSV with alerts.

**Not verified yet (greenhouse manager):** the shell e2e with every new screen in `SCREENS` (it last ran on the M3 commit; see §2 of the next session), Operations and Live data in the browser, Arabic RTL of the new drawings and popovers, phones, the Italian, German and Arabic wording by native speakers.

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

## 6. Next step: verify, then open the pull request

1. Run the SerraCalc e2e as CI does (§5); every new screen is in `SCREENS`, so axe covers them in light and dark at 375 and 1280 px. Fix what it finds.
2. In the browser: Operations (add a spray of class Ib: refused; mark a task done), Live data (load the sample week; import the downloaded CSV), Arabic RTL on Site, Energy and the ⓘ popovers, a phone width.
3. Open the pull request to `main` (it deploys SerraCalc) and update this hand-off.

Then, from the old plan: pumps and pipes (Hazen–Williams), solar PV, climate for any place (Open-Meteo archive; add it to the CSP `connect-src`), a materials catalogue with prices. A private brand pack for a demo to a named farm, as the Labor Planner has, if the owner wants one.

## 7. The greenhouse-manager plan (owner's spec, 2026-11-25)

The owner's spec turns SerraCalc from calculators into a manager for large desert tomato sites (seawater RO, fertigation with drain recycling, fogging, gas CHP, 5 ha compartments). Keep real farm and company names out of the repo (brand-pack rule above); the benchmarks below are published figures for a Gabès-coast site.

| Phase                             | Build                                                                                                                                                                                                                                                                          | Gate                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| M1 climate core                   | VPD, fogging and the advisor, crop calendar                                                                                                                                                                                                                                    | **Done**: VPD 0.85 kPa at 15 °C/50 % and 34 °C/84 %; the Kebili sample recommends shade + fog, not 26.6 % vents                         |
| M2 water chain (**done**)         | Seawater RO, fertigation with drain recycling and flush rule, crop demand → RO                                                                                                                                                                                                 | RO recovery ≈ 0.49 from 39.5 → 77 g/L; EC 6.3 → ≈ 31 % yield loss                                                                       |
| M3 site and energy (**done**)     | Site of compartments (about 5 ha each) sharing RO, CHP and packing; energy hub (CHP heat, power and CO₂, buffer, chilled-water heat reuse 1.163 × 25 K ≈ 29 kWh/m³); economics (yield 250 t/ha, labour about 1,000 days/ha, price, cost per kg, payback, about 1.9 kg CO₂e/kg) | 50 ha at 1.5 m³/m²·yr ≈ 2,055 m³/day (published 2,021); 122 ha ≈ 5,014 (published 4,932), within 5 %; cooling within about 10 kWh/m²·yr |
| M4 operations and data (**done**) | Scouting, releases, sprays (no WHO Ia/Ib), hygiene and maintenance logs; CSV import of T, RH, PAR, EC, pH, drain, weather; measured against calculated; alerts (VPD, heat stress, drain EC)                                                                                    | A real week of readings imported and compared without manual edits                                                                      |

Principles: every module reads the same project (house, climate, crop); calculations stay pure with tests; offline first; SI units, TND, FR/AR/EN/IT/DE; advice rules are data; every reference value shows its source; planning aid only.
