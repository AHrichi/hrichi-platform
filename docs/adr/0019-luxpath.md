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
- **Map:** Leaflet loads lazily in the browser. Its stylesheet is scoped under `lp-map-screen` and ships with the component, so the shell needs no global CSS. The CSP allows `https://tile.openstreetmap.org` in `img-src` and in `connect-src`: once the shell's service worker controls the page it fetches every request itself, and a worker's fetches are checked against `connect-src`. Without it, returning visitors got grey tiles (504 from the worker).
- **Wires and span** (added 2026-11-01): sag and tension of an aerial bundled cable by the parabolic change-of-state equation, in four cases (strung at 15 °C, design wind, −5 °C, 50 °C). It checks the wire (worst tension ≤ ⅓ of the breaking load, NF C 11-201), the pole (load at the attachment, by its role in the line: in line, angle or end, against its nominal load near the top) and the clearance on a hot day, and searches for the longest span that passes all three. Cable figures are typical catalogue values and the screen says to check the datasheet.
- **Plumb check by gravity, on two sides:** the phone reads `DeviceMotionEvent.accelerationIncludingGravity` rather than the orientation angles, which jump around near the upright (gimbal lock) and made a steady reading impossible. A reading saves only once a second of samples is still. Side A, then the opposite side B: half the difference keeps the pole's lean and cancels the phone's own error and the taper of a conical pole (the reversal method).
- **AR tape in the browser:** WebXR `immersive-ar` with hit-test (ARCore on Android Chrome), three.js loaded only when it starts, a DOM overlay for the controls, and `xr-spatial-tracking=(self)` in the Permissions-Policy. Considered and rejected: a Python service estimating depth from photos. Monocular depth is relative, so metric results need a reference in the picture; models that guess metric depth are large, often 10–20 % off at street distances, and don't fit a free host; and photos of the site would leave the phone. Where WebXR AR is missing (iPhone Safari, desktop), the angle method and the map remain.
- **Sideways rows say they scroll:** the design system's `ahScrollHint` (on tabs, the segmented control, the header nav, the apps page jumps and LuxPath's tabs) shows a fading chevron on each side with more content, nudges once when first seen (not with reduced motion), and cancels its own width and the row's gap so nothing shifts.

- **Starts empty** (2026-11-01): a new device has no project; the sample projects load on request and sit beside the user's own. A Guide screen explains every tool and links to it.
- **Backups without a backend:** projects stay in IndexedDB; a versioned JSON file (`app`, `version`, `projects`) is saved to the device or handed to the Web Share sheet, which offers Google Drive on Android and Files or Drive on iOS, so no Google sign-in or API key is needed. Restoring reads the file, leaves out damaged entries, and brings a project whose id is already there in as a copy, so nothing is overwritten. A direct Drive sync would need a Google Cloud OAuth client and is left for later.
- **Real photos from an open API:** catalogue photos come from the Wikimedia Commons API (free, no key), picked by hand and fetched by `tools/scripts/material-photos.mjs` with their author and licence. They ship inside the app as data URIs in a module loaded only by the Materials screen (about 200 kB), so they work offline and inside the shell, and need no image host in the CSP. Openverse was tried but timed out and throttled too often to rebuild from. No open photo shows an all-in-one solar luminaire well, so that one keeps its drawing.

- **A steadier plumb check:** phone accelerometers jitter by a few tenths of a degree even when still, so judging "steady" from the raw spread made the reading jump and rarely let the user save. Chrome's fused `GravitySensor` (accelerometer plus gyroscope) is used where available, the live value is smoothed, and each side is measured over 3 seconds and averaged; a capture whose spread shows the phone moved is refused.
- **Cable and pole type in the spacing:** the Spacing tab can take the overhead cable the poles carry (2 × 16 mm² by default) and the pole type (steel, aluminium, fibreglass FRP, concrete, wood, each with a typical rated load to replace with the plate's), and runs the span check at that spacing: poles in line, cable 0.6 m below the lamp, 6 m clearance.
- **Picking places on a map:** project and pole forms have a small Leaflet map: tap or drag a pin, use the phone's position, or search a place with OpenStreetMap's Nominatim (free, no key, asked only on search or when a project's point is set, within its one-request-a-second policy). The point names the project's location unless the user typed one. `connect-src` allows `nominatim.openstreetmap.org`.

- **Materials you can extend:** the catalogue gains overhead-cable and electrical categories and 21 more items (fibreglass, concrete and 12 m poles, bundled cables with their clamps and connectors, controllers, cabinets, clocks, photocells, earth rods). Users add their own materials or edit any item; these live in a second IndexedDB store (database version 2, projects untouched), are merged over the catalogue by id (so an edited item can be reset), and travel in backups. Prices show cents when they have them.

## Consequences

- The domain has 32 tests, including the change-of-state equation, the plumb maths and the backup format. `shell-e2e` covers the language switch, reopening, correcting and updating a saved calculation, the camera's maths, the span check and its save, the plumb guide, the AR tape's fallback, the scroll cues, the empty start and guide, backup and restore, and the photos, all under the production CSP. The AR session itself needs a real Android phone and is not covered by CI.
- The equipment catalogue keeps its suppliers' French descriptions, and standard summaries stay in English; the screens say so.
- Every rule has a stated source (EN 13201, EN 40-3, Eurocode 7, NF EN 206, NF C 17-200, NF C 11-201), but these are planning aids, not certified designs.
