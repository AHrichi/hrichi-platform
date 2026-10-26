# hrichi-platform

Ahmed Hrichi's portfolio, built as the kind of platform it describes: an Nx monorepo of zoneless Angular 22 micro-frontends on Native Federation, prerendered for a static host and installable as a PWA.

- Architecture: [docs/architecture.md](docs/architecture.md)
- Decisions and spike results: [docs/adr](docs/adr/README.md)
- Live: [ahmed-hrichi.ah-source.workers.dev](https://ahmed-hrichi.ah-source.workers.dev) (shell) and [ahmed-hrichi-lab-hello.ah-source.workers.dev](https://ahmed-hrichi-lab-hello.ah-source.workers.dev) (remote)

## Projects

| Project               | Path                       | What it is                                                                                 |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `shell`               | `apps/portfolio/shell`     | Host. Prerendered content pages, PWA, loads remotes from `public/federation.manifest.json` |
| `shell-e2e`           | `apps/portfolio/shell-e2e` | Playwright tests for prerendering, federation and remote fallback                          |
| `lab-hello`           | `apps/labs/hello`          | M0 spike remote; exposes `./routes` and `./meta`                                           |
| `platform-federation` | `libs/platform/federation` | Remote contract, `federatedRoutes()`, `RemoteUnavailable` fallback                         |

## Commands

Requires Node 24 and pnpm 10.

```bash
pnpm install
```

Run the shell with its remote in development (two terminals):

```bash
pnpm nx serve lab-hello
```

```bash
pnpm nx serve shell
```

Build, lint, test, and enforce the zoneless rule:

```bash
pnpm nx run-many -t build lint test
```

```bash
pnpm check:zoneless
```

Serve production builds the way the static host will (prerendered routes, `index.csr.html` fallback, CORS):

```bash
pnpm nx run-many -t serve-static -p shell lab-hello
```

End-to-end tests (first run: `pnpm exec playwright install chromium`):

```bash
pnpm nx e2e shell-e2e
```

## Deploy

CI deploys the apps that changed after every green push to `main` (ADR-0007). To deploy by hand after `pnpm exec wrangler login`, deploy remotes first, because the shell's manifest points at them:

```bash
pnpm nx deploy lab-hello
```

```bash
pnpm nx deploy shell
```

Run a build on the local Cloudflare runtime, with the same routing and headers as production:

```bash
pnpm nx serve-cloudflare shell
```

A new remote needs its production origin in `tools/federation/remotes.json`.
