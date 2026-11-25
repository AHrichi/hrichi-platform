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
- **Limits in the root zone** (owner's decision, later the same day). Published sodium and chloride limits (tomato about 8 mmol/L) are for the root zone, which growers sample in the drain. The drain holds C·A/D, so the loop now goes when C·A/D reaches the limit: closed, t = V (C_lim·D/A − C_0) / (C_in·F); open, the drain levels off at C_in·F / L (salt in = salt out), and a bleed of L = C_in·U / (C_lim − C_in) holds it. The feed may now climb to only D/A of the limit (about a third at 30 % drain), so flushes come sooner. The EC ceiling stays at the dripper, where Hydrotool's 4.5 dS/m applies. Saved results hold inputs only, so they recompute with the new reading.
- **Cooling over the year** is a new Energy tab and saved kind (`coolingYear`): fans and pad pumps hour by hour through each month's mean day (the energy hub's cosine day), the fans' share growing with the heat above a start temperature, nothing while the house is empty between crops. The spec's range check (about 10 kWh/m² a year, from 100,000 kWh/ha) is a test: a Gabès-coast house cooled all year lands within 2 of it.
- **Site plants and tariffs** live in a second IndexedDB store, `sites` (database version 2), keyed by the projects' "Site" name, because a site is not a project. Backups carry them (an optional `sites` array, still version 1, so older files still open); a restore adds only sites whose name is new. Plants (RO, CHP, boiler, chiller, tank, pump; capacity, efficiency or COP, hours a day) are checked against the site's peak day: RO and pumps against its water, CHP plus boilers against its design-night heat, tanks as a share of a peak day. The economics can take the tariffs (heat priced through the recorded boilers' efficiency).

## Addendum (2026-11-25): reading aids

The owner asked for a header that stays in reach, a better language switch, sections that fold, a proper way to show formulas, and real-life photos.

- **Header and language.** The standalone header floats (sticky; glass once scrolled). Inside the portfolio it doesn't: the site header already floats there, and two stacked bars would take too much of a phone. The five-button language row is now one globe menu listing each language in its own script.
- **Folding.** Panels own their heading (`section[scPanel]`), a disclosure button, so all 50 titled panels and the Science topics fold the same way. Folding is a reading preference, kept per device in localStorage rather than in projects or backups.
- **Formulas as MathML.** The formulas stay plain text in the domain (searchable, readable, testable). A small parser lays them out as MathML, built with Renderer2 (no innerHTML). MathML is native in current browsers and read as maths by screen readers, so no maths library is needed. A test keeps every Science formula parseable.
- **Photos from Wikimedia Commons.** 25 free-licence photos (CC0, public domain, CC BY, CC BY-SA), resized to 640 or 400 px and re-encoded (1.4 MB in all). Each is credited where it is shown and in `public/science/CREDITS.md`. The owner approved the download. Inside the portfolio the app's files come from its own origin, so the photos resolve against the bundle (`import.meta.url`) and the portfolio's `img-src` lists the remotes. No photo shows a farm or company name.
- **Offline and new versions.** The standalone app's "Works offline" now holds: a service worker prefetches all screen code, so every screen opens offline after one visit. With the app cached, a new version only showed on the next visit, so a banner offers a reload when one has downloaded (standalone; the portfolio has its own).
- **Solar power for the site** is a tab on Energy rather than on Site, beside cooling over the year, whose electricity it offsets. It works month by month from the same climate data. Heat is modelled with the cells 20 K above the daytime air ((3 T_max + T_min) / 4). The sun only meets the daytime load, while the night load is always bought. Payback and the cost per kWh are undiscounted and indicative. Kebili lands near 1,620 kWh/kWp, inside the 1,500–1,900 that solar atlases give for the desert edge.

## Addendum (2026-11-25): two EC limits, and prices from the site

The owner asked for whatever choices would stay flexible and scale.

- **The drain gets its own EC limit.** The loop's flush ceiling (4.5 dS/m) is on the recirculated feed at the dripper, as in Hydrotool's example. The drain is the root zone and runs higher: about 4.8 at a 30 % drain with a 2.7 feed. So comparing the drain with 4.5 warned on the sample's own settings. A drain limit per crop (in `CROPS`, indicative) now drives the drain note and the Live data alert. A new crop brings its own limit; results saved before keep their old reading.
- **Prices are set once, on the site.** Site → Tariffs was already the place for gas, power, export and water prices. `energyPrices()` hands them to every energy tool, which starts from them, so a tariff change reaches every result without re-typing. The tools keep their own price fields, so a single result can still try another price.
