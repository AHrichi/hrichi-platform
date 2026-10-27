# Architecture decision records

Each ADR records one decision, why it was made, and what a spike proved. New ADRs take the next number; superseded ones stay and link to their replacement.

## Accepted

| ADR                                            | Decision                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [0001](0001-nx-integrated-monorepo.md)         | Nx 24 integrated monorepo, pnpm, single version policy                                   |
| [0002](0002-native-federation.md)              | Native Federation v4, dynamic host, remote contract `./routes` + `./meta`                |
| [0003](0003-static-first-rendering.md)         | Prerendered shell, client-rendered remotes, no server                                    |
| [0004](0004-zoneless.md)                       | Zoneless everywhere, enforced by `pnpm check:zoneless`                                   |
| [0005](0005-pwa-with-federation.md)            | Service worker regenerated after the federation build                                    |
| [0006](0006-content-security-policy.md)        | CSP header with build-time hashes; `autoCsp` is incompatible with prerendering           |
| [0007](0007-cloudflare-hosting.md)             | Cloudflare Workers static assets, one Worker per app, affected deploys from CI           |
| [0008](0008-design-tokens-and-ui.md)           | Design tokens (DTCG + Style Dictionary) with a contrast gate, cascade layers, `@ah/ui`   |
| [0009](0009-content-audiences-and-seo.md)      | Typed content, audience modes, SEO, generated CV, Lighthouse gate                        |
| [0010](0010-lead-pipeline.md)                  | Lead pipeline: document outbox, direct Telegram alert, n8n push and pull                 |
| [0011](0011-three-engine-and-constellation.md) | Three.js engine, `<ah-scene>` adapter and the constellation hero with an SVG fallback    |
| [0012](0012-federation-inspector.md)           | Federation Inspector: remote telemetry, capability checks, build info, skew check        |
| [0013](0013-orbit-api.md)                      | Orbit API: Spring Boot 4 + Orekit, polite CelesTrak cache, contract-first, JVM on Render |
| [0014](0014-orbit-lab.md)                      | Orbit lab: satellites on a WebGL globe, SGP4 in a cross-origin worker, snapshot first    |

## Proposed (written when the area is built)

From [the architecture document](../architecture.md) §16:

- State ladder: signals → NgRx SignalStore → Events plugin; no classic `@ngrx/store`
- Zero-cost hosting topology with graceful degradation
- One feature lib, many shells (remote, PWA, Electron, Capacitor)
- OpenAPI contract-first clients for NestJS (the Orbit API is done: ADR-0013)
- Runtime i18n (Transloco), EN/FR, URL-based locale, RTL-ready
