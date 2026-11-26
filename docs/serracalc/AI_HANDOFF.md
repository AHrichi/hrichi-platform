# AI handoff: SerraCalc (hrichi-platform)

A briefing for whichever AI agent or IDE picks up SerraCalc, the greenhouse heat, water and climate engineering app. It assumes no memory of earlier sessions. Read it top to bottom before touching code; [AGENTS.md](../../AGENTS.md) has the protocol, [ADR-0027](../adr/0027-serracalc.md) the decisions.

Last updated 2026-11-26: **Everything through PR #48 is on `main` and deployed (and #47, merged after it): the greenhouse-manager spec, its gaps, the root-zone limits (#40), the owner's UI requests (#41: floating header, language menu, folding, MathML formulas, Commons photos with zoom, offline use, a new-version notice, walk-through fixes, Energy → Solar power), and a drain EC limit per crop with the Energy tools taking their prices from the site (#43, §5), a notice when SerraCalc in another tab holds the database (#45, §5), and number fields that are a dial, a thermometer, a tape, a stepper, chips or a clock to suit the value, from four new `@ah/ui` controls (#48, §2, §5), and a notice when the browser never answers for the database (#47, §5). Open for review: a guided tour for new users (the wand 🪄, PR #50, `claude/serracalc-tour`, ADR-0030), and on top of it an AI assistant that answers and, after the reader's Apply, creates and changes projects, results and settings (`claude/serracalc-assistant`, ADR-0031). They are the first two of three parts the owner approved on 2026-11-26; the third is cloud sync (a Worker with D1). The plan is in §6.** The plan is §7; the decisions are [ADR-0029](../adr/0029-serracalc-greenhouse-manager.md) and its addendum.

## 0. Resume in five minutes

1. **Get the branch:**

   ```bash
   git fetch origin && git switch claude/serracalc-assistant
   ```

   It is stacked on `claude/serracalc-tour` (PR #50): merge #50 first, then this branch's PR. Once both are merged, resume from `main`. This branch was built in the worktree `.claude/worktrees/studylm-learning-merge-8ffa5f`, the tour in `.claude/worktrees/funny-cartwright-dcfc46` (the folder names are historical). Check `git worktree list` first: one agent per checkout.

2. **Install:** `pnpm install --frozen-lockfile` (Node 24, pnpm 10.34.9).
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-serracalc*" --output-style=static
   pnpm exec stylelint "libs/products/serracalc/**/*.scss" "apps/products/serracalc/**/*.scss"
   ```

   That's 3 projects and 199 tests (121 domain, 78 feature). The tour engine is `platform-tour` (18 tests); the number controls, the coachmark and the chat pieces are in `design-system-ui` (97 tests): `pnpm nx run-many -t lint test -p design-system-ui`. The assistant: `pnpm nx run-many -t lint test build -p shared-assistant shared-assistant-engine platform-assistant assistant-edge` (10, 16, 17 and 8 tests; the live test is skipped unless `ASSISTANT_LIVE_LADDER` is set).

4. **See it:** `pnpm nx run product-serracalc:build:development`, then `node tools/scripts/serve-static.mjs dist/apps/products/serracalc/web/browser 4314` and open `http://localhost:4314`. Inside the portfolio it is `/apps/serracalc`.

## 1. What this is

LuxPath (ADR-0019) for greenhouses: a field kit where an engineer describes a greenhouse once, then sizes its heating, cooling and water, sees every formula with its numbers, and saves results to projects on the phone. Offline, no backend, in French, Arabic, English, Italian and German.

It is **not** the Greenhouse Labor Planner (`product-greenhouse*`, ADR-0026). Keep the two apart; don't name a real farm or company in either (see that hand-off's brand-pack rule).

## 2. Status

| Phase                                 | State                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 domain, screens, portfolio wiring  | **Done.** Domain: geometry, peak load, year of heating, hot-water pipes, ventilation, fan and pad, crop water, rainwater, nine climates, physics helpers (33 tests). Feature: projects, greenhouse, heating, cooling, water, climate, guide; save / open & edit / rename / delete; FR, AR, EN copy; store tests (6). Shell route, remote registry, visibility flag (on), apps cards in five languages, constellation links, icons.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| S2 drawings you can drag              | **Done.** `DragHandle` (`g[scHandle]`: a slider with arrow keys, over LuxPath's pointer-to-viewBox `SvgDrag`) on seven drawings: the cross-section (gutter, ridge, span), heat loss (inside and outside thermometers, arrows by share), hot-water loops (supply, return, loop length), ventilation (outside, allowed rise, vent opening), fan and pad (pad-to-fan distance, rise), crop water (canopy, drain share) and the rain basin (its size). Scales hold while a handle is dragged. 5 handle tests.                                                                                                                                                                                                                                                                                                                                                                          |
| S3 light, CO₂ and humidity            | **Done.** A **Light & air** screen (`/air`, under More on phones) with three tabs, each with a drawing you can drag: grow lights and shade (DLI from radiation, lamps sized for the darkest month, kWh, cost, CO₂ of the electricity, summer shade; drag the target, the shade ceiling and the lamp hours), CO₂ enrichment (leak + uptake, burner gas and heat or liquid CO₂, cost; drag the target ppm and the air changes) and night humidity (VPD, dew point, cover temperature and drips, outside air and heat to dry the house; drag both temperatures and the humidity). Monthly charts take reference lines. 10 more domain tests.                                                                                                                                                                                                                                          |
| S4 fertigation, pumps and pipes, PV   | Planned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S5 report, backups, any-place climate | **Partly done** (parity branch): JSON backups with Web Share and a printable report. Left: climate for any place, a materials catalogue with prices.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| S6 shell e2e and go-live polish       | **Partly done.** `shell-e2e/src/serracalc.spec.ts` (16 tests): samples and the heating result, a drawing handle by keyboard, save and "Open & edit", axe on every screen (light/dark, phone/desktop), IT and DE, the theme switch, backups, the report and print, Arabic RTL with drawings kept LTR, the catalog link and the redirect inside the portfolio under the production CSP. Standalone, the shell renders `<main>` and a hidden `<h1>` (the portfolio provides both when embedded). Left: phone testing.                                                                                                                                                                                                                                                                                                                                                                 |
| M0 desert look and shell              | **Done.** Design-system look `desert` (sand by day, a new blue-black `night` primitive ramp after dark, teal accent, amber focus ring; WCAG gate passes) on `sc-serra-shell`. Grouped side rail (≥ 64 rem) with line icons (`ui/icon`), tabs on tablets, the phone bar; a dune horizon, glass panels (`--sc-glass`, `--sc-edge`, `--sc-glow` set on `.serra`, switched off by sunlight mode), this ISO week in the header.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| M1 climate core                       | **Done.** Humidity and VPD (`/air?tab=vpd`, a draggable VPD map), fogging (`/cooling?tab=fog`: heat and water balance, the on/off cycle that holds a humidity cap), the cooling advisor (`advice-card` on Ventilation and Fog: the Kebili sample's 26.6 % vents → shade + fog), the crop calendar (`/calendar`: 52-week strip, stages, heating/CO₂/shade/fog weeks, stage targets with sources). Setpoints and advice rules are data in `targets.data.ts`. 16 domain tests.                                                                                                                                                                                                                                                                                                                                                                                                        |
| Science and field advice              | **Done.** `/science`: 16 phenomena (formula, assumptions, each input's method and instrument, related topics, calculators), 16 instruments. Every number field has an ⓘ popover (native `popover`, top layer) linking there; "How it's calculated" links the topics of the open tab. Data in `science.data.ts`; `science.spec.ts` checks that every field has a method.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| M2 water chain                        | **Done.** A **Water supply** screen (`/supply`): seawater RO by mass balance (feed, brine and its salinity, product EC, energy, cost, storage, coverage) and fertigation with drain recycling (drain EC from uptake, water and fertiliser saved, sodium in the loop solved exactly, flush day or level, stock per day, salinity yield loss). Both start from the crop's peak day; the loop can take the RO water. Drawings `ro-flow` and `fertigation-loop`. **Spec gaps (PR #39):** chloride and bicarbonate in the loop, flush at the first of Na, Cl and EC; a year compared under five strategies (as set, flush at the EC ceiling, acidified refill, lower refill EC, steady bleed). **Root zone:** the sodium and chloride limits are read in the drain, which holds C·A/D (owner, 2026-11-25).                                                                              |
| M3 site, energy, economics            | **Done.** **Site** (`/site`): projects sharing a site name are compartments (`project.areaHa`, set in the table via `store.setProjectArea`), totals, the shared RO and CHP checked from the newest saved results, and an Economics tab. **Energy** (`/energy`): an hourly CHP/buffer/boiler balance for a winter design day (`energy-day`, draggable run hours) and heat in chilled water. **Spec gaps (PR #39):** Energy → Cooling over the year (saved kind `coolingYear`, checked against ~10 kWh/m²·yr); Site → Plants and tariffs (IndexedDB store `sites`, database version 2, carried in backups), checked against the peak day; Economics takes the tariffs. **Solar power (PR #41):** Energy → Solar power (saved kind `solarPv`), the array month by month from the climate against the site's day and night loads; Kebili ≈ 1,620 kWh/kWp, checked against 1,500–1,900. |
| Guided tour                           | **On `claude/serracalc-tour`.** Ten steps (`tour/serra-tour.ts`): welcome, projects, the active project, the tools (rail, tabs or bottom bar by width), a number field and its ⓘ, saving, sunlight mode, backups, and the wand that replays it. Offered in the page on Projects ("New here?"), never forced; replayed from the wand in the header, the More sheet and the Guide screen. Engine `@ah/platform/tour`, card `<ah-coachmark>` in `@ah/ui` (ADR-0030).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| AI assistant                          | **On `claude/serracalc-assistant`** (ADR-0031). The **Ask** button opens a side sheet (a full-screen sheet on phones) where a model answers and proposes: 15 tools (`domain/src/lib/assistant/serra-assistant.ts`), run in the app (`feature/src/lib/assistant/serra-tools.ts`). Look-ups and moves run at once, settings with Undo, changes and deletions after **Apply** on a card the app words; a change that can't run is refused before the card. The model runs on a Cloudflare Worker, `apps/assistant-edge`, over a ladder of free models (`LADDER`). Generic parts: `@ah/shared/assistant`, `@ah/shared/assistant-engine`, `@ah/platform/assistant`, and `chat-message`, `chat-composer`, `action-card` in `@ah/ui`.                                                                                                                                                     |
| Number inputs                         | **Done (PR #48).** Every number field picks a control from its unit and range (`controlFor`, `ui/number-field/field-control.ts`): a half-moon dial for a percentage up to 100, a thermometer for °C (blue to red with the temperature), a tape to swipe for a bounded measurement, − and + for counts and for ranges too wide to swipe (those jump between round numbers), chips for up to five whole choices, a clock for the CHP hours and a year wheel for the planting and empty weeks. The typed field stays, with the label and the keyboard; the control beside it is pointer-only (`companion`). The controls are `ah-stepper`, `ah-dial`, `ah-thermometer` and `ah-ruler` in `@ah/ui`, with stories.                                                                                                                                                                      |
| M4 operations and live data           | **Done.** **Operations** (`/operations`): log (WHO Ia/Ib sprays refused), hygiene checklist, maintenance schedule (due/overdue), NWS heat index plan for workers. **Live data** (`/data`): CSV import (comma/semicolon, decimal comma, columns by name), a sample week, VPD and temperature by hour against the band, a day table, grouped alerts. `project.logs` and `project.readings` ride in backups.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

**Verified** (2026-11-25, greenhouse manager, standalone dev build in the browser): the desert look in light and dark at 1280 px; the Kebili sample's advisor (26.6 % vents flagged, 12.3 % with 50 % shade, 26.7 °C with shade and fog); the calendar (heating from week 42, CO₂ in winter, shade and fog in summer, today's week); the VPD map; an ⓘ popover under its button and its link to `/science?topic=fogging`, which scrolls to and highlights the entry; lint, 102 unit tests, builds, stylelint, `nx format:check`, the zoneless check.

**Verified** (2026-11-25, M2–M4, dev build in the browser): RO on the Kebili sample (124 m³/d pumped, 56 of product, 68 of brine at 71.6 g/L); fertigation (12 % water saved, drain EC 4.8, sodium levelling under 8 mmol/L); the Site with the sample set to 5 ha (277 m³/d, 1,250 t, 5,000 labour days, 1.38 m³/m²·a); the energy day chart. Unit gates: RO 0.49 and 15,300 m³ feed; EC 6.3 → 31 %; 2,055 and 5,014 m³/day within 5 %; 29 kWh/m³; a sample week round-tripped through CSV with alerts.

**Verified** (2026-11-25, final): the SerraCalc e2e, **16 of 16** with `CI=1`, with every new screen in `SCREENS` (axe on 25 screens in light and dark at 375 and 1280 px); Live data with the sample week (charts, 15 alerts) and Operations refusing a WHO Ib spray, in the browser.

**Verified** (2026-11-25, Arabic RTL, dev build at the pane width and 1280 px): the rail on the right and mirrored panels on Site, Water supply, Calendar, Cooling, Science; drawings kept left to right with Arabic labels in natural reading order (Chrome's SVG text ignores the isolates `i18n.word()` adds, and that order is the right one for readers, so it stays); fixed here: "°C" shown as "C°" (result cards and field units now `dir="auto"`, the screens' HTML uses `i18n.unit()`, the Arabic copy wraps °C in isolates), the fog cycle "60 / 28" reversing, Arabic eyebrows in a monospace face with letter spacing (now sans, no spacing, by `:lang(ar)`), the ⓘ popover clipped by the scrollbar, the RO feed label over the pump.

**Verified** (2026-11-25, spec gaps, `claude/serracalc-spec-gaps`): lint, 104 domain and 34 feature tests (gates: a Gabès-coast house cooled all year within 2 of 10 kWh/m²·yr; flush on chloride day 8, on the EC ceiling day 10, with bicarbonate day 6; bleed ≈ 2.27 m³/d; acidified refill 36 flushes a year against 60; plant checks; gas tariff → heat price; backups with sites), builds, stylelint, `nx format:check`, the zoneless check; the SerraCalc e2e **17 of 17** with `CI=1` (axe adds Site → Plants and tariffs and Energy → Cooling over the year; a plant recorded and found after a reload). In the browser at 375 px, Arabic and English: Energy's three tabs, the strategy table, Site plants (add, checks, a reload after the version-2 upgrade, tariffs into Economics), Live data and Operations, no sideways overflow. Fixed there: onward arrows follow the reading direction (`t().common.next`), Arabic captions keep unit case (kPa), the heat-reuse labels no longer clip, wider strategy names and two-field plant cards on phones.

**Verified** (2026-11-25, root zone, `claude/serracalc-root-zone-limits`): lint, 105 domain and 34 feature tests (gates: a closed loop at half drain flushes on 8 mmol/L of sodium in the drain on day 6, not 14; the Kebili sample levels off at 1 × 0.88 / 0.18 ≈ 4.9 mmol/L in the drain; a smaller drain flushes sooner), builds, `nx format:check`, the zoneless check, the SerraCalc e2e with `CI=1`. In the browser: Water supply → Fertigation in English and Arabic (the notes, the worked step, the chart's "Na in the drain" axis).

**Verified** (2026-11-25, UI polish, `claude/serracalc-ui-polish`): lint, 105 domain and 42 feature tests (new: the formula parser, and every Science formula parses without falling back to text), builds, stylelint, `nx format:check`, the zoneless check, the SerraCalc e2e **17 of 17** with `CI=1` (axe on every screen, light and dark, 375 and 1280 px, now with the language menu, folding panels, MathML and photos). The production `_headers` stays at 1,149 characters with the remotes in `img-src`. In the browser:

- Floating header at 1280 and 375 px, in English, French and Arabic: one slim glass row once scrolled, including straight after a deep link.
- The language menu: mouse and keyboard (arrows, Enter, focus back on the button).
- Folding: a panel, then a reload (remembered); Science's fold all; a contents link that unfolds its topic and scrolls it clear of the header.
- Formulas: the Science fertigation entry (fractions, subscripts), and the steps on a phone (a long one scrolls and takes focus).
- All 25 photos load, standalone. A photo opens large (zoom, pan, Escape) and focus returns to it.
- Offline (Playwright Chromium, production build): the service worker registers; after one visit, /projects, /heating and /science reload with the network off, and a photo comes from the cache.
- Solar power at 1280 px and on a phone in Arabic: 75 kWp, 122 MWh a year, 1,622 kWh/kWp, 93 % used on site, payback in 5 years; notes, table and month chart (which now reaches its tallest bar: the axis used to stop below it).
- The "new version" notice: four unit tests with a fake service worker. It hasn't been seen on screen (it needs two deployed versions).
- The walk-through, all 16 screens at 375 px in English, Arabic spot checks, and 1280, 1024 and 768 px: the header is one row at every width; the calendar reads at phone size and opens at today.

**Verified** (2026-11-25, two EC limits and site prices, PR #43): lint, 116 domain and 49 feature tests (new: tomato's drain limit of 6 doesn't warn at the sample's 4.8 drain while lettuce's 3 does; results saved before the limit compare with the flush ceiling, `{ec: 4.8, max: 4.5}`; the tariff mapping), builds, stylelint, `nx format:check`, the SerraCalc e2e **17 of 17** with `CI=1`. In the browser: Supply → Fertigation shows the 6 limit and no drain warning on the sample; Live data's limit reads 6 for tomato; a site electricity tariff of 0.42 reached Energy's solar grid price on a fresh load, and "Take the site's tariffs" re-applied it. Fixed there: site records load from IndexedDB after the screen opens, so Energy now waits for them.

**Verified** (2026-11-26, another tab holding the database, PR #45):

- Lint, 116 domain and 51 feature tests, builds, stylelint, `nx format:check`, the zoneless check.
- New unit tests in `serra-db.service.spec.ts`, which fail on the code before this branch:
  - an older tab holding version 1 makes the state `blocked`, then the projects open once it closes;
  - a newer tab's upgrade to version 3 isn't blocked, the state becomes `replaced`, and a save is refused.
- The SerraCalc e2e, **18 of 18** with `CI=1`. The new test uses two pages: the blocked notice (axe-clean), the projects opening once the other page lets go, then Reload offered after an upgrade.
- Screenshots on the production build in a fresh Chromium:
  - the blocked notice at 375 px in English and Arabic (right to left);
  - the replaced notice at 1280 px in dark mode.
- Fixed there: standalone, a short page (here, waiting on the database) showed white under the sand. `.serra.is-standalone` now fills the screen (`100dvh`, border-box, so long pages are unchanged).

**Verified** (2026-11-26, a database that never answers, PR #47):

- Lint, 116 domain and 54 feature tests, builds, stylelint, `nx format:check`, the zoneless check.
- New unit tests in `serra-db.service.spec.ts`, with fake timers and an `indexedDB.open` that fires nothing until it is released:
  - the state stays `ok` until `STALL_MS` (5 s), turns `stalled`, and goes back to `ok` once the open answers and the projects load;
  - an open that answers in time stays `ok`;
  - an open that reports `blocked` keeps the "another tab" notice.
  - The first test fails with the timer taken out.
- The SerraCalc e2e, **19 of 19** with `CI=1`. The new test uses two pages: the other holds version 1 and asks to delete the database, so this page's open waits behind the delete with no event at all. The stalled notice shows after 5 s (axe-clean, and not the "another tab" one), goes once the other page lets go, and the samples load.

**Not verified yet (stalled notice):** the wording in French, Arabic, Italian and German by native speakers.

**Verified** (2026-11-26, guided tour, `claude/serracalc-tour`):

- Lint, tests and builds of `platform-tour` (18: progress, the placement table, the target lookup, the host walking steps with routes, focus, Escape, the demo's own progress), `design-system-ui` (88, with the coachmark), `product-serracalc-feature` (60: the tour's steps have words in all five languages) and `product-serracalc`; stylelint, `nx format:check`, the zoneless check, the graph export.
- The SerraCalc e2e (`CI=1`), the new tests: all ten steps at 375, 800 and 1280 px, each with a ring (but the welcome) and the card fully on screen, focus on the card, focus on the wand at the end, no invitation after a reload; Escape and "Not now" keep it away; axe with a step open in light and dark, and in Arabic (the card `dir="rtl"`).
- In the browser pane: the invitation and the wand; the steps at the pane's width (sheet) and at 1280 px (beside the rail, pointer on its edge); Arabic at 1280 px (the card left of the rail on the right).
- Fixed there: right to left the card anchored to the right edge (Chrome maps an element's logical insets by its own direction): it is now placed on a left-to-right slot; a tab in the background gets no frames, so the wait for one has a timer; the dimming was too faint (now the design system's scrim); axe read the card mid-fade (the tests wait for animations to end).

**Not verified yet (guided tour):** a real phone; the tour inside the portfolio by hand (its targets are inside SerraCalc's root, and the portfolio's header is above the top layer's card only visually).

**Verified** (2026-11-26, AI assistant, `claude/serracalc-assistant`):

- Lint, tests and builds: `shared-assistant` (10), `shared-assistant-engine` (16), `platform-assistant` (17), `assistant-edge` (8, the live test skipped), `design-system-ui` (97), `product-serracalc-domain` (121), `product-serracalc-feature` (78: the tools against a real store, the copy in five languages), `shell` (6), `product-serracalc`; stylelint, `nx format:check`.
- The Storybook suite in the Linux Playwright image (`visual-baselines.mjs`): **667 of 667**, axe on every story in both themes. 24 new baselines for the 12 chat stories; no existing baseline changed. Fixed there: in Arabic a model's "0 °C" read "C° 0"; `ah-chat-message` now isolates temperature units itself (`isolateUnits`).
- The live test against a real model: Ollama `qwen2.5:7b` creates a project from an English and a French request.
- In the browser pane, the production build against the Worker under `wrangler dev` with Ollama: "Create a project for a tomato house in Monastir". The model's first house was out of range and was refused without a card; it corrected itself; a card in plain words; Apply; the project created and active; the model's closing answer (about a minute a round on this machine). The side sheet below the floating header at 1280 px, the full-screen sheet at 375 px (the conversation kept across a reload), Arabic right to left at 1280 px (the sheet at the left).
- Fixed there: the Worker answered a bare 500 (no CORS) when the local rate-limit binding failed; now it counts in the isolate, and any crash answers `UNAVAILABLE` with CORS. `wrangler dev` refused the compatibility date (now 2026-10-26, the newest the repo's runtime runs). The page gave up at 30 s while the Worker allows a local model 120 s. ESLint read wrangler's `.wrangler/` bundles. Focus fell to the page after Apply or Cancel (now the composer).
- The SerraCalc e2e with `CI=1`: **33 of 34** in the full run, then the 7 assistant tests alone after the fix below, all passing. They answer the Worker from a script (`page.route`): Apply creates a project and nothing changes before it; Cancel leaves a deletion undone and the model hears so; a saved result opens at `heating?tab=peak&edit=…`; busy and unreachable; axe with a card open as a side sheet (1280 px, light) and a phone sheet (375 px, dark), and again in Arabic; inside the portfolio the request leaves out theme and language and the panel sits below the site's header. Fixed there: the panel's top bar was a `<header>`, a second banner beside the page (now a `div`).

**Not verified yet (AI assistant):** the deployed Worker (it deploys when the PR is merged; without keys only the read-only Workers AI rung answers); Groq and Gemini through the Worker (the adapter tests use recorded replies); the panel inside the portfolio by hand (the e2e covers it); a real phone; the wording in French, Arabic, Italian and German by native speakers; tool-calling quality in Arabic.

**Verified** (2026-11-26, number controls, PR #48):

- Lint, tests and builds of `design-system-ui` (84 tests; new: the range helpers and each control's keyboard contract), `product-serracalc-feature` (54; new: `controlFor`, and every kind of control is used somewhere) and `product-serracalc`; stylelint, `nx format:check`, the zoneless check.
- The Storybook suite in the Linux Playwright image (`update-baselines`): **593 of 593**, axe on every story in both themes and screenshots. 38 new baselines for the 19 new stories; no existing baseline changed.
- The SerraCalc e2e with `CI=1`: 18 of 19 in the full run, then the new test alone after a fix (it scrolls each control into view before clicking). The new test drives the stepper, a thermometer tap, a tape drag and a dial tap with the mouse, then runs axe over the fields. Axe on every screen, light and dark, 375 and 1280 px, passes with the new controls.
- Touch, in Playwright Chromium with real touch events on an emulated Pixel 7 and iPad Mini (production build): a sideways swipe moves the tape; a vertical swipe starting on it scrolls the page (205 px) and leaves the value alone; a tap on the thermometer and on the dial's end; one tap of + is one step (273.6 → 280), and holding it repeats (→ 480 in 1.5 s); no sideways overflow.
- In the browser pane: Heating at 375 px; Energy (the CHP clocks at 6:00 and 17:00, 24 at the top for the stop) and the calendar's year wheel at desktop width; Arabic right to left (thermometers grow left from a bulb on the right, dials fill from the right, bigger numbers to the left of the needle, + on the left); sunlight mode; dark mode.
- Fixed there: `:dir(rtl)` didn't mirror anything (the build turns it into a language check), now `:host-context([dir='rtl'])`; the year wheel's month name ran into the season labels (now a short month, labels pulled in); a flick sent the tape to the end (capped speed, more friction); `setPointerCapture` throwing for a pointer already gone.

**Not verified yet (number controls):** a real phone and its vibration (the buzz at ends and labels); Safari on iOS (`touch-action` on the dial's SVG knob, `r` as a CSS property); the controls inside the portfolio by hand (the e2e's axe pass covers them standalone only).

**Not verified yet (greenhouse manager):** the photos inside the portfolio (they need the remote's origin in `img-src`, which the e2e's headers have); MathML on a real Android phone (Chrome draws it, but fonts vary); a real phone; the Italian, German and Arabic wording by native speakers; every formula against a published worked example beyond the spec's benchmarks; "acidified refill" is our reading of the Hydrotool strategy (the paper wasn't read). The drain EC limits per crop (`CROPS[crop].drainEcMaxDsM`: tomato 6, cucumber and pepper 4.5, melon 5, rose 3.5, strawberry and lettuce 3) are indicative, not a grower's figures.

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
| `domain/src/lib/utils/backup.ts`                | `createBackup`, `readBackup` (checks each project, counts the damaged ones; carries sites), `withNewId`                                                                           |
| `domain/src/lib/calculations/site.ts`           | Compartments, totals, economics; shared plants (`newPlant`, `plantChecks`) and tariffs (`defaultTariffs`, `tariffPrices`)                                                         |
| `domain/src/lib/calculations/solar.ts`          | Solar power for the site: `solarPv`, `PV_DESERT_YIELD`; defaults in `defaultSolarPv`                                                                                              |
| `feature/src/lib/services/serra-db.service.ts`  | IndexedDB, version 2: `projects` by id, `sites` (plants and tariffs) by site name                                                                                                 |
| `feature/src/lib/screens/calc-editing.ts`       | `?tab=…&edit=…` handling and saving for a calculator screen                                                                                                                       |
| `feature/src/lib/screens/fields.ts`             | Number field specs per calculator (unit, range, step, and a control when the default doesn't suit); labels come from copy by key                                                  |
| `feature/src/lib/tour/serra-tour.ts`            | The tour's steps (`SERRA_TOUR`) and their words (`serraTourText`); targets are `data-tour` attributes in the shell and screens                                                    |
| `feature/src/lib/ui/number-field/`              | `number-field` (label, ⓘ, typed value, the control, hint) and `field-control.ts` (`controlFor`: which control a spec gets)                                                        |
| `feature/src/lib/screens/<area>/`               | One screen per area; Heating, Cooling and Water have tabs that share the house's numbers                                                                                          |
| `feature/src/lib/diagrams/`                     | `svg-drag.ts` (pointer to viewBox), `drag-handle.ts` (`g[scHandle]`), one folder per drawing                                                                                      |
| `feature/src/lib/screens/report/`               | The printable report; `report-figures.ts` labels each figure with its calculator's words                                                                                          |
| `feature/src/lib/ui/`                           | Number field, field grid, notes, "How it's calculated", save bar, context bar, month bars, backup panel; `lang-menu`, `panel` (folding sections), `formula` (MathML)              |
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
- The database is version 2 since PR #39 (a `sites` store). A new store needs a version bump in `serra-db.service.ts` and an `onupgradeneeded` branch that only creates what is missing.
- Fertigation inputs added later (`sourceClMmolL`, `sourceHco3MmolL`, `clLimitMmolL`) are optional, so results saved before them still open; the Supply screen fills them from defaults when editing. Since the root-zone change, saved fertigation results recompute with the limits read in the drain, so their flush days come sooner.
- In `fertigation()`, `g` is the feed's factor C / C_in; the drain holds `toDrain` = A/D times it. Sodium and chloride limits divide by `toDrain`, the EC ceiling does not. `days[].naMmolL`, the levels and the notes are drain values.
- **Two EC limits** (owner's go-ahead, 2026-11-25): `flushEcDsM` (4.5) is the recirculated feed at the dripper and flushes the loop. `drainEcMaxDsM` is the drain (root zone), from `CROPS[crop].drainEcMaxDsM` (tomato 6, cucumber and pepper 4.5, melon 5, rose 3.5, strawberry and lettuce 3; indicative). The drain limit drives the "drain EC high" note and the Live data alert. Results saved before it fall back to `flushEcDsM`, in the report and when opened (`supply-screen.ts` load).
- **Prices live on the site:** `energyPrices(tariffs)` (`site.ts`) maps Site → Tariffs to the CHP's gas and power, the cooling year's electricity, and solar's grid and export price. Energy starts from them when they load and offers "Take the site's tariffs". A new energy tool with a price should be added to `energyPrices`.
- **Database versions** (`serra-db.service.ts`, `VERSION`): a tab from this build on closes its connection on `versionchange` (a newer tab wants to upgrade) and the shell asks for a reload; it can't save until then. A tab of an older build doesn't, so the new tab's upgrade waits (`blocked`) and the shell says to close or reload the other tab; once it does, the upgrade finishes and the projects open. `SerraDbService.state` is `ok`, `blocked`, `replaced` or `stalled`; the notice shows in both modes, ahead of the new-version one. `stalled` means no answer at all within `STALL_MS` (5 s): a browser can keep an open waiting, with no event, behind another request that never finishes (a delete blocked by another tab does it). The shell then says to close SerraCalc's other tabs and windows, and to restart the browser if that doesn't help; the notice goes if the open answers later. A `blocked` event stops the timer, since that notice says more. Tested in `serra-db.service.spec.ts` (fake-indexeddb; fake `setTimeout` only, because fake-indexeddb runs on `setImmediate`) and the e2e (two pages; for `stalled`, the other page's blocked delete).
- **Guided tour** (`claude/serracalc-tour`, ADR-0030): a step points at `data-tour` ids, in order of preference (`nav-rail`, `nav-tabs`, `nav-bottom`), and may open a screen first (`route`). Renaming or removing an element with a `data-tour` id breaks a step: the e2e walks every step at three widths and fails on a missing ring. Progress is `ah.tour.serracalc.main` in localStorage (`ah-demo.` prefix in the portfolio). The library's README says how to add a tour to another app.
- **Number controls** (PR #48): `controlFor(spec)` picks the control (dial, thermometer, ruler, stepper, chips, hours, weeks); give `spec()` a sixth argument to choose one. A field keeps four grid rows (label, typed value, control, hint), placed by row so hints stay level beside a field with no third row. The controls themselves are documented in `libs/design-system/ui/README.md` ("Range controls"). They mirror right to left from the `dir` attribute, because the build rewrites `:dir()` into a language check.
- Icons: `node tools/scripts/generate-app-icons.mjs serracalc`.
- **UI polish (`claude/serracalc-ui-polish`):**
  - **Floating header:** standalone only (`.top` in `serra-shell`). Its height is `--sc-top` (the rail and Science's contents stick under it) and the page's `scroll-padding`. Inside the portfolio the site header already floats, so SerraCalc's stays in the page.
  - **Language switch:** the globe menu `ui/lang-menu`. The e2e picks a language with `pickLanguage(page, 'Italiano')`.
  - **Folding:** `section[scPanel]` / `article[scPanel]` (`ui/panel`) owns the section's `h3`. Write `scPanel="supply-inputs" [heading]="…"`, not an `h3`; the heading id is `sc-<scPanel>`. Folding is kept in localStorage under `serracalc.folded` (`PanelState`).
  - **Formulas:** `sc-formula` (`ui/formula`) parses the plain text (rules at the top of `formula-parse.ts`): a spaced `/` is a fraction, an unspaced `/` stays inline. A test checks that every Science formula parses, so check yours there.
  - **Photos:** in `apps/products/serracalc/web/public/science/`, with credits in `CREDITS.md` there and in `feature/src/lib/science/photos.ts`. They load through `photoUrl()` (`import.meta.url`), because inside the portfolio the app runs from its own origin; the portfolio's CSP `img-src` lists the remotes for this. A new photo needs the owner's OK before downloading, its credit, and a caption in all five languages (`science.photoCaptions`).

  - **Offline (standalone):** `build` now runs `ngsw-config` after `build-federation` (as the System Design app does). `build:development` only echoes, and the service worker runs in production builds only. It prefetches all screen code and caches photos as they are seen, so every screen opens offline after one visit. The e2e blocks service workers. The desktop app's browser pane can't register service workers, so check offline with Playwright's Chromium: load, wait for `navigator.serviceWorker.ready`, `context.setOffline(true)`, reload.
  - **Wide drawings on phones:** `sc.diagram-scroll($min)` keeps a drawing readable and scrolls it sideways under 40rem (used by the calendar and the energy day). The calendar opens scrolled to today.
  - **New version (standalone):** `services/serra-updates.ts` watches the service worker (when the tab comes back into view, every 30 min) and the shell shows Reload / Later. The next move to another screen reloads anyway. Inside the portfolio the site's own banner does this.
  - **Month charts:** `ui/month-bars/month-ticks.ts` sets the axis; it always reaches the tallest bar.

## 6. Next step: review the tour and the assistant, then sync

**Open:** PR #50 (the tour, `claude/serracalc-tour`) and the assistant's PR (`claude/serracalc-assistant`, stacked on #50). Merge #50 first.

**The owner's one-time step for the assistant,** after its first deploy (until then, and without keys, the Worker answers read-only through Workers AI):

```bash
pnpm wrangler secret put GROQ_API_KEY --config apps/assistant-edge/wrangler.jsonc
pnpm wrangler secret put GEMINI_API_KEY --config apps/assistant-edge/wrangler.jsonc
```

Use a fresh Groq key, and a Gemini key from a Google project with billing off. Then check that `https://assistant-edge.ahmed-hrichi.workers.dev/health` lists the models, and ask SerraCalc something.

**Next task: cloud sync (item 3 below),** on a branch from `main` once the assistant is merged.

**Approved plan (owner, 2026-11-26), three pull requests in order,** each merged when the owner asks. The essentials:

1. **Tour:** PR #50.
2. **AI assistant** (built; ADR-0031, `libs/platform/assistant/README.md`): `libs/shared/assistant` (wire contracts, tool specs, limits), `libs/shared/assistant-engine` (an OpenAI-compatible chat-with-tools client for Groq, Gemini's OpenAI endpoint and Ollama, Workers AI as a read-only last rung, a `LADDER` variable, `handleChat`), `apps/assistant-edge` (a Worker: CORS allowlist, `ratelimits` per IP and overall, stream-capped bodies, no content logs, a CI `deploy` target), the SerraCalc profile in `product-serracalc-domain` (system prompt and tools; the server never takes prompts or tools from the client), `libs/platform/assistant` (the agent loop: reads run, settings run with Undo, writes and deletes wait on an Apply card the app writes) and the chat pieces in `@ah/ui`. New `scope:edge` in `eslint.config.mjs`; `assistantUrl` in `tools/hosting/environments.json`, `prepare-hosting.mjs` and `SiteConfigService`; SerraCalc's deploy gains `--site-config`; `.dev.vars*` in `.gitignore`. Owner: a Groq key and a Gemini key (billing off) set with `wrangler secret put`.
3. **Cloud sync:** opt-in "sync spaces" without accounts (a device links another with a one-use 8-character code, 10 minutes), `libs/shared/sync` (contracts, LWW, `s1` tokens), `libs/shared/sync-server` (`SyncService` over a repository port, contract tests with tenant isolation), `apps/sync-edge` (a Worker with D1; the migration applied by the deploy), SerraCalc kinds split so concurrent edits survive (project, calculation, log, readings, site), the outbox written in the same IndexedDB transaction as the project (database version 3), and `libs/platform/sync`. Owner: `wrangler d1 create sync-edge`, D1 permission on the CI token, `SYNC_TOKEN_SECRET`.

PR #47 (the stalled notice) is merged (`030faa0`) and deployed (CI run 45787739714; every job green, including Deploy to Cloudflare). PR #48 (the number controls) before it: `3331820`, CI run 45777236857, with the Storybook screenshots. Before them: #45 (`49d8698`, CI run 45759231692), #44 (`f60d330`, docs), #43 (`c264e3f`, CI run 45747755662), #41 (`b2662e7`, CI run 45676992891).

**Checked live on 2026-11-26 (PR #47, production):**

- In the desktop app's browser pane, whose database open gets no event at all: `/projects` says "Your projects haven’t opened yet: the browser isn’t answering SerraCalc. Close SerraCalc’s other tabs and windows. If that doesn’t help, restart the browser." instead of opening empty in silence. What holds the pane's database is still unknown.
- In a clean Playwright Chromium, another page holding version 1 and asking to delete the database: the stalled notice shows (8.3 s after the page started loading), not the "another tab" one; once the other page lets go it goes, and the samples load.

**Checked live on 2026-11-26 (PR #48, production, Playwright Chromium):**

- Standalone, with real touch events on an emulated Pixel 7 (412 px) and iPad Mini (768 px): a sideways swipe on a tape raises the value (4 → 5.5); a vertical swipe that starts on it scrolls the page 205 px and leaves the value alone; a tap at 90 % of a thermometer gives 27; a tap at a gauge's end gives its top (70); + takes 273.6 to 280, and holding it for 1.5 s goes on to 490; no sideways overflow.
- Inside the portfolio (`/apps/serracalc/heating?tab=peak`, 1280 and 390 px): Heating → Peak load shows 4 steppers, 2 dials, 2 thermometers, 2 tapes and no `input[type=range]`; the thermometer tap works; no overflow.
- Found there, not from this change: every deep link under `/apps/<app>/` in the portfolio (`/apps/serracalc/projects`, `/apps/luxpath/calculator`) answers **404** and still boots the app; `/apps/serracalc` itself is 200.

**Checked live on 2026-11-26 (PR #45, standalone, in a clean Playwright Chromium):**

- A page of the same origin holding the database at version 1 brings up "SerraCalc is open in another tab on an older version". Once it closes, the notice goes and the samples load.
- An upgrade to version 3 from that page isn't blocked, and the app shows "A newer SerraCalc opened in another tab" with Reload.
- The page fills the screen (`min-block-size` equal to the viewport).

**Not covered by #45, found live:** the desktop app's browser pane opened empty. Its database stays at version 1, and an open at version 2 gets no event at all in 5 seconds: no `blocked`, no `upgradeneeded`, no error. The request waits in a queue behind something that never finishes, and the browser doesn't report that. Only a timeout can tell: PR #47 added one, and the pane now shows its notice (above).

**Checked live on 2026-11-26 (PR #43, standalone, in a clean Playwright Chromium):**

- With the samples loaded, Supply → Fertigation shows the flush ceiling at 4.5 and the drain limit at 6, with no drain warning. Live data's drain limit reads 6.
- While the site has no tariffs, Energy keeps its defaults (grid 0.3, export 0.18) and shows no "Take the site's tariffs" button.
- Once "Oasis block 3" has tariffs (written to the `sites` store; the database upgraded to version 2), a fresh load gives solar 0.42 and 0.21, the CHP's gas 0.55 and power 0.42, and cooling 0.42. A grid price edited to 0.1 goes back to 0.42 with the button.

**Found live:** in the desktop app's browser pane, whose profile still had the database at version 1, the upgrade to version 2 never finished, so the app showed no projects and no message. Something still held the old database open; reloading the pane's other SerraCalc tab didn't release it, and what holds it wasn't found. `serra-db.service.ts` handles neither `blocked` nor `versionchange`. So a SerraCalc tab left open on an old version would do the same to a user at the next database version. PR #45 handles that case (§5); the pane itself is a different one (above).

**Checked live on 2026-11-25 (PR #41):**

- Inside the portfolio (`https://portfolio.ahmed-hrichi.workers.dev/apps/serracalc`): the Science photos load from `https://product-serracalc.ahmed-hrichi.workers.dev` under the new `img-src`; MathML formulas; folding; Energy → Solar power.
- Standalone (`https://product-serracalc.ahmed-hrichi.workers.dev`): the language menu, the floating header (glass after a deep link to a topic, which scrolls clear of it), photos, `ngsw-worker.js` and `ngsw.json` served.

**Not checked live:** the number controls on a real phone and its vibration, Safari on iOS. The service worker and opening offline (the desktop app's browser pane can't register one; use Playwright or a phone); the "new version" banner (#43's deploy is the first chance: a phone that opened the app before 2026-11-26 should offer Reload).

1. A real phone (Android Chrome): the number controls (swipe and flick a tape, hold + on a stepper, a dial and the clocks, the buzz), drag handles with a finger, the plant cards, a backup shared to Drive, the language menu, folding, photo zoom, MathML fonts, installing and opening offline.
2. Photos still missing (Commons had none free): hot-water pipes, pad cooling, fogging, a heat buffer, grow lights, CO₂ dosing, a PAR sensor, a lab analysis, a climate computer. The owner's own photos could fill them, with no farm or company names in view.

**Suggested next features** (from the 2026-11-25 walk-through; the owner picks):

- **Results in reach on phones:** a slim summary of the screen's key result that stays visible while the inputs are edited. On a phone, the results sit below a long list of inputs.
- **Undo instead of `confirm()`** when a project or saved result is deleted.
- **Pumps and pipes** (Hazen–Williams) for the irrigation mains.
- **Climate for any place** (Open-Meteo archive; add it to the CSP `connect-src`).
- **A materials catalogue with prices** (covers, screens).
- **Compare two projects or scenarios** side by side.
- **Open any drawing large**, as the photos do, for the 480–560-wide drawings on small phones.

A private brand pack for a demo to a named farm, as the Labor Planner has, if the owner wants one.

## 7. The greenhouse-manager plan (owner's spec, 2026-11-25)

The owner's spec turns SerraCalc from calculators into a manager for large desert tomato sites (seawater RO, fertigation with drain recycling, fogging, gas CHP, 5 ha compartments). Keep real farm and company names out of the repo (brand-pack rule above); the benchmarks below are published figures for a Gabès-coast site.

| Phase                             | Build                                                                                                                                                                                                                                                                          | Gate                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 climate core                   | VPD, fogging and the advisor, crop calendar                                                                                                                                                                                                                                    | **Done**: VPD 0.85 kPa at 15 °C/50 % and 34 °C/84 %; the Kebili sample recommends shade + fog, not 26.6 % vents                                            |
| M2 water chain (**done**)         | Seawater RO, fertigation with drain recycling and flush rule, crop demand → RO                                                                                                                                                                                                 | RO recovery ≈ 0.49 from 39.5 → 77 g/L; EC 6.3 → ≈ 31 % yield loss                                                                                          |
| M3 site and energy (**done**)     | Site of compartments (about 5 ha each) sharing RO, CHP and packing; energy hub (CHP heat, power and CO₂, buffer, chilled-water heat reuse 1.163 × 25 K ≈ 29 kWh/m³); economics (yield 250 t/ha, labour about 1,000 days/ha, price, cost per kg, payback, about 1.9 kg CO₂e/kg) | 50 ha at 1.5 m³/m²·yr ≈ 2,055 m³/day (published 2,021); 122 ha ≈ 5,014 (published 4,932), within 5 %; cooling within about 10 kWh/m²·yr (**done**, PR #39) |
| M4 operations and data (**done**) | Scouting, releases, sprays (no WHO Ia/Ib), hygiene and maintenance logs; CSV import of T, RH, PAR, EC, pH, drain, weather; measured against calculated; alerts (VPD, heat stress, drain EC)                                                                                    | A real week of readings imported and compared without manual edits                                                                                         |

Principles: every module reads the same project (house, climate, crop); calculations stay pure with tests; offline first; SI units, TND, FR/AR/EN/IT/DE; advice rules are data; every reference value shows its source; planning aid only.
