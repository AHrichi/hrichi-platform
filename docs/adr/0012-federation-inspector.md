# ADR-0012: Federation Inspector and shared-dependency skew checks

- **Status:** Accepted
- **Date:** 2026-10-27
- **Milestone:** M2

## Context

Hiring engineers should be able to see that this site is a micro-frontend platform without reading the code: which remotes loaded, how fast, which build each one runs, and whether the shared dependencies line up. Remotes deploy independently, so version skew between them and the shell is a real failure mode, and it should be caught after every deploy, not by a visitor.

## Decision

- **`FederationStore`** (NgRx SignalStore with `withEntities`, in `@ah/platform/federation`) records every remote load: status, start time, duration, `./meta`, and why it failed.
  - `federatedRoutes()` now loads `./routes` and `./meta` together, under the same timeout. A remote without `remoteMeta` breaks the contract and gets the fallback.
- **Capability check:** remotes declare `capabilities` in `./meta`. If the browser lacks one, the remote isn't mounted, and `RemoteUnavailable` explains which feature is missing instead of offering a retry that can't help.
  - WebGL is tested by creating a context, because the constructor exists even when the GPU is blocklisted.
- **Build identity at deploy time:** `prepare-hosting.mjs --app <name>` writes `build-info.json` (app, commit SHA, build time) next to each deployed app. The Inspector reads it from each remote's origin; remotes already send `Access-Control-Allow-Origin: *`.
- **The panel:** `@ah/platform/inspector` opens from "Open the hood" in the footer or from `?inspect=1`.
  - The shell uses `@defer (when inspecting())`, so the panel and `web-vitals` are a lazy chunk.
  - It has four tabs, following the WAI-ARIA tabs pattern with arrow keys:
    - **Remotes:** status, load time, version, build and needs, for every remote in `federation.manifest.json`.
    - **Shared deps:** every `remoteEntry.json` against the shell's, with a flag on skew.
    - **State:** live `getState()` snapshots of `PreferencesStore` and `FederationStore`.
    - **Web Vitals:** LCP, INP, CLS, FCP and TTFB from `web-vitals`, which reads buffered entries, so opening the panel late still measures the page load.
  - Escape closes the panel and returns focus to the button.
- **`web-vitals` is not federated:** it's in the federation `skip` list, so it is bundled into the Inspector's own chunk instead of becoming a shared singleton.
- **Skew check in CI:** after each production deploy, `tools/scripts/check-skew.mjs` fetches the live shell's `remoteEntry.json` and every remote's. The job fails if any package version differs.

## What M2 found

1. **A store member name can't be both a computed and a method.** `failed` was a computed list and a method, and NgRx refused the override at runtime ("SignalStore members cannot be overridden"). The methods are now `recordStart`, `recordLoaded` and `recordFailure`.
2. **`setEntity` infers the entity type from its argument.** An inline literal with `status: 'loading'` narrowed the entity type, and the store's `RemoteLoad` no longer matched. Typing the literal as `RemoteLoad` fixed it. Vitest didn't catch this, because it doesn't type-check; the Angular build did.
3. **axe requires scrollable regions to be focusable** (`scrollable-region-focusable`). The State tab's `<pre>` blocks scroll, so they take `tabindex="0"` and a label.
4. **Compiling the SHA into `./meta` would bust Nx's cache on every commit.** Even an unchanged remote would rebuild and redeploy. `build-info.json` is written at deploy time instead, so cached builds stay valid.
5. **The hero caption duplicated a footer link.** "Micro-frontend demo" now appears twice on the home page, so the e2e tests scope their clicks (`contentinfo`, `figure`).
6. **Verified:**
   - Unit: the store records loads, failures, timeouts and missing capabilities. The panel lists remotes with build and timing, flags `rxjs` skew, shows state and vitals, and closes on Escape.
   - e2e: `?inspect=1` on `/labs/hello` shows `lab-hello` loaded with its time; the tabs work with the arrow keys; axe reports nothing in the panel; Escape returns focus. A remote that is down shows as failed.

## Consequences

- Every remote must export `remoteMeta`. A remote that doesn't loads as "contract" failed.
- The skew check runs against production after every deploy, so drift between independently deployed remotes is caught at the deploy that causes it.
- The Inspector adds nothing to the initial bundle; the footer button is the only cost.
