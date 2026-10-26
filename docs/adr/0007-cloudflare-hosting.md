# ADR-0007: Cloudflare Workers static assets, one Worker per app

- **Status:** Accepted (deployed and verified 2026-10-26)
- **Date:** 2026-10-26
- **Milestone:** M0

## Context

The site must cost nothing to host, have no cold starts, and let each micro-frontend deploy on its own. Cloudflare serves static-asset requests to Workers free and without a request limit, and supports `_headers` and `_redirects` files. Vercel's free Hobby plan was ruled out because it is limited to non-commercial use, and the site advertises freelance work.

## Decision

- **One assets-only Worker per deployable app**, each with its own `wrangler.jsonc` next to the app:

  | App         | Worker      | URL                                        |
  | ----------- | ----------- | ------------------------------------------ |
  | `shell`     | `portfolio` | https://portfolio.ahmed-hrichi.workers.dev |
  | `lab-hello` | `lab-hello` | https://lab-hello.ahmed-hrichi.workers.dev |

- **Routing** implements the host contract from ADR-0003:
  - `html_handling: "drop-trailing-slash"`: `/about` serves `about/index.html` with no redirect.
  - Shell: `not_found_handling: "404-page"`, with `404.html` a copy of `index.csr.html`; `public/_redirects` contains `/labs/* /index.csr 200`.
  - Remotes: `not_found_handling: "single-page-application"`.
- **Per-environment output:** `tools/scripts/prepare-hosting.mjs` runs after the build. It writes the shell's `federation.manifest.json` from `tools/federation/remotes.json`, `404.html`, and `_headers` (CSP from ADR-0006, security headers, `immutable` for hashed chunks, CORS for remotes).
- **Targets:**
  - `nx deploy <app>`: build → prepare → `wrangler deploy`.
  - `nx serve-cloudflare <app>`: the same output on the local Cloudflare runtime (`wrangler dev`).
- **CI** (`.github/workflows/ci.yml`): after the lint/test/build/e2e job passes on `main`, `nx affected -t deploy` redeploys only the apps that changed. It uses the `CLOUDFLARE_API_TOKEN` secret and the `CLOUDFLARE_ACCOUNT_ID` repository variable.

## What M0 found

1. With `html_handling` on, Cloudflare answers any `*.html` URL with a `307` to the extension-less path, **including the target of a `_redirects` rewrite**. `/labs/* /index.csr.html 200` therefore returned a 307. The rewrite targets `/index.csr` instead.
2. The service worker requests `/index.csr.html`, which also gets that 307. Angular's service worker re-fetches the final URL of a redirected asset and caches it under the original key (`fetchFromNetwork` in `ngsw-worker.js`), so no change was needed.
3. `wrangler dev` reproduced production routing, headers and 404s locally before the first deploy. Its `.wrangler/` state folder must stay out of git.
4. For about a minute after the first deploy, the new `ah-source.workers.dev` subdomain failed TLS handshakes (`SEC_E_ILLEGAL_MESSAGE`) while its certificate was issued; then it served normally.
5. `wrangler login` fails with `request_forbidden` ("CSRF value … does not match") if Allow is clicked on a consent page left over from an earlier attempt. Close old consent tabs before retrying.
6. **Verified live:**
   - `/` is prerendered (`200`); `/labs/*` returns the CSR shell (`200`); unknown paths return `404`.
   - The CSP header lists the live remote origin; chunks are `immutable`; the remote sends `Access-Control-Allow-Origin: *`.
   - In the browser, the remote loaded cross-origin through federation with three requests, the zoneless counter updated, and there were no CSP violations or console errors.

## Consequences

- Changing a remote's URL means editing `tools/federation/remotes.json` and redeploying the shell.
- The workers.dev subdomain (`ahmed-hrichi`) is account-wide. Renaming it changes every URL above, so the registry must be updated and the shell redeployed (or use Actions → CI → Run workflow). In the dashboard it is the pencil icon next to **Subdomain** under **Account details** on the Workers & Pages page. Existing Workers moved to the new subdomain at once.
- Worker names are the first DNS label, so a remote's Worker name is its project name (`lab-hello`). Renaming a Worker in `wrangler.jsonc` deploys a **new** Worker; the old one keeps serving until it is deleted with `wrangler delete <name>`. On 2026-10-26 `ahmed-hrichi` and `ahmed-hrichi-lab-hello` were replaced by `portfolio` and `lab-hello` this way. A custom domain (e.g. `ahmed.is-a.dev`) can replace it later without code changes.
- Cloudflare limits `_headers` to 100 rules and 2,000 characters per line. `prepare-hosting.mjs` checks the line length; with many remotes, the CSP may need to move to a smaller policy per route.
- Until the `CLOUDFLARE_API_TOKEN` secret exists, the CI deploy job fails while the CI job itself still passes.
