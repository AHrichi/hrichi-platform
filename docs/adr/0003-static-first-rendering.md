# ADR-0003: Static-first rendering: prerendered shell, client-rendered remotes

- **Status:** Accepted (spike verified)
- **Date:** 2026-10-26
- **Milestone:** M0

## Context

The portfolio must be fast, indexable and free to host. A Node server would add cost, cold starts and an operational surface. Native Federation supports SSR, but federated routes cannot be prerendered: remotes load at runtime.

## Decision

- The shell builds with `outputMode: "static"`. There is no Express server (`server.ts`, `express` and `cors` are removed).
- Server routes (`app.routes.server.ts`): content routes use `RenderMode.Prerender`; `labs/**` and the `**` fallback use `RenderMode.Client`.
- `federatedRoutes()` returns `[]` on the server platform, so prerendering never fetches a remote.
- Hydration with event replay stays on for prerendered pages.
- **Host contract**, implemented by `tools/scripts/serve-static.mjs` and required from the production host:
  1. Prerendered routes are served from `<route>/index.html`.
  2. Every other extension-less path falls back to `index.csr.html`.
  3. Responses allow cross-origin reads (remotes are on other origins).
  4. Hashed assets are `immutable`; HTML, JSON and the web manifest are `no-cache`.

## What M0 found

1. The Native Federation `init` schematic assumes runtime SSR. On an app with SSR it rewrites `RenderMode.Prerender` to `RenderMode.Server`, adds `cors` to `server.ts` and sets `ssr: true` on the federation build target. All three were reverted.
2. With the federation build option `ssr: true`, shared packages, **including workspace libraries**, become external in the server bundle. Prerendering then fails with `ERR_MODULE_NOT_FOUND: Cannot find package '@ah/platform'`. Without the option the server bundle is self-contained and prerendering succeeds: "Prerendered 1 static route."
3. The prerendered `index.html` contains the full home content, `ng-server-context="ssg"` and hydration data. `main.js` loads as `type="module-shim"` through es-module-shims.
4. Verified in the browser: a hard load of `/labs/hello` (served `index.csr.html`) boots the shell and renders the remote.

## Consequences

- Prerendered pages live on a CDN at zero cost and never wait for a server.
- Remote pages are not indexed. That is acceptable, because labs and app demos are interactive and the case-study content lives in the shell.
- The local `serve-static.mjs` answers unknown paths with `200` (a soft 404). Production returns a real `404`: Cloudflare serves `404.html` (a copy of the CSR shell) for unknown paths, and `_redirects` sends only `/labs/*` to the CSR shell with `200` (ADR-0007).
- Never re-enable `ssr: true` on the federation build target without moving to runtime SSR on purpose.
