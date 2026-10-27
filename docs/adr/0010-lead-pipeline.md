# ADR-0010: Lead pipeline: document outbox, direct Telegram alert, n8n push and pull

- **Status:** Accepted (deployed and verified end to end on 2026-10-27; setup in [lead-pipeline.md](../lead-pipeline.md))
- **Date:** 2026-10-26
- **Milestone:** M1

## Context

The contact form is the site's conversion point, so a lead must never be lost. Every part of the stack sleeps or goes offline: Render's free instance sleeps after 15 idle minutes, and n8n runs on a PC that is often off. The static site must still never wait on a backend (ADR-0003), and the whole path must cost nothing.

## Decision

- **Contract:** `@ah/shared/contracts` (`type:contracts`, `runtime:agnostic`) holds `LeadRequest`, `LeadResponse` and the field limits. It is the only code the browser and the API share; ESLint boundaries allow `scope:api` to depend on `scope:api` and `scope:shared` only.
- **API** (`apps/api`, NestJS 11, Docker on Render free, Frankfurt):
  - `POST /leads` validates with `class-validator` (whitelist, no unknown fields), is throttled to 5 requests per 10 minutes per IP, and answers `202`.
  - **Idempotency key first:** a retry with a known key returns the stored lead before Turnstile is checked again.
  - **Turnstile:** `failed` → `403`. If Cloudflare is unreachable, the lead is kept and flagged `humanCheck: unavailable`.
  - **Honeypot:** a filled `website` field gets a fake `202` and nothing is stored.
  - Config is validated at boot and lists every problem; Telegram and n8n are optional pairs.
  - Helmet, a CORS allowlist, `GET /health` with a Mongo ping for pre-warming.
- **Outbox in the document:** each lead carries `delivery.telegram` and `delivery.n8n` (`pending | sent | failed | disabled`, attempts, `nextAttemptAt`, `leaseUntil`). One insert stores the lead and its outbox atomically; a unique index on the idempotency key makes retries safe.
  - The API delivers right after the insert, then a 60-second sweep claims due deliveries with `findOneAndUpdate` and a 60-second lease. Retries back off from 1 minute to 24 hours: the first attempt and eight retries.
- **Telegram:** the API calls the Bot API directly, so the alert never depends on n8n.
- **n8n push:** the API posts the lead to the n8n webhook with `x-lead-timestamp` and `x-lead-signature: sha256=HMAC(secret, "${timestamp}.${body}")`. The workflow rejects a bad signature or a timestamp older than 5 minutes with `401`, answers `202`, then sends a fixed-text auto-reply through Gmail (Render blocks SMTP).
- **n8n pull (backstop):** every 30 minutes the same workflow reads Atlas for n8n deliveries that are pending, more than 2 minutes overdue and not leased (the API's claim rule), marks them `sent`, then runs them through the same auto-reply steps.
- **Once per lead:** both paths pass through a Remove Duplicates node keyed on the lead id across executions, so a lead pushed and pulled at the same time gets one auto-reply. Auto-replies are at most once: the lead is marked before the email is sent.
- **Contact form:** Signal Forms with `formRoot`. It reads `site-config.json` at runtime (written per environment by `prepare-hosting.mjs --site-config`, which also adds the API and Turnstile origins to the CSP), wakes the API as soon as it renders, retries for about 90 seconds while saying the server is waking, and keeps one idempotency key per message. When the API isn't configured, Turnstile can't load or the API refuses the lead, it offers the same message as a prefilled email. The fallback reuses the form (the button becomes "Continue in your email app") so the prerendered page doesn't shift.

## What M1 found

1. **Turnstile tokens are single-use.** A client retry after a timeout reused a spent token and would have been rejected with `403`. Looking the idempotency key up before verifying fixed it, and the client can retry freely.
2. **Validation silently did nothing under Vitest:** an invalid email got `202`. SWC compiled the specs with `tsconfig.json`, which lacks `emitDecoratorMetadata`, so `ValidationPipe` saw no types. The SWC plugin now reads `tsconfig.spec.json`, which enables decorator metadata.
3. **Prerendered forms lose early typing.** Playwright filled the fields before hydration and Angular reset them to the empty model. The fields are now disabled in the prerendered HTML and enabled once the form is live.
4. **The service worker hides requests from Playwright.** Once the page was controlled by `ngsw`, the cross-origin POST and its CORS preflight went through the worker, so `page.route` never saw them (`ERR_NAME_NOT_RESOLVED`, then the worker's `504`). The contact e2e tests block service workers.
5. **n8n's MongoDB node cannot claim conditionally.** Its `findOneAndUpdate` filters on the update key only, so the backstop can't reproduce the API's atomic lease. It uses an aggregation with the same rule, and the deduplication by lead id handles the rare overlap.
6. **n8n's `find` hands `_id` to later nodes as a BSON object,** and a Set node turned it into a dump of its byte buffer, which the update node then rejected (`BSONError`). The aggregation projects `id: { $toString: "$_id" }` instead.
7. **Branch order matters in n8n.** With execution order v1 the auto-reply branch ran first, and a Gmail failure stopped the run before the Atlas update. The update now comes first, in a chain.
8. **`saveDataSuccessExecution: "none"` broke rejected webhooks in n8n 2.44.7:** each `401` left an execution stuck in "running". The workflow keeps n8n's default saving; n8n prunes old executions by default.
9. **The HMAC secret lives in an n8n Crypto credential,** not in the workflow or in environment variables, so exported workflow JSON is safe to commit.
10. **Verified in a local n8n 2.44.7 with MongoDB 8.0** (the user's n8n is 2.43.7):
    - A signed lead got `202`, a wrong secret `401`, and a correctly signed request with a 10-minute-old timestamp `401`.
    - The backstop marked an overdue lead `sent` with a real date and left a leased lead and a not-yet-due lead pending.
    - Both paths reached the auto-reply node with the right address; with a fake Gmail credential it failed as expected.
11. **The API image** is 437 MB on `node:24-slim`, runs as `node`, listens on `PORT`, and exits at once with the list of missing settings.
12. **A hidden-prompt bug leaked a secret.** The setup scripts first hid input by filtering readline's output, but readline redraws the prompt and the line in one write when a long paste wraps, so part of a pasted token reached the terminal. Hidden prompts now put the terminal in raw mode (`tools/scripts/prompt.mjs`) and echo nothing.
13. **`docker cp` into the n8n container creates root-owned files** that n8n's `node` user can't delete from `/tmp`, so a credentials file would have stayed behind. `tools/n8n/install.mjs` streams the JSON in through `docker exec -i` instead.
14. **Verified in production on 2026-10-27:**
    - The API on Render answered `/health` with Atlas up. It allowed CORS from the portfolio only, refused an invalid lead with `400` and a fake Turnstile token with `403`, and sent the Helmet headers.
    - The live contact page loaded `site-config.json`, rendered the Turnstile widget and reported no CSP errors.
    - A message sent from the live page produced the Telegram alert and the Gmail auto-reply sent by n8n.

## Consequences

- Telegram alerts arrive within seconds whenever the API is reachable. The auto-reply can wait up to 30 minutes after the PC comes back.
- The visitor's address gets one fixed-text email, which never echoes what they typed. Turnstile, the rate limit and the `humanCheck: passed` filter keep the form from being used to send mail to third parties.
- `N8N_WEBHOOK_URL` is the only link between Render and n8n; moving n8n to an always-on host changes that one secret.
- Atlas network access is `0.0.0.0/0`, because neither Render free nor the PC has a fixed IP. The database user's password is the protection.
- If the outbox gives up after nine attempts (`failed`), the lead stays in Atlas and still appears in Telegram unless Telegram itself failed. Re-queuing failed deliveries is manual for now.
- Not built yet (architecture §7.3): the AI summary and fit score, the CRM row, the rich Telegram card, the weekly digest, and auto-replies in the visitor's language.
