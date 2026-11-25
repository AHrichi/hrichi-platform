# ADR-0029: SerraCalc as a greenhouse manager, a desert look and a Science page

- **Status:** Accepted
- **Date:** 2026-11-25
- **Milestone:** M2
- **Extends:** [ADR-0027](0027-serracalc.md)

## Context

The owner asked to turn SerraCalc from a set of calculators into a manager for large desert tomato sites: seawater reverse osmosis, fertigation with drain recycling, high-pressure fogging, gas CHP with CO₂ and 5-hectare compartments, plus operations and live data. The spec came with sourced reference values and benchmark tests, in four phases (climate core, water chain, site and energy, operations and data). The owner also asked for a professional, futuristic interface in a desert theme, and for a page that explains every phenomenon, with tooltips on inputs saying how to measure them, all linked.

The repo is public and deploys itself; a real farm or company must not be named in it (the Labor Planner's brand-pack rule).

## Decision

- **A design-system look, `desert`** (`look.desert.{light,dark}.json`): sand by day, a new blue-black `night` primitive ramp after dark, a teal accent and an amber focus ring. It passes the token build's WCAG gate in both modes. SerraCalc's shell sets `data-look="desert"` and draws the rest with color-mix of tokens: glass panels (`--sc-glass`, `--sc-edge`, `--sc-glow`, `--sc-sun` declared on `.serra`; sunlight mode turns them solid), a dune horizon, a grouped side rail with line icons (`ui/icon`, no emoji), this ISO week in the header.
- **Advice rules and setpoints are data** (`targets.data.ts`): crop-stage bands (tomato's harvest stage from Soussi 2022; the rest typical and marked so), VPD limits, the cooling advisor's thresholds. Every value shown names its source; citations are names and are not translated.
- **New calculators, all pure and tested**, each with defaults from the project, a saved `kind`, report figures and `OPENS_IN`:
  - M1: VPD (Tetens) with verdict and action; fogging (heat and water balance with Boulard–Baille vents, the on/off cycle that holds a humidity cap); a cooling advisor (the Kebili sample's 26.6 % vents → shade and fog); a crop calendar (stages, heating/CO₂/shade/fog weeks from the normals).
  - M2: seawater RO by mass balance; fertigation with drain recycling, sodium solved exactly (the spec's flush formula when the loop is closed), a linear, overridable salinity yield loss.
  - M3: site totals over compartments (a project's house × its `areaHa`), economics, an hourly CHP/buffer/boiler balance for a winter design day, heat in chilled water.
  - M4: an operations log (WHO Ia/Ib sprays refused), hygiene checklist, maintenance schedule, NWS heat index for workers; CSV import of readings with VPD by hour, measured against targets, grouped alerts. Logs and readings live in the project, so backups carry them.
- **New screens instead of growing old ones:** Site, Crop calendar, Water supply, Energy, Operations, Live data, Science. Cooling gains a Fog tab and the advisor card; Light & air a VPD tab.
- **Science and field advice:** `science.data.ts` holds 21 phenomena (formula, inputs, related topics, calculators, sources), 18 instruments and, for every input field, how to get its value (measure, datasheet, worked out, setting, assumption, bills) and with what. Every number field has an ⓘ that opens a native `popover` (top layer, light dismiss) with that advice and a link to `/science?topic=…` or `?instrument=…`; "How it's calculated" links the phenomena of the open tab. A spec fails if a field has no method or a link doesn't resolve.
- **No names:** the benchmarks cite published figures for "a Gabès-coast site"; the theme is a generic desert. A branded build, if wanted, follows the Labor Planner's private brand pack.

## Consequences

- 92 domain tests and 34 feature tests, including the spec's gates: VPD 0.85 kPa at 15 °C/50 % and 34 °C/84 %; RO recovery 0.49 from 39.5 → 77 g/L and 15,300 m³ of feed for 7,500 of product; EC 6.3 → 31 % yield loss; 50 ha and 122 ha within 5 % of the published daily water; 29 kWh/m³ in chilled water; a week of 15-minute readings imported and compared without edits.
- Copy grows by about 600 keys in each of five languages; `copy.spec.ts` keeps them complete.
- The models stay simplified planning aids (monthly normals, steady states, a design day). They are sourced and say so; they don't replace an engineer or supplier data.

## Addendum (2026-11-25): the spec's last three gaps

- **Chloride, bicarbonate and flush strategies.** Fertigation tracks sodium, chloride and bicarbonate in the loop; all three build up by the same factor g = C / C_in, so one exact solution serves every limit. Each mmol/L of Na or Cl adds 0.06 dS/m (0.12 for NaCl), HCO₃ 0.045; the loop goes at the first of the sodium, chloride and EC limits. Results saved before this lack the new inputs: chloride then follows sodium, bicarbonate is zero, and there is no chloride limit, so old results give the same numbers. A year is compared, day by day, under five strategies: as set, flush at the EC ceiling, **acidified refill** (acid turns the refill's bicarbonate into CO₂ and nitrate, so it stops adding to the EC; the spec names this strategy after the Hydrotool paper, which we could not read, so this is our reading of it), a lower refill EC (nutrients drop as salt builds, so the EC at the dripper holds), and a steady bleed L = U·D / (g·A − D). Water let go is counted at feed strength for the stock it carries away.
- **Cooling over the year** is a new Energy tab and saved kind (`coolingYear`): fans and pad pumps hour by hour through each month's mean day (the energy hub's cosine day), the fans' share growing with the heat above a start temperature, nothing while the house is empty between crops. The spec's range check (about 10 kWh/m² a year, from 100,000 kWh/ha) is a test: a Gabès-coast house cooled all year lands within 2 of it.
- **Site plants and tariffs** live in a second IndexedDB store, `sites` (database version 2), keyed by the projects' "Site" name, because a site is not a project. Backups carry them (an optional `sites` array, still version 1, so older files still open); a restore adds only sites whose name is new. Plants (RO, CHP, boiler, chiller, tank, pump; capacity, efficiency or COP, hours a day) are checked against the site's peak day: RO and pumps against its water, CHP plus boilers against its design-night heat, tanks as a share of a peak day. The economics can take the tariffs (heat priced through the recorded boilers' efficiency).
