# ADR-0019: LuxPath on the design system, with drawings you can edit

- **Status:** Accepted
- **Date:** 2026-10-31
- **Milestone:** M2

## Context

LuxPath, the street and solar lighting field kit (`product-lighting`), arrived as nine components with inline templates. It had:

- utility classes standing in for the design system, global SVG overrides and `ViewEncapsulation.None` everywhere;
- an Angular language service inside the runtime-agnostic domain library;
- calculation results written as French or English sentences in the domain;
- three bugs:
  - The calculators' results never updated, because `computed()` read plain objects instead of signals.
  - The rangefinder passed its arguments in the wrong order, so distances were wrong.
  - The plumb check used the bolt thread pitch (2.5 mm) as the bolt spacing.

Inside the portfolio, the map also lost its stylesheet, and the CSP blocked its tiles.

Engineers use it on site, mostly on a phone, often in full sun. They need to see how each result is worked out, and to correct a reading or a saved result afterwards.

## Decision

- **Domain (`product-lighting-domain`, pure TypeScript):**
  - Results carry codes, not prose: `notes: CalcNote[]` (`code`, `severity`, `values`) and structured fields such as `anchorBolts`. The feature writes the sentences in the reader's language.
  - Projects store `calculations` (the inputs of each saved calculation) and `measurements` (camera readings). Inputs are stored, never results, so reopening recomputes with the current rules.
  - `measurePoleHeight(h, α, β)`: D = h / tan α, H = D × tan β + h.
  - Calendar and email reminders take their labels as an argument; the browser download moved to the feature.
- **Feature, on platform tokens and `@ah/ui`:**
  - Per-component templates and SCSS, with shared mixins in `styles/_luxpath.scss`.
  - On phones a bottom bar shows four screens plus "More"; wider screens get tabs.
  - Sunlight mode overrides the colour tokens on LuxPath's root, for full contrast.
- **Drawings, drawn to scale and editable:** spacing, foundation section, solar energy and night dimming, cable run, rangefinder, plumb level, slump cone and curing strength.
  - Each has drag handles (`lpSvgDrag`: pointer events mapped through the SVG's own matrix). The handles work from the keyboard (`role="slider"`, arrow keys) and mirror number fields beside the drawing.
  - Each calculator shows "How it's calculated", with the current numbers in every formula.
  - The camera screen opens with a three-step illustrated guide. The rangefinder drawing zooms to fit, but holds its zoom while a handle is dragged.
- **Editing:** every save offers "Update saved result" or "Save as a copy". Projects lists saved results; "Open & edit" reopens one in its tool (`?tab=…&edit=…`). Saved results can be renamed and deleted. Poles and milestones are edited in modals.
- **Storage:** IndexedDB. The portfolio demo uses its own database (`ah-demo-lighting`, ADR-0002), and the samples seed only a newly created database.
- **Map:** Leaflet loads lazily in the browser. Its stylesheet is scoped under `lp-map-screen` and ships with the component, so the shell needs no global CSS. The CSP allows `https://tile.openstreetmap.org` images.

## Consequences

- The domain has 16 tests. `shell-e2e` covers the language switch, reopening, correcting and updating a saved calculation, and the camera's maths, all under the production CSP.
- The equipment catalogue keeps its suppliers' French descriptions, and standard summaries stay in English; the screens say so.
- Every rule has a stated source (EN 13201, EN 40-3, Eurocode 7, NF EN 206, NF C 17-200), but these are planning aids, not certified designs.
