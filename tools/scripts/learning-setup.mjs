// Sets up the Learning Engine in production (ADR-0024) with as little typing
// as possible. Values come from .env.render (git-ignored) and are never
// printed; only missing AI keys are asked for, at hidden prompts.
//
//   1. LEARNING_TOKEN_SECRET: kept if saved, generated once otherwise.
//   2. AI keys (GROQ_API_KEY, GEMINI_API_KEY, TYPESAFE_API_KEY): checked
//      against their services; Enter skips one.
//   3. The learning-edge Worker: its KV namespace (created once, its id
//      written to apps/learning-edge/wrangler.jsonc), then one deploy with
//      its four secrets, then a health check.
//   4. The Telegram webhook, pointed at the Worker with a fresh secret. A
//      webhook that points elsewhere is left alone unless --replace-webhook.
//   5. .env.render gains the learning keys, for Render's "Add from .env".
//
// Usage: node tools/scripts/learning-setup.mjs [--replace-webhook] [--no-deploy]
// Needs `pnpm exec wrangler login` once, and TELEGRAM_BOT_TOKEN and
// TELEGRAM_CHAT_ID in .env.render (node tools/scripts/lead-secrets.mjs).
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  readEnvFile,
  secretsFile as file,
  writeEnvValues,
} from './env-file.mjs';
import { ask } from './prompt.mjs';

const args = new Set(process.argv.slice(2));
const interactive = process.stdin.isTTY;
const saved = readEnvFile(file);
const known = (name) => process.env[name]?.trim() || saved[name] || '';
const config = 'apps/learning-edge/wrangler.jsonc';
const environments = 'tools/hosting/environments.json';
const require = createRequire(import.meta.url);
const wranglerBin = join(
  dirname(require.resolve('wrangler/package.json')),
  'bin',
  'wrangler.js',
);

function stop(message) {
  console.error(`\n  Stopping: ${message}`);
  process.exit(1);
}

/** Runs wrangler without a shell; nothing secret is ever an argument. */
function wrangler(...wranglerArgs) {
  const result = spawnSync(process.execPath, [wranglerBin, ...wranglerArgs], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    ok: result.status === 0,
    out: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  };
}

async function telegram(method, body) {
  const response = await fetch(
    `https://api.telegram.org/bot${known('TELEGRAM_BOT_TOKEN')}/${method}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(15_000),
    },
  );
  return response.json();
}

/** A key checked against its service; null when it works. */
const checks = {
  GROQ_API_KEY: async (key) => {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    return response.ok ? null : `Groq answered ${response.status}`;
  },
  GEMINI_API_KEY: async (key) => {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models',
      {
        headers: { 'x-goog-api-key': key },
        signal: AbortSignal.timeout(15_000),
      },
    );
    return response.ok ? null : `Gemini answered ${response.status}`;
  },
  // TypeSafe has no free check endpoint; Jev calls show any problem.
  TYPESAFE_API_KEY: async () => null,
};

const titles = {
  GROQ_API_KEY:
    'Groq (capture pipeline and transcription; console.groq.com/keys)',
  GEMINI_API_KEY: 'Gemini (fallback models; aistudio.google.com/apikey)',
  TYPESAFE_API_KEY: 'TypeSafe Jev (optional, judging tasks)',
};

async function aiKey(name) {
  console.log(`\n${titles[name]}`);
  let value = known(name);
  for (let attempt = 0; attempt < 3; attempt++) {
    if (value) {
      const problem = await checks[name](value).catch(
        () => 'could not reach the service',
      );
      if (!problem) {
        console.log(`  ok: ${name}`);
        return value;
      }
      console.log(`  problem: ${problem}`);
    }
    if (!interactive) break;
    value = await ask('  Key (hidden, Enter to skip): ', { hidden: true });
    if (!value) break;
  }
  console.log(`  skipped: ${name}`);
  return '';
}

console.log(
  `Learning Engine setup. Secrets come from ${file} and are never printed.`,
);

// 1. The token secret the API and the Worker share.
console.log('\n1/5 Device token secret');
const tokenSecret =
  known('LEARNING_TOKEN_SECRET') || randomBytes(32).toString('base64url');
console.log(
  saved.LEARNING_TOKEN_SECRET
    ? '  ok: LEARNING_TOKEN_SECRET (saved)'
    : '  new: LEARNING_TOKEN_SECRET (generated)',
);

// 2. AI keys.
console.log('\n2/5 AI keys');
const keys = {};
for (const name of Object.keys(checks)) keys[name] = await aiKey(name);
if (!keys.GROQ_API_KEY && !keys.GEMINI_API_KEY) {
  console.log(
    '  Without Groq or Gemini, captures wait and say so. Rerun to add one.',
  );
}
writeEnvValues(
  {
    LEARNING_TOKEN_SECRET: tokenSecret,
    ...Object.fromEntries(Object.entries(keys).filter(([, value]) => value)),
  },
  file,
);
console.log(`  Saved to ${file}.`);

// 3. The Worker.
console.log('\n3/5 The learning-edge Worker');
const botToken = known('TELEGRAM_BOT_TOKEN');
const chatId = known('TELEGRAM_CHAT_ID');
if (!botToken || !chatId) {
  stop(
    `TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID aren't in ${file}. Run node tools/scripts/lead-secrets.mjs first.`,
  );
}
const me = await telegram('getMe');
if (!me.ok) stop(`Telegram refused the bot token (${me.description}).`);
console.log(`  ok: the bot is @${me.result.username}`);

let edgeUrl = null;
const webhookSecret = randomBytes(24).toString('hex');
if (args.has('--no-deploy')) {
  console.log('  skipped (--no-deploy)');
} else {
  const whoami = wrangler('whoami');
  if (!whoami.ok || /not authenticated/i.test(whoami.out)) {
    stop('wrangler is not logged in. Run: pnpm exec wrangler login');
  }
  const configText = readFileSync(config, 'utf8');
  const placeholder = '00000000000000000000000000000000';
  if (configText.includes(placeholder)) {
    const listed = wrangler('kv', 'namespace', 'list');
    const existing = (() => {
      try {
        return JSON.parse(listed.out.slice(listed.out.indexOf('[')));
      } catch {
        return [];
      }
    })().find((ns) => ns.title === 'learning-nudges');
    let id = existing?.id;
    if (!id) {
      const created = wrangler('kv', 'namespace', 'create', 'learning-nudges');
      id = created.out.match(/[0-9a-f]{32}/)?.[0];
      if (!created.ok || !id)
        stop(`could not create the KV namespace.\n${created.out}`);
      console.log('  new: KV namespace learning-nudges');
    } else {
      console.log('  ok: KV namespace learning-nudges (exists)');
    }
    writeFileSync(config, configText.replace(placeholder, id));
    console.log(`  Wrote its id to ${config}.`);
  } else {
    console.log('  ok: KV namespace id already in the config');
  }

  // One deploy, secrets included, from a private temp file removed at once.
  const dir = mkdtempSync(join(tmpdir(), 'learning-edge-'));
  const secrets = join(dir, 'secrets.json');
  let deployed;
  try {
    writeFileSync(
      secrets,
      JSON.stringify({
        LEARNING_TOKEN_SECRET: tokenSecret,
        TELEGRAM_BOT_TOKEN: botToken,
        TELEGRAM_CHAT_ID: chatId,
        TELEGRAM_WEBHOOK_SECRET: webhookSecret,
      }),
      { mode: 0o600 },
    );
    deployed = wrangler(
      'deploy',
      '--config',
      config,
      '--secrets-file',
      secrets,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (!deployed.ok) stop(`the deploy failed.\n${deployed.out}`);
  edgeUrl = deployed.out.match(
    /https:\/\/learning-edge\.[a-z0-9-]+\.workers\.dev/,
  )?.[0];
  if (!edgeUrl) stop(`the deploy gave no workers.dev URL.\n${deployed.out}`);
  console.log(`  ok: deployed to ${edgeUrl}`);

  let healthy = false;
  for (let attempt = 0; attempt < 10 && !healthy; attempt++) {
    const response = await fetch(`${edgeUrl}/health`).catch(() => null);
    healthy = !!response?.ok;
    if (!healthy) await new Promise((r) => setTimeout(r, 3000));
  }
  if (!healthy)
    stop(`${edgeUrl}/health doesn't answer yet; rerun in a minute.`);
  console.log('  ok: /health answers');

  const hosting = JSON.parse(readFileSync(environments, 'utf8'));
  if (hosting.production.learningEdgeUrl !== edgeUrl) {
    hosting.production.learningEdgeUrl = edgeUrl;
    writeFileSync(environments, `${JSON.stringify(hosting, null, 2)}\n`);
    console.log(`  Wrote learningEdgeUrl to ${environments}.`);
  }
}

// 4. The Telegram webhook.
console.log('\n4/5 Telegram capture');
if (!edgeUrl) {
  console.log('  skipped: the Worker was not deployed in this run');
} else {
  const target = `${edgeUrl}/telegram`;
  const info = await telegram('getWebhookInfo');
  const current = info.result?.url ?? '';
  if (current && current !== target && !args.has('--replace-webhook')) {
    stop(
      `the bot already has a webhook (${new URL(current).host}). Rerun with --replace-webhook to point it at the Worker instead.`,
    );
  }
  const set = await telegram('setWebhook', {
    url: target,
    secret_token: webhookSecret,
    allowed_updates: ['message'],
  });
  if (!set.ok) stop(`Telegram refused the webhook (${set.description}).`);
  const check = await telegram('getWebhookInfo');
  if (check.result?.url !== target) stop('the webhook did not stick.');
  console.log('  ok: messages to the bot go to the Worker');
  await telegram('sendMessage', {
    chat_id: chatId,
    text: '✦ The Learning Engine is connected. Send me an idea or a voice note and it lands in your Learning Inbox.',
  });
  console.log('  Sent a confirmation to your Telegram chat.');
}

// 5. What's left.
console.log(`\n5/5 Render
  The API needs the learning keys from ${file}: in the Render dashboard,
  ahmed-hrichi-api > Environment > Add from .env, paste the file, Save.
  (LEARNING_EDGE_URL and CORS_ORIGINS come from render.yaml.)`);
if (edgeUrl) {
  console.log(`\nDone. Commit ${config} and ${environments} if they changed.`);
}
