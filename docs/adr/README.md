# Architecture decision records

Each ADR records one decision, why it was made, and what a spike proved. New ADRs take the next number; superseded ones stay and link to their replacement.

## Accepted

| ADR                                     | Decision                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| [0001](0001-nx-integrated-monorepo.md)  | Nx 24 integrated monorepo, pnpm, single version policy                         |
| [0002](0002-native-federation.md)       | Native Federation v4, dynamic host, remote contract `./routes` + `./meta`      |
| [0003](0003-static-first-rendering.md)  | Prerendered shell, client-rendered remotes, no server                          |
| [0004](0004-zoneless.md)                | Zoneless everywhere, enforced by `pnpm check:zoneless`                         |
| [0005](0005-pwa-with-federation.md)     | Service worker regenerated after the federation build                          |
| [0006](0006-content-security-policy.md) | CSP header with build-time hashes; `autoCsp` is incompatible with prerendering |
| [0007](0007-cloudflare-hosting.md)      | Cloudflare Workers static assets, one Worker per app, affected deploys from CI |

## Proposed (written when the area is built)

From [the architecture document](../architecture.md) §16:

- State ladder: signals → NgRx SignalStore → Events plugin; no classic `@ngrx/store`
- Design tokens (DTCG + Style Dictionary), cascade layers, logical properties, Angular Aria + CDK
- Framework-agnostic Three.js engine with a thin Angular adapter
- Zero-cost hosting topology with graceful degradation
- Lead pipeline: document outbox, direct Telegram alert, n8n push and pull
- Single-source content → site, CV PDF, JSON-LD, assistant
- One feature lib, many shells (remote, PWA, Electron, Capacitor)
- OpenAPI contract-first clients for NestJS and Spring Boot
- Runtime i18n (Transloco), EN/FR, URL-based locale, RTL-ready
