# ADR-0005: PWA on a federated, prerendered shell

- **Status:** Accepted (spike verified)
- **Date:** 2026-10-26
- **Milestone:** M0

## Context

The shell should be installable and still open offline. Angular's service worker caches what `ngsw.json` lists, and that manifest is generated during the Angular build.

## Decision

- The service worker is set up by hand, because the `@angular/pwa` schematic does not work after Native Federation's builder swap (see below):
  - `@angular/service-worker`, `provideServiceWorker()` (production only, `registerWhenStable:30000`)
  - `apps/portfolio/shell/ngsw-config.json`, `public/manifest.webmanifest`, placeholder icons
  - `serviceWorker` set on the `esbuild` target's production configuration
- **`shell:build` is a wrapper target.** It depends on `shell:build-federation` (the Native Federation builder), then runs `ngsw-config` over the final `dist` folder. `nx build shell` therefore always produces a manifest that lists the federation artifacts.
- The service worker's navigation `index` is `index.csr.html`, not the prerendered `index.html`.
- `federation.manifest.json`, `remoteEntry.json` and `importmap.json` use a `freshness` data group (network first, cache fallback after 3 s).

## What M0 found

1. `nx g @angular/pwa:ng-add` fails with `Path "undefined" does not exist`. It reads `build.options.browser`, which now belongs to the federation builder, not the Angular builder.
2. Native Federation writes its shared bundles (`_angular_core.*.js`, `rxjs.*.js`, …) **after** Angular generates `ngsw.json`. The first build prefetched 11 files and none of the shared bundles, so an offline boot would have failed. After regenerating with `ngsw-config`, 35 files are prefetched, including every shared bundle.
3. Serving the prerendered home page for every navigation would hand `/labs/hello` the hydration data of `/`, so the service worker serves the client-rendered shell instead. First visits still get prerendered HTML from the CDN.
4. Verified in the browser: with the shell's server stopped, reloading `/` booted the app from the service worker cache, including the federated `@angular/core` bundle.

## Consequences

- Remote assets on other origins are not cached yet, so labs need the network. Caching them needs per-environment absolute URLs in `ngsw-config.json`; that comes with deployment.
- Returning visitors get client rendering from cache instead of prerendered HTML. That is fine: the bundles come from the cache.
- Any future change to how the federation builder emits files must keep `ngsw-config` running last.
