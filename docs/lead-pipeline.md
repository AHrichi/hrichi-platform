# Lead pipeline: setup and operations

The contact form sends leads to a NestJS API on Render. The API stores each lead in MongoDB Atlas, alerts you on Telegram at once, and hands the lead to n8n on your PC, which sends the visitor an auto-reply from Gmail. Design and trade-offs: [ADR-0010](adr/0010-lead-pipeline.md).

```
Contact form ──POST /leads──▶ NestJS (Render) ──▶ MongoDB Atlas (lead + delivery state)
   │  Turnstile token,            │
   │  idempotency key             ├──▶ Telegram Bot API: instant alert
   │                              └──▶ n8n webhook (HMAC): auto-reply via Gmail
   └─ falls back to email          ▲
                                   └── n8n backstop, every 30 min: pulls leads the push missed
```

Everything runs on free plans. Until the API URL and Turnstile site key are in `tools/hosting/environments.json`, the form hands messages to the visitor's email app instead of sending them.

## Sign-ups

| Service                  | Account                   | What you create                             |
| ------------------------ | ------------------------- | ------------------------------------------- |
| **MongoDB Atlas**        | New (free M0)             | A cluster, a database user, network access  |
| **Render**               | New (sign in with GitHub) | The API, from `render.yaml`                 |
| **Telegram**             | Your Telegram account     | A bot, through @BotFather                   |
| **Cloudflare Turnstile** | Your Cloudflare account   | A widget for the portfolio's hostname       |
| **n8n**                  | Your Docker + ngrok setup | Three credentials and the imported workflow |

No card is needed for any of them. Keep every secret below in a password manager; don't paste them into chat, issues or commits.

## 1. MongoDB Atlas

1. Sign up at [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register).
2. Create a cluster: **M0 (Free)**, provider AWS, region **Frankfurt (eu-central-1)**, next to the API.
3. **Database Access** → add a user with password authentication and the role **Read and write to any database**. Use the generated password.
4. **Network Access** → add `0.0.0.0/0`. Render's free plan has no fixed outbound IPs, and neither does your PC. The database user's password is what protects the data.
5. **Connect** → **Drivers** → copy the `mongodb+srv://…` string and put the user's password in it. This is `MONGODB_URI`.

The API creates the `portfolio` database, the `leads` collection and its indexes on first start.

## 2. Telegram bot

1. In Telegram, open **@BotFather**, send `/newbot`, and choose a name and a username ending in `bot`. BotFather answers with the bot token: `TELEGRAM_BOT_TOKEN`.
2. Open your new bot and press **Start**, so it is allowed to message you.
3. Get your chat id. The script asks for the token at a hidden prompt and only sends it to Telegram:

   ```bash
   node tools/scripts/telegram-chat-id.mjs
   ```

   It prints `TELEGRAM_CHAT_ID=…`.

## 3. Cloudflare Turnstile

1. Cloudflare dashboard → **Turnstile** → **Add widget**.
2. Name: `Portfolio contact`. Hostname: `portfolio.ahmed-hrichi.workers.dev`. Widget mode: **Managed**.
3. Copy the **site key** (public; it goes in the repo) and the **secret key** (`TURNSTILE_SECRET`, for Render only).

Local development doesn't need a widget: it uses Cloudflare's public test keys, which always pass.

## 4. Collect and check the secrets

One script asks for everything from steps 1 to 3 at hidden prompts, checks each value against its service (an Atlas test write, a Telegram test message, Cloudflare's siteverify), generates the n8n shared secret, and saves it all to `.env.render`, which git ignores:

```bash
node tools/scripts/lead-secrets.mjs
```

Rerun it whenever a value changes; values that still pass are kept. To do it by hand instead, generate the n8n shared secret yourself. The API signs every webhook call with it and n8n checks the signature:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

It goes in two places: Render (`N8N_WEBHOOK_SECRET`) and an n8n credential (step 6).

## 5. Render

1. Sign up at [render.com](https://render.com) with GitHub, and allow it to read `AHrichi/hrichi-platform`.
2. **New** → **Blueprint** → pick the repository. Render reads `render.yaml` and proposes the `ahmed-hrichi-api` service.
3. Fill in the secrets it asks for. With `.env.render`, open the service's **Environment** → **Add from .env** and paste the file instead:

   | Variable             | Value                                                       |
   | -------------------- | ----------------------------------------------------------- |
   | `MONGODB_URI`        | From step 1                                                 |
   | `TURNSTILE_SECRET`   | From step 3                                                 |
   | `TELEGRAM_BOT_TOKEN` | From step 2                                                 |
   | `TELEGRAM_CHAT_ID`   | From step 2                                                 |
   | `N8N_WEBHOOK_URL`    | `https://<your ngrok static domain>/webhook/portfolio-lead` |
   | `N8N_WEBHOOK_SECRET` | From step 4                                                 |

4. Apply. Later deploys start only after GitHub CI passes for the commit (`autoDeployTrigger: checksPass`).
5. When the deploy is live, open `https://<service>.onrender.com/health`. It should answer `{"status":"ok","db":"up",…}`. The first request after 15 idle minutes takes up to a minute while the free instance wakes; the contact page sends a wake-up ping as soon as it opens.

Telegram and n8n are optional: leave both variables of a pair empty and the API marks that delivery `disabled`.

## 6. n8n

Your n8n needs version 2.x (the workflow was tested on 2.43.7 and 2.44.7).

**With n8n in Docker and `.env.render` filled in,** one command creates the Crypto and MongoDB credentials, points the auto-reply at the Gmail credential n8n already has, and imports the workflow (unpublished). The secrets are streamed straight into n8n's encrypted store and never printed:

```bash
node tools/n8n/install.mjs
```

Pass `--container <name>` if the container isn't called `n8n`. Then skip to step 4 below. **By hand:**

1. **Credentials** → create three, with exactly these names so the workflow finds them:

   | Name                  | Type             | Value                                                       |
   | --------------------- | ---------------- | ----------------------------------------------------------- |
   | `Lead webhook secret` | Crypto           | **Hmac Secret**: the secret from step 4                     |
   | `Portfolio Atlas`     | MongoDB          | Connection string: `MONGODB_URI`; database: `portfolio`     |
   | `Gmail`               | Gmail OAuth2 API | Your Gmail account (an existing Gmail credential works too) |

2. **Workflows** → **Import from file** → `tools/n8n/workflows/lead-intake.json`.
3. Open **Sign the body**, **Missed by the push**, **Mark delivered in Atlas** and **Auto-reply**. If a credential field is empty, pick the matching credential.
4. **Publish** the workflow.
5. Check it from your PC. The script takes the URL and secret from `.env.render`, or from `N8N_WEBHOOK_URL` and a hidden prompt:

   ```bash
   node tools/n8n/send-test-lead.mjs --to you@example.com
   ```

   Expect `202` and an auto-reply at that address. With `--bad-signature` the answer must be `401`.

Because the HMAC secret lives in an n8n credential, the workflow JSON holds no secrets and is safe to export back into the repo.

## 7. Turn the form on

Put the API URL and the Turnstile **site key** in the `production` entry of `tools/hosting/environments.json`, then push:

```json
"production": {
  "apiUrl": "https://ahmed-hrichi-api.onrender.com",
  "turnstileSiteKey": "0x4AAAA…"
}
```

The next deploy writes `site-config.json` and adds both origins to the Content-Security-Policy.

## 8. Test the whole path

Send a message from the live contact page, then check:

- **Telegram:** an alert within seconds.
- **Your inbox:** nothing; the visitor's address gets the auto-reply.
- **Atlas** → `portfolio.leads`: the lead, with `delivery.telegram.status` and `delivery.n8n.status` set to `sent`.

## Local development

```bash
docker run -d --name portfolio-mongo -p 27017:27017 mongo:8.0
```

Copy `apps/api/.env.example` to `apps/api/.env.local`, then run the API and the shell on the local Cloudflare runtime (two terminals). The development entry of `environments.json` points the form at `http://localhost:3000` with Turnstile's always-pass test key.

```bash
pnpm nx serve api
```

```bash
pnpm nx serve-cloudflare shell
```

The repository's integration tests use the same container:

```bash
MONGODB_TEST_URI=mongodb://localhost:27017 pnpm nx test api-leads
```

## When something is down

| Down                     | What the visitor sees                                | What happens to the lead                                                              |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| API asleep               | "Waking up the free-tier server…" for up to a minute | Sent once the API answers; the client retries for about 90 s                          |
| API unreachable          | The same message, prefilled, as an email link        | Nothing stored; the visitor can send the email                                        |
| Turnstile script blocked | "Continue in your email app", with the message       | Nothing stored                                                                        |
| Turnstile API down       | Nothing different                                    | Stored and flagged `humanCheck: unavailable`; no auto-reply                           |
| Telegram down            | Nothing different                                    | Retried by the API's outbox (1 min up to 24 h between attempts)                       |
| n8n or your PC off       | Nothing different                                    | Retried by the outbox while the API is awake; pulled by the backstop when n8n is back |

## Rotating a secret

- **Telegram token:** `/revoke` in @BotFather, then update `TELEGRAM_BOT_TOKEN` on Render.
- **n8n secret:** generate a new one, update the n8n credential first, then `N8N_WEBHOOK_SECRET` on Render. Calls in between fail and are retried.
- **Atlas password:** reset the user's password, then update `MONGODB_URI` on Render and the n8n credential.
- **Turnstile secret:** rotate it in the widget's settings, then update `TURNSTILE_SECRET` on Render.
