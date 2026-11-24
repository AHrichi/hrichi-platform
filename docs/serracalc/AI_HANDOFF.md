# AI handoff: SerraCalc (hrichi-platform)

A briefing for whichever AI agent or IDE picks up SerraCalc, the greenhouse heat, water and climate engineering app. It assumes no memory of earlier sessions. Read it top to bottom before touching code; [AGENTS.md](../../AGENTS.md) has the protocol, [ADR-0027](../adr/0027-serracalc.md) the decisions.

Last updated 2026-11-24: **S2 done on `feat/serracalc-s2-drawings`**, branched from S1 (`feat/greenhouse-energy-p1`). Neither is merged; merge S1 first, or S2 alone (it contains S1).

## 0. Resume in five minutes

1. **Get the branch:**

   ```bash
   git fetch origin && git switch feat/serracalc-s2-drawings
   ```

   It was built in the worktree `.claude/worktrees/greenhouse-energy`. Check `git worktree list` first: one agent per checkout.

2. **Install:** `pnpm install --frozen-lockfile` (Node 24, pnpm 10.34.9).
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-serracalc*" --output-style=static
   pnpm exec stylelint "libs/products/serracalc/**/*.scss" "apps/products/serracalc/**/*.scss"
   ```

   That's 3 projects and 44 tests.

4. **See it:** `pnpm nx run product-serracalc:build:development`, then `node tools/scripts/serve-static.mjs dist/apps/products/serracalc/web/browser 4314` and open `http://localhost:4314`. Inside the portfolio it is `/apps/serracalc`.

## 1. What this is

LuxPath (ADR-0019) for greenhouses: a field kit where an engineer describes a greenhouse once, then sizes its heating, cooling and water, sees every formula with its numbers, and saves results to projects on the phone. Offline, no backend, French / Arabic / English.

It is **not** the Greenhouse Labor Planner (`product-greenhouse*`, ADR-0026). Keep the two apart; don't name a real farm or company in either (see that hand-off's brand-pack rule).

## 2. Status

| Phase                                 | State                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 domain, screens, portfolio wiring  | **Done.** Domain: geometry, peak load, year of heating, hot-water pipes, ventilation, fan and pad, crop water, rainwater, nine climates, physics helpers (33 tests). Feature: projects, greenhouse, heating, cooling, water, climate, guide; save / open & edit / rename / delete; FR, AR, EN copy; store tests (6). Shell route, remote registry, visibility flag (on), apps cards in five languages, constellation links, icons.                                                                        |
| S2 drawings you can drag              | **Done.** `DragHandle` (`g[scHandle]`: a slider with arrow keys, over LuxPath's pointer-to-viewBox `SvgDrag`) on seven drawings: the cross-section (gutter, ridge, span), heat loss (inside and outside thermometers, arrows by share), hot-water loops (supply, return, loop length), ventilation (outside, allowed rise, vent opening), fan and pad (pad-to-fan distance, rise), crop water (canopy, drain share) and the rain basin (its size). Scales hold while a handle is dragged. 5 handle tests. |
| S3 light, CO₂ and humidity            | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| S4 fertigation, pumps and pipes, PV   | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| S5 report, backups, any-place climate | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| S6 shell e2e and go-live polish       | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

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

**Not verified yet:**

- dragging with a finger on a real phone (the pointer handling and the touch-scroll guard are LuxPath's, but not tried here);
- SerraCalc inside the portfolio shell (route, CSP, demo database name) — no shell e2e yet;
- the deploy target (Cloudflare worker `product-serracalc` is created on the first deploy from `main`);
- axe on every screen (no automated accessibility run yet);
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

## 6. Next step: S3, light, CO₂ and humidity

Add a **Climate control** screen (or tabs on Cooling) with, each in the domain with tests first, a `defaults.ts` starter, a drawing with handles, and FR/AR/EN copy:

1. **Supplemental lighting:** natural DLI from the month's radiation (Rg × τ × 2.0 mol per MJ), the gap to the crop's target DLI, the PPFD and hours to close it, fixtures from their µmol/J and wattage, and the kWh and cost.
2. **Summer shading:** the shade share that keeps the DLI under the crop's ceiling, month by month.
3. **CO₂ enrichment:** kg/h to hold a target ppm against the ventilation rate (1.83 kg/m³ of CO₂), from bottled CO₂ or from a gas burner (1.8 kg per m³ of gas, and the heat that comes with it).
4. **Humidity:** VPD and dew point from the physics helpers already in `utils/physics.ts`, the night's transpiration to remove, and the air exchange or heat that removes it.

Then S4 (fertigation, pumps and pipe head loss, solar PV for pumps and fans), S5 (report, backups, climate for any place) and S6 (shell e2e).
