# AI handoff: SerraCalc (hrichi-platform)

A briefing for whichever AI agent or IDE picks up SerraCalc, the greenhouse heat, water and climate engineering app. It assumes no memory of earlier sessions. Read it top to bottom before touching code; [AGENTS.md](../../AGENTS.md) has the protocol, [ADR-0027](../adr/0027-serracalc.md) the decisions.

Last updated 2026-11-24: **S1 done on `feat/greenhouse-energy-p1`** (not merged).

## 0. Resume in five minutes

1. **Get the branch:**

   ```bash
   git fetch origin && git switch feat/greenhouse-energy-p1
   ```

   It was built in the worktree `.claude/worktrees/greenhouse-energy`. Check `git worktree list` first: one agent per checkout.

2. **Install:** `pnpm install --frozen-lockfile` (Node 24, pnpm 10.34.9).
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-serracalc*" --output-style=static
   pnpm exec stylelint "libs/products/serracalc/**/*.scss" "apps/products/serracalc/**/*.scss"
   ```

   That's 3 projects and 39 tests.

4. **See it:** `pnpm nx run product-serracalc:build:development`, then `node tools/scripts/serve-static.mjs dist/apps/products/serracalc/web/browser 4314` and open `http://localhost:4314`. Inside the portfolio it is `/apps/serracalc`.

## 1. What this is

LuxPath (ADR-0019) for greenhouses: a field kit where an engineer describes a greenhouse once, then sizes its heating, cooling and water, sees every formula with its numbers, and saves results to projects on the phone. Offline, no backend, French / Arabic / English.

It is **not** the Greenhouse Labor Planner (`product-greenhouse*`, ADR-0026). Keep the two apart; don't name a real farm or company in either (see that hand-off's brand-pack rule).

## 2. Status

| Phase                                 | State                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 domain, screens, portfolio wiring  | **Done.** Domain: geometry, peak load, year of heating, hot-water pipes, ventilation, fan and pad, crop water, rainwater, nine climates, physics helpers (33 tests). Feature: projects, greenhouse, heating, cooling, water, climate, guide; save / open & edit / rename / delete; FR, AR, EN copy; store tests (6). Shell route, remote registry, visibility flag (on), apps cards in five languages, constellation links, icons. |
| S2 drawings you can drag              | Next. See §6.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| S3 light, CO₂ and humidity            | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S4 fertigation, pumps and pipes, PV   | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S5 report, backups, any-place climate | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S6 shell e2e and go-live polish       | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                           |

**Verified** (2026-11-24, standalone build in the browser):

- the empty start, "Load sample projects", the project card and the links to each tool;
- Heating peak on the Kebili sample (825 kW, 78 W/m²), the year tab's stacked monthly chart and notes;
- Save, then "Open & edit" from Projects after a reload: lands on the right tab with the "Editing" badge;
- French and Arabic copy, RTL layout with the chart kept left to right, the phone bottom bar;
- the greenhouse cross-section (three spans to scale, "+7" for the rest);
- lint, tests, stylelint (strict list), zoneless check, production builds of `product-serracalc` and `shell`.

**Not verified yet:**

- SerraCalc inside the portfolio shell (route, CSP, demo database name) — no shell e2e yet;
- the deploy target (Cloudflare worker `product-serracalc` is created on the first deploy from `main`);
- axe on every screen (no automated accessibility run yet);
- every formula against a published worked example (only hand checks and sanity ranges).

## 3. Code map

| Where                                     | What                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `domain/src/lib/models/serra.models.ts`   | Every input and result type, `CalcNote`, `SavedCalculation` (a union by `kind`), projects |
| `domain/src/lib/data/climates.data.ts`    | Nine climate presets (monthly normals, design night and afternoon)                        |
| `domain/src/lib/data/catalogue.data.ts`   | Covers (U, τ, air changes), screens, fuels, pipes, crops, the default house               |
| `domain/src/lib/calculations/*.ts`        | `geometry`, `heating` (peak + year), `hot-water`, `cooling`, `water`, `defaults`          |
| `domain/src/lib/utils/physics.ts`         | Air and water constants, vapour pressure, dew point, wet bulb, day length                 |
| `feature/src/lib/screens/calc-editing.ts` | `?tab=…&edit=…` handling and saving for a calculator screen                               |
| `feature/src/lib/screens/fields.ts`       | Number field specs per calculator (unit, range, step); labels come from copy by key       |
| `feature/src/lib/screens/<area>/`         | One screen per area; Heating, Cooling and Water have tabs that share the house's numbers  |
| `feature/src/lib/ui/`                     | Number field, field grid, notes, "How it's calculated", save bar, context bar, month bars |
| `feature/src/lib/i18n/copy.{en,fr,ar}.ts` | All words; `SerraCopy = typeof EN`. IT and DE fall back to English                        |

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

## 6. Next step: S2, drawings you can drag

Bring LuxPath's `lpSvgDrag` pattern (pointer events through the SVG's matrix, `role="slider"`, arrow keys mirroring the number fields) to:

1. the greenhouse cross-section (drag gutter and ridge heights, span width);
2. a heat-loss picture (arrows through roof, walls and leaks, sized by share);
3. the hot-water loop layout (pipe rows along the house, loops, supply and return temperatures);
4. the ventilation and pad-to-fan airflow (pad wall, air warming towards the fans);
5. the water balance (rain into the basin, drippers out, drain).

Then S3: supplemental lighting (DLI from radiation, PPFD and fixtures), shading for summer, CO₂ dosing against ventilation, humidity and night-time dehumidification (VPD, dew point).
