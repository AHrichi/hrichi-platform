# ADR-0004: Zoneless change detection everywhere

- **Status:** Accepted (spike verified)
- **Date:** 2026-10-26
- **Milestone:** M0

## Context

Angular 22 runs without zone.js and drives change detection through signals. With micro-frontends, one remote that loads zone.js would patch browser APIs for the whole page, including the shell and every other remote.

## Decision

- Every app calls `provideZonelessChangeDetection()` explicitly: in the browser config, in the remote's standalone config, and in tests. No project lists zone.js in its polyfills, and no `package.json` depends on it.
- Components use `ChangeDetectionStrategy.OnPush`, signals, `computed()` and signal inputs.
- **Guards:**
  - `pnpm check:zoneless` (`tools/scripts/check-zoneless.mjs`) fails if zone.js appears in `package.json`, in any project's polyfills, or in an import under `apps/` or `libs/`.
  - The `@nx/enforce-module-boundaries` rule also bans `zone.js` through `bannedExternalImports`.

## What M0 found

1. Verified in the browser: inside the shell, three clicks on the federated remote's counter rendered "Clicked 3 times" and `computed()` = 6, with `window.Zone` undefined.
2. A deliberate `import 'zone.js'` probe was **not** reported by the lint rule, because `bannedExternalImports` only matches packages present in the project graph and zone.js is not installed. The same probe made `check:zoneless` exit with code 1. The script is the real guard; the lint rule is a second line once someone installs the package.

## Consequences

- When the four existing apps are imported, StrategyApp and Code de la Route must drop zone.js and any `NgZone.run` or `setTimeout`-driven UI updates. CI will fail until they do.
- Third-party libraries that assume zone.js (e.g. ones relying on `NgZone.onStable`) need checking before adoption.
