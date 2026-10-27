# ADR-0016: Sky lab: the night sky over any place and time

- **Status:** Accepted
- **Date:** 2026-10-27
- **Milestone:** M2
- **Supersedes:** ADR-0014 (Orbit lab)

## Context

The Orbit lab showed every satellite on a globe, but the portfolio's owner is a constellation and camping fan, and a sky you can stand under says more than dots around the Earth. The lab becomes a planetarium: pick a campsite on a 3D Earth, dive down to the ground, and look up at the real sky for any date and time. ADR-0014's rules still hold:

- the lab never waits on an API;
- its intro is prerendered (`LabFrame`);
- it works in text without WebGL;
- it's checked under the production CSP.

## Decision

- **Remote `lab-sky`** (`apps/labs/sky`, port 4302, `lab-sky.ahmed-hrichi.workers.dev`):
  - It replaces `lab-orbit`. The shell mounts it at `/labs/sky`, and `/labs/orbit` redirects there; Angular prerenders a meta-refresh page for it, so old links work even before the app boots.
  - `./meta` declares no capabilities: without WebGL the lab still describes the night in text.
- **`lab-sky-domain`** (pure TypeScript, on Astronomy Engine, MIT):
  - **`equatorialToLocal()`:** one 3×3 rotation from J2000 to the observer's frame (x east, y up, z south) for a place and time, built by rotating basis vectors through `Rotation_EQJ_HOR`.
  - **`skyAt()`:** the Sun, the Moon (phase and lit fraction) and the five naked-eye planets, with refraction.
  - **`nightSummary()`:** sunset, the astronomically dark window (Sun below −18°), sunrise, Moon and planet rise and set, constellations overhead, and active meteor showers.
  - **`meteor-showers.json`:** thirteen showers from the International Meteor Organization's calendar.
  - Also: places and shareable links (`?lat&lon&at`), time-zone-correct date inputs, and formatting.
- **The catalogue:** `tools/scripts/sky-catalog.mjs` downloads d3-celestial's data at a pinned commit (BSD-3-Clause, © Olaf Frohn; stars from XHIP) and checks SHA-256 hashes. It writes compact JSON, brightest star first, so an index means the same star everywhere:
  - 5,044 stars to magnitude 6
  - 89 constellation figures and labels
  - 701 named or lettered stars

  It's about 66 kB gzipped and lives in the lazy chunks. The licence notice is in `THIRD_PARTY_NOTICES.md`.

- **`three-scene-sky`** (framework-free, lazy, through `<ah-scene essential>`):
  - **Two scenes, one renderer:** the dot-matrix Earth from the Orbit lab with the real terminator, and the sky. A custom render pass draws the globe, then the sky with a fade.
  - **The dive:** "Look up" flies the camera from orbit to just above the spot in 1.6 s while the sky fades in, then tilts the view up from the horizon. "Back to Earth" reverses it.
  - **The sky, each part one draw call:**
    - **Dome:** a shader for night, twilight glowing towards the Sun, and day; the Sun's and Moon's glow; and a procedural Milky Way in galactic coordinates.
    - **Stars:** one point cloud turned by one matrix uniform. Size and opacity follow magnitude; colour follows B−V. The limiting magnitude falls through twilight and under a bright Moon.
    - **Constellation figures**, highlighted when selected.
    - **The Moon:** a sphere lit by the real Sun, so its phase and terminator tilt come out by themselves.
    - **The Sun and planets** as glowing points.
    - **Meteors** streaking from active radiants, at twelve times their real rate.
    - **A skyline** of hills and pines with a flickering campfire.
  - **Labels** (compass points, constellations, bright stars, planets, shower radiants) are an HTML overlay, `aria-hidden`; the page lists the same things as text.
  - **Input:** drag to look, scroll or pinch to zoom, click to select; buttons face north, east, south or west.
- **`lab-sky-feature`:** the page and a SignalStore.
  - **Clock:** a simulated clock (paused, live, ×60, ×600, ×3600) that the scene reads every frame.
  - **Place and time:** a city list, "Use my location" (the browser's geolocation; nothing leaves the page), a date-time input in the place's time zone, and a sunset-to-sunrise slider.
  - **Panels:** layer toggles, the selection's details, "What's up tonight" and a shareable link.
- **Reduced motion:** the dive is a crossfade, time starts paused, and there's no twinkling, flicker or meteors.
- **Hosting:** `Permissions-Policy` allows `geolocation=(self)`.

## What M2 found

1. **Building the rotation from basis vectors avoids matrix-layout bugs.** The test compares Vega through our matrix against Astronomy Engine's `Horizon()`: they agree to within 0.02°, with aberration the only difference. Polaris sits at the observer's latitude, due north.
2. **d3-celestial stores right ascension as a longitude in −180…180°** (Vega appears at −80.77°). The generator converts it back.
3. **Astronomy Engine is one large ES module.** Shared through Native Federation it would ship whole; on the skip list, esbuild tree-shakes it into the remote. The page chunk is 79 kB gzipped (domain, names, Astronomy Engine) and the scene chunk 46 kB (stars, figures, coastlines, OrbitControls). three.js is still the shell's shared copy.
4. **The first Milky Way looked like stripes.** Its smooth parallel lanes and value noise's lattice lined up. Rotating the domain between noise octaves, letting the band's width and dark rift wander with noise, and adding clumpy star clouds made it read as the real thing.
5. **Stars of one or two pixels vanished on a normal screen.** Sizes now run from 2 to 11 px, with an opacity floor, so a magnitude 5 star stays visible.
6. **Verified:**
   - Domain: 22 tests, including midnight sun in Tromsø, no astronomical night in a Reykjavík June, the Perseids' peak and time zones across daylight saving.
   - Scene data and store: 11 tests.
   - e2e, under the production CSP: the prerendered intro, the dive, a city change and its link, a shared link opening paused at its moment with the Perseids listed, the `/labs/orbit` redirect, no WebGL and reduced motion. axe finds no violations.
   - By hand: Tunis at 23:30 on 12 August faces Sagittarius with the Milky Way's core rising through Scutum; Tunis at 20:00 on 27 October shows the nearly full Moon beside the Pleiades in Taurus, washing out nearby stars.

## Consequences

- The satellite catalogue, SGP4 worker and pass predictions are gone. The Orbit API becomes a night planner (ADR-0017).
- Refreshing the catalogue is a deliberate, reviewed change: bump the pinned commit and hashes in `sky-catalog.mjs`.
- New sky features plug into `SkyFrame`. The scene stays free of astronomy code, which lives in the domain library and is unit-tested.
