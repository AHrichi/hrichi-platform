# AI handoff: BARQ, the laser tag player app (hrichi-platform)

A briefing for whichever AI agent picks up BARQ. It assumes no memory of earlier sessions. [AGENTS.md](../../AGENTS.md) has the protocol, [ADR-0033](../adr/0033-barq-laser-tag.md) the decisions, [poc-plan.md](poc-plan.md) the plan.

Last updated 2026-11-27: **P1 (players, QR and check-in) in progress on `feat/lasertag-p1-players`.**

## 0. Resume in five minutes

1. **Branch:** `feat/lasertag-p1-players`, worked in `.claude/worktrees/lasertag-p1`. Check `git worktree list` first: one agent per checkout.
2. **Install:** `pnpm install --frozen-lockfile`.
3. **Check it's green:** `pnpm nx run-many -t lint test build -p "product-lasertag*" lasertag-edge --output-style=static`.

**Private material:** the business case lives in `docs/laser-tag/private/` (git-ignored) on the owner's machine, and in the local-only branch `plan/laser-tag-poc`. Never commit or push it.

## 1. What this is

A player app and venue system for a laser tag business in Tunisia: QR badges, guests, stats and heat maps, ranks and badges, clans and transfers, meetings, bookings and fights, themes, coupons. A match simulator stands in for the ESP32 gear until it exists.

## 2. Status

| Slice                                | State           |
| ------------------------------------ | --------------- |
| Plan, ADR-0033                       | **Done**        |
| P1 Players, QR and check-in          | **In progress** |
| P2 Matches and stats                 | Not started     |
| P3 Progress and leaderboards         | Not started     |
| P4 Friends, clans and transfers      | Not started     |
| P5 Bookings, fights, themes, coupons | Not started     |
| P6 Venue screens and demo            | Not started     |

**Launch blockers (before any real player signs up):**

- A lawyer confirms the minors' rule: law 2004-63, article 28, asks for the guardian's consent and the family judge's authorisation for anyone under 18.
- A written position from Commerce and Customs on the gear: the toy-weapon ban.

## 6. Next step

Finish P1 (poc-plan §6), then stop for the owner's review.
