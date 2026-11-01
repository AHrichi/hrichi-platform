# hrichi-platform

Ahmed Hrichi's portfolio, built as the kind of platform it describes: an Nx monorepo of zoneless Angular 22 micro-frontends on Native Federation, prerendered for a static host and installable as a PWA.

- Architecture: [docs/architecture.md](docs/architecture.md)
- Decisions and spike results: [docs/adr](docs/adr/README.md)
- Lead pipeline setup (accounts, secrets, n8n): [docs/lead-pipeline.md](docs/lead-pipeline.md)
- Live: [portfolio.ahmed-hrichi.workers.dev](https://portfolio.ahmed-hrichi.workers.dev) (shell), [lab-sky.ahmed-hrichi.workers.dev](https://lab-sky.ahmed-hrichi.workers.dev) (remotes), [design.ahmed-hrichi.workers.dev](https://design.ahmed-hrichi.workers.dev) (Storybook) and [ahmed-hrichi-api.onrender.com/health](https://ahmed-hrichi-api.onrender.com/health) (lead API; sleeps when idle)

## Projects

| Project                     | Path                               | What it is                                                                                     |
| --------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `shell`                     | `apps/portfolio/shell`             | Host. Prerendered content pages, PWA, loads remotes from `public/federation.manifest.json`     |
| `shell-e2e`                 | `apps/portfolio/shell-e2e`         | Playwright tests for prerendering, federation and remote fallback                              |
| `product-dispatch`          | `apps/products/dispatch/web`       | PulseOps: Commercial Laundry & Fleet Operations Dispatch Control Center (`/apps/dispatch`)     |
| `product-strategy`          | `apps/products/strategy/web`       | StrategyApp: Multi-Scenario Wealth & Financial Planning Engine                                 |
| `product-studylm`           | `apps/products/studylm/web`        | StudyLM: AI study roadmaps, flashcards and quizzes, generated through an n8n workflow          |
| `product-whatsapp`          | `apps/products/whatsapp/web`       | ChatPulse: in-browser WhatsApp export analytics (`.zip`/`.txt`) with n8n AI insights           |
| `product-*-domain`          | `libs/products/*/domain`           | Framework-free models, parsers and calculations for each product                               |
| `product-*-feature`         | `libs/products/*/feature`          | Each product's routes, pages and SignalStore                                                   |
| `lab-sky`                   | `apps/labs/sky`                    | Sky lab remote: the night sky over any place and time, from a 3D globe down to a campsite      |
| `lab-rxjs`                  | `apps/labs/rxjs`                   | RxJS Practice Pad: Interactive stream visualizer & marble testing lab                          |
| `lab-ngrx`                  | `apps/labs/ngrx`                   | NgRx State Architecture Lab: Reactive SignalStore and state transitions                        |
| `lab-rxjs-feature`          | `libs/labs/rxjs/feature`           | The RxJS lab's exercises: multicasting, signals, RxJS vs signals                               |
| `lab-ngrx-feature`          | `libs/labs/ngrx/feature`           | The NgRx lab's exercises: store flow, SignalStore, effects, time-travel panel                  |
| `portfolio-feature-apps`    | `libs/portfolio/feature-apps`      | Dedicated Apps & Labs showcase hub and engineering documentation (`/apps`)                     |
| `platform-federation`       | `libs/platform/federation`         | Remote contract, `federatedRoutes()`, `FederationStore`, `RemoteUnavailable` fallback          |
| `platform-app-mode`         | `libs/platform/app-mode`           | `provideAppMode()`: `embedded-demo` (inside the portfolio, seeded data) or `standalone`        |
| `platform-inspector`        | `libs/platform/inspector`          | "Open the hood" (`?inspect=1`): remotes, builds, shared-dependency skew, state, Web Vitals     |
| `design-system-tokens`      | `libs/design-system/tokens`        | DTCG tokens → CSS variables and TS, with a WCAG contrast gate (`nx build-tokens`)              |
| `design-system-ui`          | `libs/design-system/ui`            | `@ah/ui`: global styles (cascade layers) and components                                        |
| `design-system`             | `apps/design-system/storybook`     | Public Storybook: every `@ah/ui` component, the tokens and the scene host                      |
| `design-system-e2e`         | `apps/design-system/storybook-e2e` | axe on every story in both themes; screenshot comparison in the Linux Playwright image         |
| `shared-content`            | `libs/shared/content`              | Profile, experience, case studies, services and per-audience copy                              |
| `shared-state`              | `libs/shared/state`                | `PreferencesStore` (NgRx SignalStore): the `?for=` audience mode                               |
| `portfolio-util-seo`        | `libs/portfolio/util-seo`          | Title, description, canonical, Open Graph and JSON-LD                                          |
| `portfolio-feature-*`       | `libs/portfolio/feature-*`         | Pages: home, work, experience, services/contact, CV                                            |
| `shared-contracts`          | `libs/shared/contracts`            | Types shared by the browser and the API (`LeadRequest`, field limits)                          |
| `api`                       | `apps/api`                         | NestJS API for Render: config validation, health, CORS, rate limits                            |
| `api-leads`                 | `libs/api/leads`                   | Lead intake: Turnstile, idempotency, Mongo outbox, Telegram and n8n delivery                   |
| `api-dispatch`              | `libs/api/dispatch`                | PulseOps backend module: auth, roles, orders, drivers, plants, stock and comms                 |
| `orbit-api`                 | `apps/orbit-api`                   | Spring Boot 4 + Orekit on Render: the Sky lab's night planner (twilight, the Moon, dark hours) |
| `shared-api-client`         | `libs/shared/api-client`           | TypeScript types generated from the Orbit API's OpenAPI contract                               |
| `three-engine`              | `libs/three/engine`                | Framework-free Three.js stage: on-demand frames, pause off-screen, quality tiers, dispose      |
| `three-angular`             | `libs/three/angular`               | `<ah-scene>`: loads a scene after idle over a static fallback                                  |
| `three-constellation`       | `libs/three/constellation`         | The exported Nx graph, camera and SVG projection for the hero                                  |
| `three-scene-constellation` | `libs/three/scenes/constellation`  | The hero's WebGL scene (lazy)                                                                  |
| `three-scene-sky`           | `libs/three/scenes/sky`            | The Sky lab's scene: dot-matrix Earth, the dive, stars, Moon, planets, Milky Way, meteors      |
| `lab-sky-domain`            | `libs/labs/sky/domain`             | Sky positions, night summaries, meteor showers and the star catalogue (Astronomy Engine)       |
| `lab-sky-feature`           | `libs/labs/sky/feature`            | The Sky lab page and its SignalStore                                                           |
| `shared-site-config`        | `libs/shared/site-config`          | Per-environment backend URLs from `site-config.json`                                           |

## Commands

Requires Node 24 and pnpm 10, and Java 17 or later for the Orbit API.

```bash
pnpm install
```

Run the shell with its remotes in development (one terminal each). Serve only the remotes you need; any other remote shows the `RemoteUnavailable` fallback:

```bash
pnpm nx serve lab-sky
```

```bash
pnpm nx serve shell
```

Remote dev ports (from `tools/federation/remotes.json`):

| Remote             | Port | Shell route      |
| ------------------ | ---- | ---------------- |
| `lab-sky`          | 4302 | `/labs/sky`      |
| `product-strategy` | 4303 | `/apps/strategy` |
| `lab-rxjs`         | 4304 | `/labs/rxjs`     |
| `lab-ngrx`         | 4305 | `/labs/ngrx`     |
| `product-dispatch` | 4306 | `/apps/dispatch` |
| `product-studylm`  | 4307 | `/apps/studylm`  |
| `product-whatsapp` | 4308 | `/apps/whatsapp` |

Build, lint, test, and enforce the zoneless rule:

```bash
pnpm nx run-many -t build lint test
```

```bash
pnpm check:zoneless
```

Serve production builds the way the static host will (prerendered routes, `index.csr.html` fallback, CORS):

```bash
pnpm nx run-many -t serve-static -p shell lab-sky lab-rxjs lab-ngrx product-strategy product-dispatch product-studylm product-whatsapp
```

Run the Orbit API, the night planner, locally (port 8081; Java 17+ runs Gradle, which downloads Java 25; no database needed):

```bash
pnpm nx serve orbit-api
```

Run the lead API locally (setup in [docs/lead-pipeline.md](docs/lead-pipeline.md#local-development)):

```bash
pnpm nx serve api
```

End-to-end tests (first run: `pnpm exec playwright install chromium`):

```bash
pnpm nx e2e shell-e2e
```

The design system's Storybook (port 6006), and its accessibility checks:

```bash
pnpm nx storybook design-system
```

```bash
pnpm nx e2e design-system-e2e
```

After an intended visual change, remake the screenshot baselines in the Linux Playwright image (needs Docker; ADR-0015):

```bash
pnpm nx run design-system-e2e:update-baselines
```

## Deploy

CI deploys the apps that changed after every green push to `main` (ADR-0007). To deploy by hand after `pnpm exec wrangler login`, deploy remotes first, because the shell's manifest points at them:

```bash
pnpm nx run-many -t deploy -p lab-sky lab-rxjs lab-ngrx product-strategy product-dispatch product-studylm product-whatsapp
```

```bash
pnpm nx deploy shell
```

Run a build on the local Cloudflare runtime, with the same routing and headers as production:

```bash
pnpm nx serve-cloudflare shell
```

A new remote needs its production origin in `tools/federation/remotes.json`.

## n8n workflows

StudyLM and ChatPulse call a self-hosted n8n webhook for their AI features. Regenerate the StudyLM workflow (writes `tools/scripts/studylm_workflow.json`):

```bash
node tools/scripts/update-studylm-workflow.mjs
```

Import the ChatPulse workflow (`tools/n8n/workflows/whatsapp-analyzer.json`) into a local Docker container named `n8n` and restart it so the webhook route goes live:

```bash
node tools/scripts/install-whatsapp-n8n-workflow.mjs
```
