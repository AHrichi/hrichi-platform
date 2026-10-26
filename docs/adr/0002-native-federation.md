# ADR-0002: Native Federation v4 for micro-frontends

- **Status:** Accepted (spike verified)
- **Date:** 2026-10-26
- **Milestone:** M0

## Context

Nx 23 deprecated its Angular Module Federation generators, executors and wrappers, and Nx 24 removes them. Angular builds with esbuild (`@angular/build:application`). Native Federation brings the Module Federation model to that builder using ES modules and import maps.

## Decision

- `@angular-architects/native-federation@~22.2.3` (v4), set up with its `init` schematic: `shell` as a **dynamic host** reading `public/federation.manifest.json`, `lab-hello` as a **remote**.
- **One sharing policy** for every app in `tools/federation/shared.mjs` (`singleton`, `strictVersion`, `requiredVersion: 'auto'`). Each `federation.config.mjs` only adds its name and exposes.
- **Remote contract** (`@ah/platform/federation`): every remote exposes `./routes` (`remoteRoutes: Routes`) and `./meta` (`remoteMeta: RemoteMeta`).
- **Loading:** `main.ts` passes the `initFederation()` result to `bootstrap()`, which provides it as `REMOTE_LOADER`. Routes use `federatedRoutes('<remote>')` as `loadChildren`. It applies a 10 s timeout, checks the contract, and on any failure returns a `RemoteUnavailable` route instead of rejecting. The deprecated top-level `loadRemoteModule` is not used.
- `main.ts` fetches `federation.manifest.json` itself and falls back to an empty manifest. `initFederation()` therefore always runs, so the shell still boots when the manifest is missing or broken, and every remote route shows the fallback.

## What M0 found

1. With `includeSecondaries: { keepAll: true }`, every `@angular/platform-browser` entry point is published, including `animations`, which imports the optional, deprecated `@angular/animations`. The build fails until those entry points are in `skip`. The `@angular/service-worker` config and worker scripts are skipped too: app code never imports them.
2. Workspace libraries on path mappings are shared automatically ("mapping-bundle"), e.g. `_ah_platform_federation-*.js`.
3. **Verified in the browser** (static builds, shell on :4200, remote on :4301):
   - Client navigation to `/labs/hello` fetched only `remoteEntry.json`, the routes chunk and one chunk from the remote. Angular was not downloaded twice, so singleton sharing works.
   - With the remote's server stopped, `/labs/hello` rendered "This section didn't load" and the shell stayed usable.
4. `initFederation()` also writes the import map for the **shell's own** shared packages. When it was given the manifest URL and the fetch failed, it rejected before writing that map. Loading the bootstrap chunk then failed with `Unable to resolve specifier '@angular/core'`, so a missing manifest blanked the whole site. Fetching the manifest in `main.ts` fixed it. Verified on `wrangler dev` with the manifest returning 404: the shell booted and `/labs/hello` showed the fallback. The `shell-e2e` spec "boots without the federation manifest" now covers this case.
5. The Nx wrapper redirects the schematic's `angular.json` edits into `project.json`, and the install step uses pnpm. The resulting targets are `build` (federation builder), `esbuild` (Angular builder), `serve` and `serve-original`.

## Consequences

- Every new remote copies the same three-line `federation.config.mjs`. The planned `@ah/workspace-plugin:remote` generator will write it.
- Shared versions cannot drift at build time. Version skew between independently _deployed_ remotes still needs the planned CI check against each remote's `./meta`.
- The manifest holds absolute remote URLs, so each environment needs its own manifest at deploy time.
