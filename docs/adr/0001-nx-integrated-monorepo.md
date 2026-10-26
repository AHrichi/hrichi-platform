# ADR-0001: Nx integrated monorepo with pnpm

- **Status:** Accepted
- **Date:** 2026-10-26
- **Milestone:** M0

## Context

The portfolio, its labs, the four existing apps (StrategyApp, DeutschLernen, Code de la Route, Accountability Architect) and the backends live in one repository. Every app is Angular, and Native Federation shares workspace libraries through TypeScript path mappings.

## Decision

- **Nx 24.0.1**, integrated layout: one root `package.json`, `project.json` per project, `tsconfig.base.json` path mappings (`@ah/*`). No package-manager workspaces or TypeScript project references.
- **pnpm 10** (installed globally through npm, because `corepack enable` cannot write to `C:\Program Files\nodejs` without admin rights).
- **Single version policy:** Angular 22.2, TypeScript 6.0, Native Federation 22.2 for every app.
- Folders follow `docs/architecture.md` §4.2: `apps/<area>/<name>`, `libs/<area>/<name>`, `tools/`.

## What M0 found

1. `create-nx-workspace@24 --preset=apps --workspaces=false` maps the legacy preset to the `nrwl/empty-template`, which ignores `--workspaces=false` and produces a package-based workspace (TS project references, `@org/source`). The `angular-monorepo` preset maps to a demo shop template. Neither fits, so the workspace was created by hand: `package.json` → `pnpm add -D nx` → `nx add @nx/angular` → generators.
2. TypeScript 6 deprecates `compilerOptions.baseUrl` and the Angular compiler fails on the deprecation (TS5101). `tsconfig.base.json` therefore has no `baseUrl`; all `paths` entries start with `./`.
3. pnpm 10 blocks dependency build scripts by default. The ones the toolchain needs are allow-listed in `package.json` → `pnpm.onlyBuiltDependencies`.

## Consequences

- Nx generators for Angular work unchanged, and `nx affected` covers every app.
- Upgrades happen once for the whole repo (`nx migrate`), which is the point of the single version policy.
- New TypeScript-only projects must also use path mappings, not workspace packages, until Nx's Angular plugin supports the package-based layout.
