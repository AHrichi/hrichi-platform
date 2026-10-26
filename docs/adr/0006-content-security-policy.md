# ADR-0006: Content Security Policy from host headers with build-time hashes

- **Status:** Accepted (verified in production on 2026-10-26)
- **Date:** 2026-10-26
- **Milestone:** M0

## Context

A strict CSP limits the damage of an injection. The shell has inline scripts (Angular's event-dispatch contract, the event-replay bootstrap, the critical-CSS loader) and loads modules through es-module-shims. It also fetches code from remote origins.

## Decision

The production host sends this policy as a header. The hashes are generated after each build from the inline scripts in every HTML file:

```
default-src 'self';
script-src 'self' 'sha256-<inline scripts>' blob: <remote origins>;
style-src 'self' 'unsafe-inline';
connect-src 'self' <remote origins>;
img-src 'self' data:;
object-src 'none';
base-uri 'self'
```

## What M0 found

1. Angular's `security.autoCsp` cannot be used: the build fails with "Cannot set both SSR and auto-CSP at the same time", and prerendering counts as SSR.
2. With hashes and remote origins but **without `blob:`**, the browser blocked `blob:http://localhost:4200/…`: es-module-shims in shim mode runs module code from blob URLs, so the app never booted.
3. With `blob:` added, the prerendered page hydrated, client navigation loaded the remote, and no new violations were reported.
4. `style-src` needs `'unsafe-inline'`: Angular inserts component styles as `<style>` elements, and the critical-CSS step inlines styles.

## Consequences

- `blob:` in `script-src` is a known trade-off: a blob URL can only be created by script already running on the page, so it does not open a path for injected markup.
- Hashes change with every build, so the header is regenerated on every deploy. `tools/scripts/prepare-hosting.mjs` hashes the inline scripts of every built HTML file and writes the `_headers` file, taking the remote origins from `tools/federation/remotes.json`. It fails the deploy if a line exceeds Cloudflare's 2,000-character limit.
- Verified in production (`ahmed-hrichi.ah-source.workers.dev`): the policy arrives as a response header, and loading the home page, navigating to the remote and using it reported zero `securitypolicyviolation` events and no console errors.
- Follow-up: test native import maps (`shimMode: false`), which would remove the need for `blob:`.
