# AI handoff: SerraCalc (hrichi-platform)

A briefing for whichever AI agent or IDE picks up SerraCalc, the greenhouse heat, water and climate engineering app. It assumes no memory of earlier sessions. Read it top to bottom before touching code; [AGENTS.md](../../AGENTS.md) has the protocol, [ADR-0027](../adr/0027-serracalc.md) the decisions.

Last updated 2026-11-25: **S1–S3 and the shell e2e are on `feat/serracalc-s3-light-air`, in a pull request to `main`.** Merging it deploys SerraCalc (worker `product-serracalc`) and puts it on the apps page.

## 0. Resume in five minutes

1. **Get the branch:**

   ```bash
   git fetch origin && git switch feat/serracalc-s3-light-air
   ```

   It was built in the worktree `.claude/worktrees/greenhouse-energy`. Check `git worktree list` first: one agent per checkout.

2. **Install:** `pnpm install --frozen-lockfile` (Node 24, pnpm 10.34.9).
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-serracalc*" --output-style=static
   pnpm exec stylelint "libs/products/serracalc/**/*.scss" "apps/products/serracalc/**/*.scss"
   ```

   That's 3 projects and 54 tests.

4. **See it:** `pnpm nx run product-serracalc:build:development`, then `node tools/scripts/serve-static.mjs dist/apps/products/serracalc/web/browser 4314` and open `http://localhost:4314`. Inside the portfolio it is `/apps/serracalc`.

## 1. What this is

LuxPath (ADR-0019) for greenhouses: a field kit where an engineer describes a greenhouse once, then sizes its heating, cooling and water, sees every formula with its numbers, and saves results to projects on the phone. Offline, no backend, French / Arabic / English.

It is **not** the Greenhouse Labor Planner (`product-greenhouse*`, ADR-0026). Keep the two apart; don't name a real farm or company in either (see that hand-off's brand-pack rule).

## 2. Status

| Phase                                 | State                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 domain, screens, portfolio wiring  | **Done.** Domain: geometry, peak load, year of heating, hot-water pipes, ventilation, fan and pad, crop water, rainwater, nine climates, physics helpers (33 tests). Feature: projects, greenhouse, heating, cooling, water, climate, guide; save / open & edit / rename / delete; FR, AR, EN copy; store tests (6). Shell route, remote registry, visibility flag (on), apps cards in five languages, constellation links, icons.                                                                                                                                                                                                        |
| S2 drawings you can drag              | **Done.** `DragHandle` (`g[scHandle]`: a slider with arrow keys, over LuxPath's pointer-to-viewBox `SvgDrag`) on seven drawings: the cross-section (gutter, ridge, span), heat loss (inside and outside thermometers, arrows by share), hot-water loops (supply, return, loop length), ventilation (outside, allowed rise, vent opening), fan and pad (pad-to-fan distance, rise), crop water (canopy, drain share) and the rain basin (its size). Scales hold while a handle is dragged. 5 handle tests.                                                                                                                                 |
| S3 light, CO₂ and humidity            | **Done.** A **Light & air** screen (`/air`, under More on phones) with three tabs, each with a drawing you can drag: grow lights and shade (DLI from radiation, lamps sized for the darkest month, kWh, cost, CO₂ of the electricity, summer shade; drag the target, the shade ceiling and the lamp hours), CO₂ enrichment (leak + uptake, burner gas and heat or liquid CO₂, cost; drag the target ppm and the air changes) and night humidity (VPD, dew point, cover temperature and drips, outside air and heat to dry the house; drag both temperatures and the humidity). Monthly charts take reference lines. 10 more domain tests. |
| S4 fertigation, pumps and pipes, PV   | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| S5 report, backups, any-place climate | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| S6 shell e2e and go-live polish       | **Partly done.** `shell-e2e/src/serracalc.spec.ts` (7 tests): samples and the heating result, a drawing handle by keyboard, save and "Open & edit", axe on the five calculators, Arabic RTL with drawings kept LTR, the catalog link and the redirect inside the portfolio under the production CSP. Standalone, the shell renders `<main>` and a hidden `<h1>` (the portfolio provides both when embedded). Left: phone testing.                                                                                                                                                                                                         |

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

**Not verified yet:**

- dragging with a finger on a real phone (the pointer handling and the touch-scroll guard are LuxPath's, but not tried here);
- the deploy target (Cloudflare worker `product-serracalc` is created on the first deploy from `main`);
- axe on Projects, Climate and Guide (the e2e scans the five calculators);
- every formula against a published worked example (only hand checks and sanity ranges).

## 3. Code map

| Where                                     | What                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `domain/src/lib/models/serra.models.ts`   | Every input and result type, `CalcNote`, `SavedCalculation` (a union by `kind`), projects    |
| `domain/src/lib/data/climates.data.ts`    | Nine climate presets (monthly normals, design night and afternoon)                           |
| `domain/src/lib/data/catalogue.data.ts`   | Covers (U, τ, air changes), screens, fuels, pipes, crops, the default house                  |
| `domain/src/lib/calculations/*.ts`        | `geometry`, `heating` (peak + year), `hot-water`, `cooling`, `water`, `defaults`             |
| `domain/src/lib/utils/physics.ts`         | Air and water constants, vapour pressure, dew point, wet bulb, day length                    |
| `feature/src/lib/screens/calc-editing.ts` | `?tab=…&edit=…` handling and saving for a calculator screen                                  |
| `feature/src/lib/screens/fields.ts`       | Number field specs per calculator (unit, range, step); labels come from copy by key          |
| `feature/src/lib/screens/<area>/`         | One screen per area; Heating, Cooling and Water have tabs that share the house's numbers     |
| `feature/src/lib/diagrams/`               | `svg-drag.ts` (pointer to viewBox), `drag-handle.ts` (`g[scHandle]`), one folder per drawing |
| `feature/src/lib/ui/`                     | Number field, field grid, notes, "How it's calculated", save bar, context bar, month bars    |
| `feature/src/lib/i18n/copy.{en,fr,ar}.ts` | All words; `SerraCopy = typeof EN`. IT and DE fall back to English                           |

## 4. Hard rules

- The domain stays pure TypeScript and language-neutral: numbers and note codes, no sentences, no Angular.
- Save inputs, never results.
- Tokens only in `.scss` (the paths are on stylelint's strict list), logical properties, no `innerHTML`, no `@angular/animations`.
- One axis per chart; a legend for two series; a table view next to each monthly chart.
- Every new calculator: a `defaults.ts` starter from `CalcContext`, tests against hand-worked numbers, a `kinds` label and an `OPENS_IN` entry in the projects screen.
- Add new copy keys to all three languages in the same commit.

## 5. Commands and gotchas

- The preview tool reads `.claude/launch.json` from the **main** checkout; from a worktree, serve with `node tools/scripts/serve-static.mjs … 4314` and open the URL.
- `/apps/greenhouse-energy` redirects to `/apps/serracalc`.
- Icons: `node tools/scripts/generate-app-icons.mjs serracalc`.

## 6. Next step: S4, fertigation, pumps and solar

Same pattern as S3 (domain first with tests, `defaults.ts`, a drawing with handles, FR/AR/EN copy, a saved `kind` and its `OPENS_IN` entry):

1. **Fertigation:** a nutrient recipe (target EC and N-P-K-Ca-Mg in mmol/L) against the source water's EC, the A and B stock tanks at a dilution (1:100 or 1:200), kg of each fertiliser a week, and acid for the bicarbonates. Brackish water in the south makes the drain share and the starting EC matter.
2. **Pumps and pipes:** head loss in the mains and laterals (Hazen–Williams with C = 150 for PE), velocity checks (0.5–1.5 m/s), the pump's head and power for the irrigation sections from the Water tab.
3. **Solar PV for pumps and fans:** daily kWh of pumps, fans and lamps, the PV array from the climate's sun hours, and the battery or the hours it covers.

Then S5 (report, backups, climate for any place via Open-Meteo, a materials catalogue with prices) and S6 (shell e2e, axe, go live).
