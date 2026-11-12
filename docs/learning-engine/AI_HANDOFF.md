# AI handoff: Learning Engine (hrichi-platform)

This is a briefing for an AI assistant that picks up the Learning Engine. Read it first, then `docs/learning-engine/technical-design.md` (the design, with "as built" notes per phase), `docs/adr/0024-learning-engine.md` (decisions and setup) and `docs/architecture.md` (the platform). Last updated 2026-11-12 (StudyLM link).

The StudyLM merge (section 10) is built as **shared data, two apps**, the owner's choice on 2026-11-12; it goes live after a Render redeploy (section 11). Telegram (section 9) is parked: on 2026-11-12 the owner reported it works and asked for no changes for now, so leave the bot, the Worker's webhook and the owner's n8n workflows as they are.

## 1. What this is

A personal spaced-repetition engine that every app captures into.

- **Capture:** type or say an idea (app Inbox, Android share sheet, StudyLM "Learn this", Telegram). The AI writes a short Feynman explanation and recall questions; the owner keeps or discards the draft.
- **Review:** a short Daily Set (5–10 cards, about 3 minutes) scheduled with FSRS, swiped right/up/left. Typed answers and teach-backs are judged by key points.
- **Habit:** forgiving streaks (freezes, a repair window), XP, milestones, a Knowledge Garden, nudges and a Sunday recap on Telegram.
- **The owner:** one person, English only, on a phone and a PC. Studying full time; the study plan lives in the halal engine (`C:\Users\Administrator\Projects\Automation\halal-media-engine\curriculum`).
- **Cost:** $0, except an optional TypeSafe (Jev) key that isn't used yet.

## 2. What is live (2026-11-12)

| Piece                              | Where                                                                                                                       | Notes                                                                                                                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Learning app (`product-learning`)  | `https://product-learning.ahmed-hrichi.workers.dev`                                                                         | Static Angular remote on Cloudflare; deployed by CI on `main`. Public in the portfolio since 2026-11-12 (`/apps/learning`, a catalog card, `learning: true`), as a seeded demo.                                                            |
| API (`apps/api`, Nest)             | Render service `ahmed-hrichi-api`                                                                                           | `/learning/*` routes on since 06:10. `/learning/devices` answers 401 without a token.                                                                                                                                                      |
| Edge Worker (`apps/learning-edge`) | `https://learning-edge.ahmed-hrichi.workers.dev`                                                                            | Cron every 15 min (nudges, Sunday recap), KV namespace `learning-nudges` (`94057825242143d0b5b5417bd80ae7e9`), routes `/state`, `/telegram`, `/inbox`, `/inbox/ack`, `/health`. Deployed by `tools/scripts/learning-setup.mjs`, not by CI. |
| AI relay in n8n                    | Workflow `LearningAiRelay1` "Learning Engine AI relay", webhook `learning-ai`                                               | The API calls Groq and Gemini through it with the keys n8n already holds. Needs the owner's PC on (Docker: `n8n`, `n8n-ngrok`).                                                                                                            |
| Database                           | MongoDB Atlas, DB `portfolio`, collections `learning_records`, `learning_devices`, `learning_pairings`, `learning_counters` | One collection holds every synced kind.                                                                                                                                                                                                    |

**Render environment** (names only; values in `.env.render`, git-ignored): `LEARNING_TOKEN_SECRET`, `LEARNING_N8N_URL`, `LEARNING_N8N_SECRET`, `LEARNING_EDGE_URL`, `CORS_ORIGINS` (includes the learning app), plus the lead API's `MONGODB_*`, `TELEGRAM_*`, `TURNSTILE_SECRET`, `N8N_WEBHOOK_*`. No Groq/Gemini keys on Render: the relay uses n8n's.

**Not done yet:** no device is paired (the owner pairs in the app: ⚙ → Devices and pairing → Send me a code → the code arrives on Telegram from `@Ahmed_portfolio_leads_bot`).

## 3. Architecture

```
phone/PC browser ── learning app (Dexie, local-first, outbox)
      │ POST /learning/sync, /grade, /transcribe, /teach-back (device token)
      ▼
Render: Nest API ──signed──> n8n "learning-ai" relay ──> Groq / Gemini (n8n credentials)
      │  capture pipeline: triage → extract → explain → checks → gate → drafts → link suggestions
      │  every 5 min while awake: pull the Telegram inbox, sweep captures
      ▼
Atlas (learning_records)          Cloudflare Worker learning-edge (always on)
                                   ├─ PUT /state  ← the app (nudge state, week stats)
                                   ├─ cron 15 min → Telegram nudges, Sunday recap
                                   ├─ POST /telegram ← bot webhook (@Ahmed_portfolio_leads_bot)
                                   └─ GET /inbox, POST /inbox/ack ← the API (server token)
```

## 4. Code map

- `libs/learning/domain` (`scope:learning`, pure TS): records and valibot schemas, sync contract, FSRS memory (`ts-fsrs` 5.4.2, pinned), composer (teach-back and contrast picks), streaks/repair, XP v2, milestones, nudges and the weekly recap, AI task schemas and the decision questions (grading, teach-back, links), the Telegram inbox contract (`edge-inbox.ts`).
- `libs/learning/data-access`: Dexie database (version 5: topics, concepts, events, captures, audio, sessions, teachbacks, links, outbox, meta), sync client, API and edge clients.
- `libs/learning/feature`: SignalStore and screens (Today, Inbox, Library, Garden, Settings, Devices).
- `libs/learning/contracts`, `libs/learning/client` (`scope:learning-client`): the only engine libs a product may import (`<ah-learn-this>`, `<ah-learning-today>`, URL-fragment hand-off, and the host link: `LearningLink`, `provideLearningHost`, `HostLinkCore`).
- Host links (StudyLM): `libs/learning/contracts/src/lib/host.ts` (DTOs, origins, fragment codecs), `libs/learning/domain/src/lib/host.ts` (schemas, derived ids, `hostReviewEvents`, `hostProgress`), `libs/api/learning/src/lib/host.{controller,service}.ts`, the learning app's `/connect` screen, StudyLM's `StudyLmReviews` and Progress panel.
- `libs/api/learning`: controller, sync, pairing, capture pipeline, grading/teach-back, Telegram inbox pull, Mongo and in-memory repositories.
- `libs/api/ai`: model ladder, Groq/Gemini models, transcribers, decision models (Jev + ladder), `N8nRelay`.
- `apps/products/learning/web`, `apps/learning-edge`, `apps/api`.
- `tools/scripts/learning-setup.mjs`, `tools/n8n/install-learning-ai.mjs`, `tools/n8n/workflows/learning-ai.json`, `tools/scripts/check-api-dependencies.mjs`.

## 5. Secrets and setup

- `.env.render` (repo root, git-ignored) holds every secret. Scripts read it and never print values; keep it that way. Render takes it through Environment → Edit → Add variable ▾ → Import from .env.
- `node tools/scripts/learning-setup.mjs`: token secret, optional AI keys, KV namespace, Worker deploy with its secrets, the bot webhook (refuses to overwrite another webhook unless `--replace-webhook`).
- `node tools/n8n/install-learning-ai.mjs`: the relay's secret into n8n, the workflow on n8n's Groq/Gemini credentials, publish (restarts n8n for about 30 s), live checks.
- Wrangler is logged in to the owner's Cloudflare account on this PC; `gh` to GitHub.

## 6. Checks and commands

```bash
pnpm nx run-many -t lint test build -p learning-domain learning-data-access learning-feature learning-client learning-contracts product-learning learning-edge api-ai api-learning api product-studylm-feature product-studylm
pnpm exec stylelint "libs/learning/**/*.scss" "libs/products/studylm/feature/src/lib/components/reviews-panel/*.scss"
LEARNING_RELAY_LIVE=1 pnpm nx test api-learning -- relay-live   # real models through n8n
node tools/scripts/prepare-hosting.mjs dist/apps/products/learning/web/browser --env development --cors --site-config --microphone   # then preview "learning (static build)" on :4311
```

`--testFile=…` doesn't work with this Vitest; pass the file filter after `--`.

## 7. Hard rules

- Lint boundaries: products import only `scope:learning-client`. Styles in `libs/learning` and the learning app use design tokens and logical properties only (strict stylelint).
- AI output is validated by valibot schemas compiled to strict JSON Schema (`@ah/shared/ai-schema`); the AI only suggests, the swipe is always the rating.
- Never print, log or commit secrets, the ngrok tunnel's host, or the owner's Telegram chat id.
- `main` is protected: two required checks ("Lint, test, build, e2e", "Storybook (axe, visual regression)"); auto-merge is allowed; admins can still push. Merge commits, not squash.
- **The owner's n8n workflows:** the halal engine's handoff says "never edit their Telegram workflows or other n8n workflows". On 2026-11-12 the owner asked to use their n8n Telegram bot for the engine, which means changing the master agent. Get an explicit OK for the exact change, export a backup of the workflow first, and keep the change additive (a new sub-workflow plus one route).
- A runtime package must be in `dependencies`, not `devDependencies` (the API image installs production dependencies only; CI checks it).

## 8. Gotchas found so far

- **Render auto-deploy hasn't fired since 2026-10-27**, although `render.yaml` says `autoDeployTrigger: checksPass`. Deploys happen through Environment → Save, rebuild, and deploy, or Manual Deploy. The Blueprint (`render.yaml`) also hasn't synced its newer env values; they were set by hand. Worth checking the Blueprint's sync setting.
- A GitHub Actions run on `main` once sat queued for 1 h 40 min with no jobs; the next push started normally.
- Gemini Flash (`gemini-flash-latest`) sometimes hangs through the relay; the ladder and transcription fall back to Flash-Lite.
- Render values are masked in the dashboard editor and loaded only when revealed; saving keeps unrevealed ones.
- While n8n is off, captures wait (not counted as tries) and grading shows no verdict.

## 9. Parked: Telegram capture through the owner's bot

**Status:** the owner reported on 2026-11-12 that Telegram works and asked for no changes for now. Keep these notes for when they want the engine on their n8n bot; don't act on them unasked.

**Diagnosis (2026-11-12, before the owner's report):**

- The engine's bot is `@Ahmed_portfolio_leads_bot` (the lead-alert bot, `TELEGRAM_BOT_TOKEN` in `.env.render`). Its webhook points at the Worker's `/telegram`, with no delivery errors and no pending updates, and the Worker's KV inbox is empty: **nothing was ever sent to that bot**.
- The owner talks to a different bot: n8n credential **"Telegram account"** (`HZD3p71ELV5zPnU8`), received by the active workflow **"Telegram Master Agent & Coordinator"** (`LtrMysbO0PHmmq0r`). A bot has one webhook, and that one goes to n8n, so the Worker can't listen on it.
- The master agent: Telegram Trigger → Detect Input Modality → (voice) "Sub-Workflow: Telegram Voice Transcriber" (Groq Whisper) → memory context → 🧭 Central Router Agent (Groq 20B, Gemini, Ollama) → specialist sub-workflows (🎓 Study & Career, 💼 Job Hunt, 💪 Sport & Health, 💰 Finance, 📅 Schedule & Life Ops) → "Deliver via Safe Telegram Sender".
- Overlap: **"13_Study_Plan_Telegram_Reminders"** (`hmeStudyRemind13`, halal engine) already sends study reminders at 07:30, 13:30 (Mon–Sat), 20:30 and a Sunday 10:00 review, with text from the halal worker's `GET /reminder`. The engine's own nudges (morning, evening) and Sunday 18:00 recap would come on top, from the other bot.

**Recommended design (needs the owner's OK):**

1. **Inbound:** in the master agent, a "learn" route (a `/learn …` prefix or a router intent such as "remember this") calls a new sub-workflow "Send to Learning Engine". Voice is already transcribed by then, so it sends text. The sub-workflow calls a new Worker endpoint, `POST /inbox/push`, HMAC-signed like the relay (secret in an n8n Crypto credential and a Worker secret), which stores an `EdgeInboxItem` with the text. The API keeps pulling the inbox as now. Reply "Saved to your Learning Inbox" through the Safe Telegram Sender.
2. **Outbound:** send nudges, the recap and pairing codes from the owner's bot: set the Worker's `TELEGRAM_BOT_TOKEN` to that bot's token, and give the API a `LEARNING_TELEGRAM_BOT_TOKEN` override for pairing codes (lead alerts stay on the lead bot). Then remove the lead bot's webhook (`deleteWebhook`) and retire or keep `/telegram`.
3. **Reminders:** one set of study reminders, not two. Either the engine's nudges go off and n8n 13 adds "Today: N cards, about M min" from the engine (a small read endpoint on the Worker, which already has the nudge state), or n8n 13 stays as it is and the engine's nudges are turned off in Settings by default.

## 10. StudyLM and the engine: shared data, two apps (built 2026-11-12)

**The owner's choice (2026-11-12):** asked what "merge this with StudyLM" should mean, the owner picked **shared data, two apps** over one app (Today, Inbox, Library and Garden as StudyLM tabs) and one study plan (the halal engine's `curriculum.json` driving both). Design: `technical-design.md` §9 "Linked hosts"; decision: ADR-0024, "Shared data with StudyLM".

**How it works:** StudyLM and the learning app stay on separate origins, so they share data through the API with a **host link**:

1. In StudyLM, Progress → "Connect to my daily reviews" opens the learning app at `/connect`. On a paired device, "Link StudyLM" creates a host link (`POST /learning/hosts`) and sends it back to StudyLM's own origin in the fragment. It shows under ⚙ → Devices as "StudyLM on … · linked app" and can be unlinked there or with "Disconnect" in StudyLM.
2. From then on StudyLM sends, with no taps: the cards of a lesson when it's marked complete (and, right after linking, of lessons finished before), a flashcard rated "again", and a quiz question answered wrong. They become captures with derived ids (each card once, ever), go through the pipeline, wait as drafts in the Inbox and are kept on their own after 48 hours.
3. Every flashcard rating and first quiz answer is reported; it becomes a review event once its card is a kept concept (counts for memory, the streak and XP, not for today's set). Answers on untracked items don't count: FSRS must know which concept was recalled.
4. StudyLM's Progress screen shows the streak, today's set and its cards by tier. Its outbox lives in localStorage, so offline and a sleeping Render lose nothing.

**Checked:** unit tests for every layer, the HTTP test `links StudyLM…` in `apps/api/src/app/learning.http.spec.ts`, and a browser run of both static builds against the real API on :3000 (in-memory storage, scripted AI): pair, link, finish a lesson (4 cards to drafts), keep them, rate a flashcard "again" then "good" (counted, pulled by the learning app, Sprout in StudyLM), disconnect.

**Not done / possible next steps:**

- **One app** or **one study plan** (the other two options) remain open if the owner wants them later; "one app" would need a boundary change and an ADR amendment.
- Lesson checks inside a lesson (predict, quiz blocks) aren't reported; only flashcards and the quiz arena are.
- StudyLM shows tiers on its Progress screen only, not on each flashcard (`LearningLink.itemState()` is ready for a per-card chip).

## 11. Next steps

1. **Deploy the API:** Render's auto-deploy hasn't fired since 2026-10-27 (section 8), so after this merges, press Manual Deploy on `ahmed-hrichi-api` (no new variables: CORS lets StudyLM in by itself). The static apps deploy from CI.
2. Owner: pair the phone and the PC (⚙ → Devices and pairing → Send me a code).
3. Owner, once per browser: StudyLM → Progress → "Connect to my daily reviews" → "Link StudyLM". n8n must be running for the cards to turn into drafts.
