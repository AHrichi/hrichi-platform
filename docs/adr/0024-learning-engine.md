# ADR-0024: Learning Engine: one spaced-repetition engine that every app captures into

- **Status:** Accepted
- **Date:** 2026-11-11
- **Milestone:** L0 of the [Learning Engine design](../learning-engine/technical-design.md)

## Context

The platform's apps teach things (StudyLM's lessons and cards, future language apps), but none of them schedules reviews. StudyLM's design planned FSRS, streaks and XP for StudyLM alone, and its cards only count `masteryCount` from 0 to 5.

The Learning Engine applies retrieval, spacing, interleaving and the Feynman technique to anything you capture, typed or spoken, from any app. Its product design asks for:

- capture in 5 seconds;
- a capped Daily Set of about 3 minutes;
- streaks that forgive missed days.

It is a personal tool with one owner, English only. Three constraints shape it:

- **n8n is not always reachable.** It runs on the PC, which is often off when captures happen on the go.
- **Render's free hours are shared.** Its 750 hours a month also serve the Orbit API, so nothing may keep it awake.
- **Products never import each other** (architecture §4.3).

## Decision

- **A module of its own, under `scope:learning`.** Its libs are:
  - `domain`, `contracts` and `ai-kit`, all `runtime:agnostic`, so Nest and the browser run the same scheduler and checks;
  - `data-access`, `ui` and the `feature-*` libs;
  - one remote, `product-learning`, which also runs as a standalone PWA.
- **Products reach it only through a client lib.** The lib is tagged `scope:learning-client` and `type:client`, and every `scope:product-*` may depend on that scope and no other part of the engine.
  - `type:client` may use contracts, utilities, platform services, presentational components and tokens. App and feature layers may use it.
  - `scope:api` may use `scope:learning`; the runtime rules still keep browser libs out of Nest.
- **Local-first, synced through Nest.**
  - Dexie on each device, named through `databaseName`, so the portfolio demo never opens real data.
  - `POST /learning/sync` pushes the outbox and pulls changes.
  - Review events and the ledger are append-only and idempotent. FSRS memory, streaks and XP are derived from them, never stored as truth.
- **The AI pipeline runs in Nest**, which wakes on demand, not in n8n.
  - Each task has its own small schema in the strict subset.
  - Semantic checks follow the schema checks, with at most one repair.
  - An exhausted model ladder marks the capture failed with a retry, never canned content (as ADR-0021/0023).
- **Nudges come from a Cloudflare Worker** with a Cron Trigger and KV, sent through the Telegram bot. Render is never woken on a timer.
- **The engine replaces StudyLM's planned FSRS and streak phases.** StudyLM becomes the first host when the client lib lands (L4).
- **The strict-schema compiler moves to `@ah/shared/ai-schema`** (`scope:shared`, `type:util`, `runtime:agnostic`), so StudyLM's lessons kit and the engine's AI kit share one implementation and one strictness check.

**Proposed, not decided here:** Jev, TypeSafe's decision model, for the judging tasks (grading, triage, the quality gate, links), behind a `DecisionModel` port with the generative ladder as fallback. A spike in L2 settles it per task, against a hand-labelled set (design §6.4).

## Consequences

- **This phase (L0)** adds the lint rules for scopes that have no libs yet. A product importing any engine lib other than the client fails `nx lint` from the day that lib exists.
- **`product-studylm-lessons`** now imports `strictJsonSchema` and `strictnessProblems` from `@ah/shared/ai-schema`. Its generated files and its workflow kit are unchanged, and the snapshots prove it. The generic tests moved with the code; the lessons spec still checks every schema the lib exports.
- **Platform changes come later:**
  - voice capture needs `microphone=(self)` on the learning app's origin in `prepare-hosting.mjs` (L2);
  - `connect-src` needs the API and Worker origins (L1).
- **One owner, paired devices.** The API sends a 6-digit code to the owner's Telegram chat, the owner types it into the device, and the device gets an HMAC-signed token that both Nest and the Worker can check (design §11).
- **Turning it on (L1):** set `LEARNING_TOKEN_SECRET` (at least 32 characters) on Render and add the learning app's origin to `CORS_ORIGINS`. Without the secret the `/learning` routes don't exist. `product-learning` has a `deploy` target, so the CI deploy job publishes it once this lands on `main`; it stays out of `tools/federation/remotes.json` until the portfolio embeds it (L4).
- **Names:** the remote is `product-learning`, the Worker `learning-edge`, the Dexie database `LearningDatabase` and the libs `@ah/learning/*`.
