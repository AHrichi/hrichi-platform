// Collects the lead API's secrets (docs/lead-pipeline.md), checks each one
// against its service, and writes them to .env.render (git-ignored), ready
// for Render's "Add from .env". Secrets are typed at hidden prompts and never
// printed. Rerun it any time: values already saved are checked, not re-asked.
//
// Usage: node tools/scripts/lead-secrets.mjs
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { MongoClient } from 'mongodb';
import { readEnvFile, secretsFile as file } from './env-file.mjs';
import { ask } from './prompt.mjs';

const interactive = process.stdin.isTTY;
const saved = readEnvFile(file);

/** An environment value wins over the one saved in the file. */
const known = (name) => process.env[name]?.trim() || saved[name];

/**
 * Uses `value` if it passes `check`, otherwise asks with `read` (up to three
 * times). Exits when the value is still wrong.
 */
async function collect(name, title, value, read, check) {
  console.log(`\n${title}`);
  for (let attempt = 0; attempt < 4; attempt++) {
    if (value) {
      const problem = await check(value);
      if (!problem) {
        console.log(`  ok: ${name}`);
        return value;
      }
      console.log(`  problem: ${problem}`);
    }
    if (!interactive || attempt === 3) break;
    value = await read();
  }
  console.error(`  Stopping: ${name} is still missing or wrong.`);
  process.exit(1);
}

async function checkMongo(uri) {
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    return 'it should start with mongodb+srv://';
  }
  if (/<[a-z_]+>/.test(uri)) {
    return 'it still has a <placeholder> in it';
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
  try {
    await client.connect();
    // Proves the user can write, which the API needs.
    const checks = client.db('portfolio').collection('setup_check');
    await checks.insertOne({ at: new Date() });
    await checks.drop();
    return null;
  } catch (error) {
    const message = error.message;
    if (/auth/i.test(message)) {
      return 'Atlas rejected the username or password';
    }
    if (/ENOTFOUND|ENODATA|querySrv/i.test(message)) {
      return 'no cluster at that address (check the part after @)';
    }
    if (/timed out|selection/i.test(message)) {
      return 'could not reach the cluster (check Network Access allows 0.0.0.0/0)';
    }
    return `MongoDB said: ${message}`;
  } finally {
    await client.close().catch(() => undefined);
  }
}

async function readMongoUri() {
  // Hidden too: people often paste it with the password already filled in.
  let uri = await ask('  Connection string from Atlas (hidden): ', {
    hidden: true,
  });
  if (/<(db_)?username>/.test(uri)) {
    const user = await ask('  Database username: ');
    uri = uri.replace(/<(db_)?username>/, encodeURIComponent(user));
  }
  if (/<(db_)?password>/.test(uri)) {
    const password = await ask('  Database password (hidden): ', {
      hidden: true,
    });
    uri = uri.replace(/<(db_)?password>/, encodeURIComponent(password));
  }
  return uri;
}

async function checkTelegram(token, chatId) {
  if (!/^\d+:[\w-]+$/.test(token)) {
    return 'the bot token should look like 123456789:AA...';
  }
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Portfolio lead alerts are connected. New leads will appear here.',
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const result = await response.json();
    return result.ok ? null : `Telegram said: ${result.description}`;
  } catch {
    return 'could not reach Telegram';
  }
}

async function checkTurnstile(secret) {
  if (/^[123]x0{20,}/.test(secret)) {
    return "that's Cloudflare's test secret; use your widget's secret key";
  }
  try {
    // A made-up token: a valid secret gets "invalid-input-response".
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({ secret, response: 'setup-check' }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const { 'error-codes': errors = [] } = await response.json();
    return errors.includes('invalid-input-secret')
      ? 'Cloudflare does not recognise that secret key'
      : null;
  } catch {
    return 'could not reach Cloudflare';
  }
}

/** The public URL of a local ngrok tunnel, if one is running. */
async function ngrokUrl() {
  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels', {
      signal: AbortSignal.timeout(2000),
    });
    const { tunnels = [] } = await response.json();
    return tunnels.find((t) => t.public_url?.startsWith('https://'))
      ?.public_url;
  } catch {
    return undefined;
  }
}

async function checkWebhook(url) {
  if (!url.startsWith('https://')) {
    return 'it must start with https://';
  }
  try {
    // Unsigned on purpose: a published workflow answers 401.
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 401) {
      console.log('  The workflow is published and rejects unsigned calls.');
    } else if (response.status === 404) {
      console.log(
        '  n8n answered 404: import and publish the workflow later (step 6).',
      );
    } else {
      console.log(`  n8n answered ${response.status}.`);
    }
    return null;
  } catch {
    return 'could not reach that URL (is n8n with ngrok running?)';
  }
}

console.log(
  `Lead API secrets -> ${file} (git-ignored). Paste secrets at hidden prompts; nothing shows.`,
);

const mongoUri = await collect(
  'MONGODB_URI',
  '1/4 MongoDB Atlas',
  known('MONGODB_URI'),
  readMongoUri,
  checkMongo,
);

// Token and chat id are checked together, as "token chatId".
const savedTelegram =
  known('TELEGRAM_BOT_TOKEN') && known('TELEGRAM_CHAT_ID')
    ? `${known('TELEGRAM_BOT_TOKEN')} ${known('TELEGRAM_CHAT_ID')}`
    : undefined;
const [telegramToken, telegramChatId] = (
  await collect(
    'TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID',
    '2/4 Telegram (sends a test message to your chat)',
    savedTelegram,
    async () => {
      const token = await ask('  Bot token from BotFather (hidden): ', {
        hidden: true,
      });
      const chatId = await ask('  Chat id (from telegram-chat-id.mjs): ');
      return `${token} ${chatId}`;
    },
    (pair) => checkTelegram(...pair.split(' ')),
  )
).split(' ');

const turnstileSecret = await collect(
  'TURNSTILE_SECRET',
  '3/4 Cloudflare Turnstile',
  known('TURNSTILE_SECRET'),
  () => ask('  Widget secret key (hidden): ', { hidden: true }),
  checkTurnstile,
);

const detected = (await ngrokUrl())?.concat('/webhook/portfolio-lead');
const webhookUrl = await collect(
  'N8N_WEBHOOK_URL',
  '4/4 n8n',
  known('N8N_WEBHOOK_URL'),
  async () =>
    (await ask(`  Webhook URL${detected ? ` [${detected}]` : ''}: `)) ||
    detected ||
    '',
  checkWebhook,
);
// Generated once, then kept: n8n's credential must hold the same value.
const webhookSecret =
  known('N8N_WEBHOOK_SECRET') || randomBytes(32).toString('hex');

writeFileSync(
  file,
  [
    '# Lead API secrets (docs/lead-pipeline.md). Git-ignored: never commit it.',
    '# Render: Environment > Add from .env. n8n: N8N_WEBHOOK_SECRET is the',
    '# "Lead webhook secret" credential\'s HMAC secret.',
    `MONGODB_URI=${mongoUri}`,
    `TURNSTILE_SECRET=${turnstileSecret}`,
    `TELEGRAM_BOT_TOKEN=${telegramToken}`,
    `TELEGRAM_CHAT_ID=${telegramChatId}`,
    `N8N_WEBHOOK_URL=${webhookUrl}`,
    `N8N_WEBHOOK_SECRET=${webhookSecret}`,
    '',
  ].join('\n'),
);
console.log(`\nSaved ${file}. All values checked; secrets weren't printed.`);
