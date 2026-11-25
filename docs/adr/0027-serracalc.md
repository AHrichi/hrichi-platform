# ADR-0027: SerraCalc, greenhouse heat, water and climate engineering on LuxPath's pattern

- **Status:** Accepted
- **Date:** 2026-11-24
- **Milestone:** M2

## Context

The owner asked for "the same as LuxPath" (ADR-0019) for greenhouses: an app that helps with the engineering a greenhouse needs, heat, energy and water first. Greenhouse engineers in Tunisia work on phones on site, in French and Arabic, often in the south where houses are heated with geothermal water (60–75 °C) and cooled with fans and wet pads, and where water is scarce and brackish.

It is a separate product from the Greenhouse Labor Planner (ADR-0026): that app plans people; this one sizes plant. They share no code, only the `greenhouse` look.

## Decision

- **A product remote like LuxPath**, `scope:product-serracalc`:

  | Project                     | Path                              | Role                                                     |
  | --------------------------- | --------------------------------- | -------------------------------------------------------- |
  | `product-serracalc-domain`  | `libs/products/serracalc/domain`  | Pure TypeScript: models, climates, calculations, tests   |
  | `product-serracalc-feature` | `libs/products/serracalc/feature` | Screens, store, IndexedDB, copy (prefix `sc`)            |
  | `product-serracalc`         | `apps/products/serracalc/web`     | Native Federation remote on port 4314, Cloudflare worker |

  The name `serracalc` (not `greenhouse-energy`) keeps `nx run-many -p "product-greenhouse*"` meaning the labour planner only. The shell mounts it at `/apps/serracalc`; `/apps/greenhouse-energy` redirects there.

- **Language-neutral domain, as LuxPath:** results carry `notes: CalcNote[]` (code, severity, values); the feature writes the sentences. Saved results store **inputs only**, so reopening recomputes with the current rules.
- **The calculators (phase S1):**
  - **Greenhouse geometry**: gable, Venlo (3.2 m roofs) or tunnel (half-ellipse arch); floor, roof, side walls, gable ends, volume, cover ratio.
  - **Peak heating load**: Q = (U·A + 0.335·N·V + F·P) × ΔT, a closed screen cutting cover and leakage, plus a margin (ASAE EP406 U-values, air changes and perimeter factors).
  - **Heating over the year**: each month split into night and day by the day length at the site (FAO-56); nights at Tmin + 0.3 (Tmax − Tmin) with the screen's saving, days at Tmax − 0.3 (Tmax − Tmin) offset by the share of sunlight that warms the air. Then fuel, cost and CO₂ for gas, LPG, oil, heat pump, geothermal water or biomass.
  - **Hot-water pipes**: flow from Q = 1.163 × flow × ΔT; heat per metre from free convection (h = 1.32 (ΔT/D)^0.25) plus radiation; pipe length, loops, loop velocity, pump power and a year of geothermal water.
  - **Ventilation**: G = (Q_sun − U·A·ΔT) / (ρ·cp·ΔT); roof vent area by Boulard and Baille (1995) with Cd 0.65, Cw 0.1; air changes and fans.
  - **Fan and pad**: wet bulb by Stull (2011), pad outlet T − η (T − Tw), fans, pad wall and evaporation.
  - **Crop water**: transpiration = k × canopy × τ × (1 − shade) × Rg / 2.45, plus the drain; drippers, shots and irrigation sections.
  - **Rainwater**: harvest = rain × roof × run-off; a basin run month by month for two years; the smallest basin reaching 95 % of the best coverage, and at least one 25 mm storm, since monthly totals hide storms.
- **Climate presets** for nine places (Tunis, Monastir, Sfax, Gabès, Kebili, Tozeur, Almería, Agadir, De Bilt): rounded monthly normals, a design night and a design afternoon. The screens say they size a plant and don't replace a station's records.
- **Calculators start from the active project** (house, climate, crop, currency) or an example house in Monastir; each keeps its own copy of the numbers, and "Reset from the project" takes them again. A saved result opens with `?tab=…&edit=…`, as in LuxPath (`injectCalcEditing`).
- **One screen per area** (Heating, Cooling, Water, each with tabs) instead of LuxPath's single calculators screen, so no component grows past a few hundred lines. Number fields come from specs (`screens/fields.ts`), labelled from copy by key.
- **Charts on one axis:** monthly bars (single, grouped, stacked or floating ranges), data colour tokens, a legend for two series, a native tooltip per bar and a "Show the numbers" table. The climate screen draws temperature and rain as two charts rather than one with two axes.
- **Look:** `data-look="greenhouse"` (contrast-gated green), and a sunlight mode on primitive tokens only, so the styles pass the strict stylelint list.
- **Languages:** the portfolio's five: French, Arabic (RTL, Latin digits), English, Italian and German, each a full typed copy with its own number format. Standalone, the app has its own language and light/dark switches; inside the portfolio it follows the site's.
- **Storage:** IndexedDB `serracalc_db_v1`, `ah-demo-serracalc` inside the portfolio (ADR-0002). Samples load on request.

## Consequences

- 33 domain tests check each formula against hand-worked numbers (FAO-56 vapour pressure, Stull's own example, a semicircular tunnel) and sanity ranges (a Tunisian tomato house needs tens of kWh/m² a year, about 6 L/m² a day in July). 6 store tests cover save, update in place, rename, delete and the samples.
- **Drawings you can drag (S2):** seven drawings carry `DragHandle`s, an SVG `<g>` component that is a `slider` with arrow keys, over LuxPath's pointer-to-viewBox drag. Each handle sets one input, mirrored in its number field; a drawing whose scale depends on the value being dragged (the cross-section, the loops, the pad, the basin) holds that scale until the drag ends. Interactive drawings are `role="group"` with a description, not `img`, so their sliders stay reachable.
- **Light & air (S3):** DLI = Rg × 0.47 × 4.57 × τ (Thimijan & Heins); lamps sized for the darkest month at PPFD = gap × 10⁶ / (h × 3600) and run fewer hours in brighter months; shade = 1 − ceiling / DLI. CO₂ supply = N·V·Δppm·1.83 × 10⁻⁶ + uptake, with 1.96 kg of CO₂ and about 8.8 kWh of heat (at 90 %) per m³ of gas burnt. Night humidity: G = E / (ρ (x_in − x_out)), heat ρ·cp·G·ΔT, cover surface T_in − (U/8)(T_in − T_out) against the dew point. Each crop has a light ceiling (`maxDli`).
- **Parity with LuxPath (2026-11-25):** JSON backups (`createBackup` / `readBackup`: a restore lands beside the projects already there, a clash gets a new id, damaged projects are counted and left out) saved to the device or handed to the share sheet; a printable project report whose figures come from `summarizeSaved()`, which runs a saved result again from its inputs and returns language-neutral figures the feature labels with the calculators' own words. A copy spec checks that every language has every key of English and keeps every number a sentence shows, since `fields`, `hints` and `notes` are records the compiler can't check.
- Fertigation, pumps and solar, a materials catalogue with prices, and climate for any place follow in later phases (docs/serracalc/AI_HANDOFF.md §6).
- These are planning aids with stated sources, not certified designs; every screen says so.
