# ADR-0033: BARQ, a laser tag player app and venue system

- **Status:** Accepted
- **Date:** 2026-11-27
- **Milestone:** M2

## Context

The owner is starting a DIY laser tag business: ESP32 blasters and vests, a player app, and one indoor venue (a warehouse to be rented). They asked for a player app that keeps players coming back the way mobile games do, with:

- stats per player (shots, tags, infections, time played, movement heat maps, maps, teams);
- leaderboards, badges and a QR badge per player, so the right person's data is saved when they take gear;
- guests who play without an account;
- teams, clans, transfers and meetings;
- weapons with their own range and precision;
- bookings and scheduled fights;
- themes (Halloween, New Year, summer…) and coupons;
- room to scale nationally and abroad.

The gear doesn't exist yet. The full plan is [docs/laser-tag/poc-plan.md](../laser-tag/poc-plan.md); the business case is private and not in this repo.

## Decision

- **A product in this monorepo.**
  - Name and scope: `product-lasertag`, `scope:product-lasertag`, under the brand **BARQ** (برق, "lightning"). The slug stays `lasertag`, so a rename only touches copy.
  - Libs under `libs/products/lasertag/*`.
  - A standalone PWA (port 4315), not yet in the portfolio's remote registry.
- **A Worker for the shared data, `lasertag-edge`, on D1.** It follows ADR-0032's shape:
  - Rules and the wire format in an agnostic domain lib.
  - A service of plain functions over a repository port (`product-lasertag-server`).
  - A D1 store tested on Node's own SQLite.
  - CORS by exact origin, capped bodies, rate limits per IP, logs without personal data.
- **The match log is the source of truth.** The gear (and, until it exists, a match simulator) writes events; stats, badges, ratings and leaderboards are computed from them and can be recomputed.
- **Many venues from day one:** venue, country, currency and timezone on every row that belongs to a place; one global player profile.
- **Identity:**
  - Passkeys only (WebAuthn with `@simplewebauthn/*`, MIT); sessions are HMAC-signed tokens over Web Crypto.
  - The player's badge is a QR that changes every 30 seconds (an HMAC over the player's QR key and the time step), so a screenshot can't be replayed.
  - Guests get a nickname and a claim code; unclaimed guests are deleted after 30 days.
  - Gear carries only its own id; the venue maps gear to players per session.
- **Minors:**
  - Under 13 needs a guardian (the owner's choice), as a per-country setting.
  - Every player under 18 gets private defaults.
- **Engagement without paid randomness.** Seasons, ranks, badges, challenges, clans and share cards. Never paid loot boxes, pay-to-win, paid virtual currency or dark patterns.
- **Languages:** Arabic, French and English, typed copy as in ADR-0018. The site's Italian and German fall back to English.

## Consequences

- **A launch blocker, for a lawyer.** Tunisia's law 2004-63, article 28, lets a child's data be processed only with the guardian's consent **and** the family judge's authorisation, and a child is under 18. The under-13 setting doesn't meet that on its own. No real player signs up before a lawyer has confirmed what the venue must do; the age setting and consent records follow that advice.
- **Another legal check comes before any gear is built:** Tunisia bans importing and selling toys that imitate firearms, and customs have seized laser toy pistols. The gear's shape and sourcing wait for a written position from the Ministry of Commerce and Customs.
- **Free tiers:** D1 allows 100,000 rows written a day on the free plan (queries fail past it since September 2026). Raw match logs and positions therefore go to R2 files, and D1 keeps summaries. A live venue moves to Workers Paid before launch.
- **New dependencies:** `@simplewebauthn/server` and `@simplewebauthn/browser` (MIT).
- **The owner's one-time steps before deploying:**
  - Create the D1 database.
  - Set `LASERTAG_TOKEN_SECRET`.
  - Set the relying party (the app's domain).
    These are listed in the hand-off. Until then the Worker answers 503, and the app says the service isn't available.
