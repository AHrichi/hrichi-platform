# ADR-0014: Orbit lab: every active satellite on a WebGL globe

- **Status:** Superseded by [ADR-0016](0016-sky-lab.md): the lab became the Sky lab
- **Date:** 2026-10-27
- **Milestone:** M2

## Context

M2's 3D lab replaces Quote3D (ADR-0013 explains why). It has to show Three.js, custom shaders and a Web Worker doing real work, use the Spring Boot Orbit API for something only the backend does well, and stay useful when that free-tier API is asleep. It ships as an independent micro-frontend, so it also has to run inside the shell, from another origin.

## Decision

- **Remote `lab-orbit`** (`apps/labs/orbit`, port 4302):
  - Built like `lab-hello` and served from `lab-orbit.ahmed-hrichi.workers.dev`.
  - Its `./meta` declares `['worker']`, so the shell checks for workers before mounting it (ADR-0012). Without WebGL the lab still lists satellites and passes, so WebGL isn't required.
  - The shell mounts it at `/labs/orbit`; it is linked from the footer, the home page and the constellation.
- **A prerendered frame:** the shell's `labs/*` routes render `LabFrame` (`@ah/platform/federation`), with the lab's intro from `@ah/shared/content`, and mount the remote inside it.
  - The shell prerenders that frame, so the first paint and the LCP come from static HTML and never wait for the remote.
  - The frame's body keeps a screen's height, so the footer starts below the fold and doesn't move when the remote arrives.
  - In standalone mode the remote's own app renders the same frame.
- **Libraries:**
  - **`lab-orbit-domain`** (pure TypeScript):
    - the OMM type and the bundled snapshot
    - orbit shape and class, and groups, mirroring the Orbit API's Java rules with the same test cases
    - sidereal time and the Sun's direction (checked against satellite.js and the equinox and solstice)
    - about 60 cities with time zones, and formatting
  - **`lab-orbit-feature`:** the page, an NgRx SignalStore, the API client and the worker.
  - **`three-scene-orbit-globe`:** the WebGL scene, framework-free and loaded lazily through `<ah-scene essential>`.
- **Propagation in a worker:**
  - satellite.js 7 (SGP4) propagates the whole catalog, 16,821 satellites, 1–4 times a second depending on the simulation speed.
  - Positions come back as transferable `Float32Array`s.
  - The globe's vertex shader interpolates between the last two frames, so motion is smooth at the display's rate. Frames are requested one step ahead.
- **The globe** (custom GLSL, one draw call per layer):
  - A dot-matrix Earth rasterised at run time from Natural Earth's outlines (public domain, via `world-atlas`), turned by sidereal time and lit by the real Sun with a soft terminator.
  - A Fresnel atmosphere.
  - Every satellite as one point cloud coloured by orbit class. Groups are filtered in the shader with a bit mask.
  - The selected satellite gets a ringed marker and its orbit as a dotted ring, while the rest of the catalog dims.
  - Clicking picks the nearest satellite on screen that the Earth doesn't hide.
- **Never waits on the API:**
  - The page renders the 155 brightest satellites from the bundled snapshot at once.
  - It asks the Orbit API for the full catalog. Requests retry for up to 150 s, honour `Retry-After`, and say "waking" after 3 s.
  - It swaps the catalog in when the API answers. Pass predictions show the same waking state.
  - With no API configured, or none answering, the lab says so and keeps working.
- **`essential` scenes:** `detectQuality(…, { essential: true })` ignores the comfort rules (reduced motion, small screens, few cores) that turn the decorative hero off. The globe is the content, so only a missing WebGL2 or `?3d=off` hides it. With reduced motion the camera doesn't turn by itself.
- **Config:**
  - `orbitApiUrl` joins `site-config.json`.
  - `SiteConfigService` moved to `@ah/shared/site-config` (a federation singleton), so the remote reads the shell's file inside the shell and its own file standalone.
  - `prepare-hosting.mjs` adds the API's origin to `connect-src`.

## What M2 found

1. **A remote can't start its own Web Worker inside the shell:** browsers start workers only from the page's origin.
   - `startPropagationWorker()` starts a same-origin `blob:` module that imports the remote's worker script.
   - The shell's CSP needs `worker-src 'self' blob:` plus the remotes' origins, because a module worker's imports are checked against `worker-src`, not `script-src`. Local servers send no CSP, so this showed only in production: the worker never started and the lab's telemetry stayed at "…". A local check, serving the shell with its real development CSP, reproduced the failure with the old policy and passed with the new one.
   - Angular still finds and bundles the worker, because the call keeps the `new Worker(new URL(…, import.meta.url))` shape with a locally shadowed `Worker`.
2. **satellite.js 7's entry point re-exports its WebAssembly build,** whose Node-only branches import `node:module` and `node:worker_threads`. The browser build can't resolve them, and `externalDependencies` doesn't reach Angular's separate worker build. The package exports nothing else, so the worker imports satellite.js's plain modules by path (`propagation/sgp4.ts`).
3. **Native Federation shares `three`, and esbuild treats every `three/…` subpath as part of that external.** The import map lists only the package root, so `three/addons/controls/OrbitControls.js` failed at run time ("Unable to resolve specifier"). The addon is bundled with the scene by path, and its own `import 'three'` still uses the shared copy.
4. **A worker has no import map,** so anything it imports must be bundled. `satellite.js`, `world-atlas` and `topojson-client` are on the federation skip list.
5. **NgRx freezes state in development, and typed arrays can't be frozen.** The catalog feed, the orbit path and the telemetry live in `withProps`; `withState` holds only plain data.
6. **The shell's service worker answered cross-origin requests with 504,** first the API calls in development, then the remote itself in production.
   - **The cause:** a service worker keeps the CSP its script was served with, and the browser reinstalls it only when the script's bytes change. `ngsw-worker.js` is identical from deploy to deploy, so a returning visitor's worker still had the CSP from before `lab-orbit` and the Orbit API existed. It refused its own fetches and returned 504, even though the page's new CSP allowed them.
   - **The fix:** `prepare-hosting.mjs` stamps the CSP's hash into `ngsw-worker.js` and updates the script's hash in `ngsw.json`. Any CSP change now reinstalls the worker with the new policy.
   - The API client still appends `ngsw-bypass=true`, a query parameter rather than a header so there's no CORS preflight, because the worker has nothing to cache for those calls.
7. **springdoc leaves record components optional,** so every generated TypeScript field was `| undefined`. An `OpenApiCustomizer` marks the API's record components required, which the JSON always contains.
8. **A one-pixel WebGL line disappears inside 16,821 points.** The selected orbit is drawn as 240 fixed-size points, and the other satellites dim to 30%.
9. **Sizes, gzipped:** the page chunk is 24 kB (including the 65 kB snapshot), the scene 31 kB (including Natural Earth's 55 kB outline and OrbitControls), and the worker 9.7 kB. three.js is the 189 kB bundle the shell shares, already cached after the hero.
10. **Client-rendered lab routes failed the mobile Lighthouse budget in CI:** performance 0.39, FCP 8.0 s, LCP 10.6 s, CLS 0.20.
    - On a throttled phone nothing paints until the shell's Angular, the federation runtime and the remote have all loaded. The remote's arrival then pushed the footer down.
    - With the prerendered frame, CI measures FCP and LCP at 0.77 s (from 8.0 s and 10.6 s) and CLS at 0.
    - The composite score only reached 0.74. On Lighthouse's simulated slow-4G phone with a 4× slower CPU, the shell's federation boot alone ends at about 8 s, so the remote paints at about 10 s however light it is. That leaves Speed Index at 8.1 s, and all the boot work lands after the first paint (TBT 760 ms).
    - **Lab routes therefore have their own assertions** (`assertMatrix` in `lighthouserc.json`). The budgets that architecture §11 says CI must enforce, LCP ≤ 2 s and CLS ≤ 0.05, fail the build, as do accessibility 100, SEO 100 and best practices ≥ 0.95. The composite score of 0.9 is a warning. Content pages keep the 0.9 gate. On desktop, with WebGL on SwiftShader, the lab scores 0.99 locally, and the desktop config still fails it below 0.9.
11. **Verified:**
    - Unit: the domain (16), the store, the API client's retries and the worker bridge (14), the remote's contract (2).
    - e2e: snapshot mode with axe; the live catalog and visible passes with a mocked API; search without WebGL.
    - By hand, with the Orbit API running locally: 16,821 satellites live, the ISS's passes over a city, and clicking a Starlink satellite on the globe shows its 70° orbit and new passes.

## Consequences

- The lab is useful with the API asleep or gone, and honest about which data it shows.
- Every new third-party import in a worker, or `three/…` subpath, needs the same path-import treatment; the ADR is the place to look.
- The classification rules live in both Java and TypeScript; their tests share cases, so a change to one shows up in the other's tests.
