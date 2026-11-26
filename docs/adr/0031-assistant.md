# ADR-0031: An in-app assistant that can act, on a free Worker

- **Status:** Accepted
- **Date:** 2026-11-26
- **Milestone:** M2

## Context

The owner asked for a chat assistant in SerraCalc that answers questions and can also create and change projects, save results and change settings. It must be reusable by other apps, cost nothing for now, and be easy to move to another AI provider, host or database later.

What the repo had:

- `libs/api/ai` calls Groq and Gemini, but only for structured JSON: no tool calling, no conversation. It is `runtime:node` and `scope:api`, so a Worker can't use it.
- SerraCalc is local-first: projects live in IndexedDB, in the browser, and nothing calls a server.
- `apps/learning-edge` shows how a Worker is built, tested and deployed from CI.

The owner chose a Cloudflare Worker for the AI calls (over Render, whose free hours four products already share).

## Decision

**The model proposes, the app acts.** The Worker only talks to models. The tools run in the browser, on the app's own store, because that is where the projects are. A reply is either words or tool calls; the app runs the calls and sends their results back, for up to five rounds per message.

**What runs when:**

| Effect                 | Example                                         | Runs                                         |
| ---------------------- | ----------------------------------------------- | -------------------------------------------- |
| `read`                 | `get_project`, `preview_calculation`            | At once; the result goes back to the model   |
| `navigate`             | `open_screen`, `start_tour`                     | At once, with a note                         |
| `setting`              | `set_sunlight`, `set_language`                  | At once, with a note and Undo                |
| `write`, `destructive` | `create_project`, `save_calculation`, deletions | After the reader presses **Apply** on a card |

The card's words come from the app, in the reader's language, never from the model. What the reader approves is what runs, and text planted in a project name can't word its own approval. Before a card shows, the app checks the call can run (the project exists, the values are in range); a call that can't goes back to the model as an error, so the reader is never asked to approve a change that would fail.

**Five pieces:**

- **`libs/shared/assistant` (`@ah/shared/assistant`), agnostic:** the contract shared by browser, Worker and apps.
  - `defineTool` with a Valibot schema, turned into JSON Schema limited to what Groq, Gemini and Ollama all accept.
  - An app's `AssistantProfile`: its tools, the schema of the state it sends, and its system prompt.
  - The wire format (`ChatRequest`, `ChatResponse`) and the limits.
  - **The browser never sends prompts or tool definitions**, only the app's id, the conversation and its state. The Worker can't be used as a free general-purpose model proxy.
- **`libs/shared/assistant-engine`, agnostic:** the server side, with no host in it.
  - One OpenAI-compatible adapter (Groq, Gemini's OpenAI endpoint, Ollama) and one for Workers AI.
  - A ladder that moves to the next model on a rate limit, a server error, a timeout or a call that doesn't fit the profile. It is set by one string, `LADDER`, e.g. `groq:openai/gpt-oss-120b,gemini:gemini-flash-latest,workers-ai:@cf/meta/llama-3.3-70b-instruct-fp8-fast!read-only`. A `!read-only` rung may answer and move around, never propose changes.
  - `handleChat(body, deps)`: checks the request against the profile, builds the prompt (the app's state goes inside `<data>…</data>`, escaped, as data and never instructions), runs the ladder and checks the reply.
- **`apps/assistant-edge`, the Worker:** `GET /health` and `POST /v1/chat`.
  - CORS by exact origin; JSON only; the body read under a 48 KB cap as it arrives.
  - Rate limits per IP and overall (`ratelimits` bindings, with an in-memory fallback if a binding fails).
  - Replies are never cached; logs carry the status, timing and provider, never the conversation.
  - Any crash answers `UNAVAILABLE` in the protocol, with CORS, so the page can say so.
  - CI deploys it with `nx affected -t deploy`.
- **`libs/platform/assistant` (`@ah/platform/assistant`), the client:** the loop, the guards and the panel.
  - Every call is checked against the profile again before it runs.
  - Guards: five rounds per message, a model repeating a call is stopped, the history trimmed so a result never loses its call, results cut to 6,000 characters.
  - The conversation lives in this tab only (sessionStorage); "New chat" forgets it.
  - Failures say what happened: busy (with seconds), resting until tomorrow, unavailable, offline.
  - `<ah-assistant-panel>`: a side sheet beside the app on wide screens, not modal, so the reader watches the app change; a modal full screen on phones. Plain text only (no HTML from the model), five languages.
- **`@ah/ui`:** `chat-message`, `chat-composer` and `action-card`, with stories, specs and Docker baselines.

**SerraCalc's part:**

- The profile and its fifteen tools live in `product-serracalc-domain` (`src/lib/assistant/`), so the Worker and the app share them.
- The tools run in the feature library (`src/lib/assistant/serra-tools.ts`) against the store. A saved result opens in its calculator.
- Calculator inputs go through the same field specs as the screens (`kind-inputs.ts`), so the assistant can't set a value the screen would refuse.
- Inside the portfolio, theme and language are left to the site (`omitTools`), and the panel sits below the site's header (`--ah-site-top`).
- The header's **Ask** button loads the panel's code on first use (`@defer`), so the first visit doesn't pay for it.

## Consequences

**Zero cost, and what happens when a free tier runs out:**

| Rung                 | Free allowance                     | When it runs out                      |
| -------------------- | ---------------------------------- | ------------------------------------- |
| Groq                 | About 200,000 tokens a day a model | The next rung answers                 |
| Gemini               | Its free quota                     | The next rung answers                 |
| Workers AI           | 10,000 neurons a day               | "Back tomorrow"; the app still works  |
| Workers (the Worker) | 100,000 requests a day, shared     | Shared with `learning-edge`: accepted |

A round is about 3,000 input tokens, so a few hundred rounds a day cost nothing.

**Without keys** only the Workers AI rung runs, read-only. The owner adds keys once, with `wrangler secret put` (in the hand-off).

**Moving later:**

- Another provider: a new `LADDER` string, or one adapter if it isn't OpenAI-compatible.
- Another host: `handleChat` is a plain function; a Nest controller or another serverless host can call it.
- Another app: a profile in its domain, executors and the panel in its shell. `libs/platform/assistant/README.md` has the recipe.

**Privacy:** the panel says under the composer that messages and a summary of the projects go to an AI service. Nothing is stored on the server.

**Testing:**

- Unit tests: the contract, adapters (including rate limits and bad tool calls), ladder, Worker (CORS, size cap, rate limits, crash path), client loop, panel, and SerraCalc's tools against a real store.
- A live test against a real model, skipped unless `ASSISTANT_LIVE_LADDER` names one. It has passed with Ollama `qwen2.5:7b` in English and French.
- SerraCalc's e2e answers the Worker from a script: Apply and Cancel, a saved result opening, busy and unreachable, axe in light, dark and Arabic, and the portfolio's demo.
