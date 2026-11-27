# AI handoff: BARQ, the laser tag player app (hrichi-platform)

A briefing for whichever AI agent picks up BARQ. It assumes no memory of earlier sessions. [AGENTS.md](../../AGENTS.md) has the protocol, [ADR-0033](../adr/0033-barq-laser-tag.md) the decisions, [poc-plan.md](poc-plan.md) the plan.

Last updated 2026-11-27: **P1 (players, QR badges and check-in) is built and tested on `feat/lasertag-p1-players`, waiting for the owner's review.** Nothing is deployed.

## 0. Resume in five minutes

1. **Branch:** `feat/lasertag-p1-players`, worked in `.claude/worktrees/lasertag-p1`. Check `git worktree list` first: one agent per checkout.
2. **Install:** `pnpm install --frozen-lockfile`.
3. **Check it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p "product-lasertag*" lasertag-edge shared-site-config --output-style=static
   pnpm exec stylelint "libs/products/lasertag/**/*.scss" "apps/products/lasertag/**/*.scss"
   CI=1 pnpm exec playwright test -c apps/products/lasertag/web-e2e/playwright.config.mts --reporter=line --trace off
   ```

   The e2e starts its own Worker (fresh local D1, test-only secrets) on :8790 and the production build on :4315. Free both ports first. On Windows, stopping `wrangler dev` can leave `workerd.exe` holding :8790: stop it by its process id.

4. **See it:**
   1. Copy `apps/lasertag-edge/.dev.vars.example` to `.dev.vars`.
   2. Run `pnpm nx serve lasertag-edge` (migrations, then wrangler dev on :8790).
   3. Run `pnpm nx run product-lasertag:serve-static`, then open `http://localhost:4315`.

   Passkeys need a real authenticator. The desktop browser pane has none, so sign up in Chrome or on a phone. The first manager claims the venue at `/staff` with the code in `.dev.vars`.

**Private material:** the business case lives in `docs/laser-tag/private/` (git-ignored) on the owner's machine, and in the local-only branch `plan/laser-tag-poc`. Never commit or push it.

## 1. What this is

A player app and venue system for a laser tag business in Tunisia, brand **BARQ** (برق). The plan covers QR badges, guests, stats and heat maps, ranks and badges, clans and transfers, meetings, bookings and fights, themes and coupons. A match simulator stands in for the ESP32 gear until it exists.

## 2. Status

| Slice                                | State                                 |
| ------------------------------------ | ------------------------------------- |
| Plan, ADR-0033                       | **Done**                              |
| P1 Players, QR and check-in          | **Built, tested, waiting for review** |
| P2 Matches and stats                 | Not started                           |
| P3 Progress and leaderboards         | Not started                           |
| P4 Friends, clans and transfers      | Not started                           |
| P5 Bookings, fights, themes, coupons | Not started                           |
| P6 Venue screens and demo            | Not started                           |

**P1 pieces:**

| Project                        | What it holds                                                                                                                                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product-lasertag-domain`      | Rotating QR badge (HMAC per 30-second step) and its six-digit code; signed sessions; Crockford codes; handles (Latin or Arabic, folded); the age rule per country; venue, map (optional size), gear; check-in rules; the wire contract |
| `product-lasertag-server`      | The service as plain functions over a repository port; passkeys via `@simplewebauthn/server`; memory store; the repository contract (`/testing`)                                                                                       |
| `lasertag-edge`                | The Worker: D1 migrations (first venue: 12 vests, 12 blasters), D1 store, CORS, caps, rate limits, masked logs, daily sweep; `deploy.mjs` skips until the database exists                                                              |
| `product-lasertag-data-access` | API client, passkey wrapper (`@simplewebauthn/browser`), session storage                                                                                                                                                               |
| `product-lasertag-feature`     | Shell, welcome, sign-up (Signal Forms), badge, claim, recovery, staff counter; copy in Arabic, French and English                                                                                                                      |
| `product-lasertag`             | The standalone PWA on :4315 with its icon set. **No `deploy` target yet**: the owner decides when BARQ goes public                                                                                                                     |
| `product-lasertag-e2e`         | Playwright with a virtual passkey authenticator                                                                                                                                                                                        |

**Verified (2026-11-27):**

- Unit and component tests:
  - domain 27, server 30 (including the repository contract), edge 19 (the contract on Node's SQLite, the migration seed equal to the server's, HTTP), data-access 4;
  - feature 11: copy completeness; sign-up through the real service rules; a cancelled passkey; the badge's QR equal to a token the server accepts; Arabic right to left; the staff counter checking a player in by handle and code.
- Lint, strict stylelint, the production build with template type-checking (47 kB transferred on first load), the Worker bundling (wrangler dry run).
- By hand in the browser pane: welcome, Arabic layout, sign-up validation and the under-13 notice.
- End to end, 5 of 5 in Playwright's Chromium (CI=1, a fresh Worker and database, the production build under its real CSP, no CSP violations):
  - passkey sign-up and sign-in with a virtual authenticator, axe clean;
  - the under-13 block;
  - Arabic right to left, axe clean;
  - the counter: the venue claimed once, a session opened, a player checked in by handle and code, a guest by a blaster's label, a duplicate refused in words, a claim refused while the guest plays and accepted after the session closes;
  - the service worker registering.

**Not verified yet:**

- On real phones: camera scanning with BarcodeDetector, and passkeys on Android and iPhone.
- The service worker inside the desktop browser pane (its registration failed there; the e2e checks it in clean Chromium).
- Anything deployed: nothing is.

**Launch blockers (before any real player signs up):**

- A lawyer confirms the minors' rule. Law 2004-63, article 28, asks for the guardian's consent and the family judge's authorisation for anyone under 18; the app's setting is under 13, per the owner.
- A written position from Commerce and Customs on the gear: the toy-weapon ban.

## 6. Next step

The owner reviews P1. Then:

**Go-live steps (owner, once):**

1. `pnpm wrangler d1 create lasertag-edge --location weur`, then put the id in `apps/lasertag-edge/wrangler.jsonc`.
2. `wrangler secret put LASERTAG_TOKEN_SECRET` (32+ characters) and `LASERTAG_BOOTSTRAP_CODE` (12+ characters).
3. Copy a `deploy` target back into `apps/products/lasertag/web/project.json`.

**Then P2** (matches and stats with the simulator) on `feat/lasertag-p2-matches`.
