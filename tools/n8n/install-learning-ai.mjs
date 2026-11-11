// Installs the Learning Engine's AI relay into the local n8n (ADR-0024), so
// the API on Render needs no model keys: it calls Groq and Gemini through
// n8n, which already holds them for StudyLM.
//   - LEARNING_N8N_SECRET: kept if saved in .env.render, generated otherwise
//   - LEARNING_N8N_URL: the ngrok tunnel's public URL (or N8N_WEBHOOK_URL's)
//   - creates the "Learning AI secret" (Crypto) credential from the secret
//   - points the workflow at your existing Groq and Google Gemini credentials
//   - imports tools/n8n/workflows/learning-ai.json and publishes it, which
//     restarts n8n (about 30 seconds)
//   - checks the live webhook: unsigned calls refused, a signed ping, one
//     tiny Groq call and one tiny Gemini call
// Secrets go from the file into n8n's encrypted store and are never printed.
// Safe to rerun.
//
//   --no-publish        import only
//   --container <name>  the n8n container (default: n8n)
//   --env-file <path>   default: .env.render
//
// Usage: node tools/n8n/install-learning-ai.mjs
import { execFileSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import {
  readEnvFile,
  secretsFile,
  writeEnvValues,
} from '../scripts/env-file.mjs';

const { values } = parseArgs({
  options: {
    'no-publish': { type: 'boolean', default: false },
    container: { type: 'string', default: 'n8n' },
    'env-file': { type: 'string', default: secretsFile },
  },
});
const container = values.container;
const envFile = values['env-file'];
const workflowFile = 'tools/n8n/workflows/learning-ai.json';
const workflowId = 'LearningAiRelay1';
const local = 'http://localhost:5678/webhook/learning-ai';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function docker(...args) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: 'pipe' });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Streams JSON into the container, imports it, and deletes the file. */
function importJson(kind, data) {
  const name = `learning-${kind}-${randomBytes(6).toString('hex')}.json`;
  try {
    execFileSync(
      'docker',
      ['exec', '-i', container, 'sh', '-c', `umask 077 && cat > /tmp/${name}`],
      { encoding: 'utf8', input: JSON.stringify(data), stdio: 'pipe' },
    );
    const output = docker(
      'exec',
      container,
      'n8n',
      `import:${kind}`,
      `--input=/tmp/${name}`,
    );
    console.log(`  ${output.trim().split('\n').at(-1)}`);
  } finally {
    try {
      docker('exec', container, 'rm', '-f', `/tmp/${name}`);
    } catch {
      console.warn(`  Could not delete /tmp/${name} in ${container}.`);
    }
  }
}

/** The ngrok tunnel's public URL, if the ngrok agent runs here. */
async function tunnelUrl() {
  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels', {
      signal: AbortSignal.timeout(3000),
    });
    const { tunnels = [] } = await response.json();
    return tunnels.find((t) => t.public_url?.startsWith('https://'))
      ?.public_url;
  } catch {
    return undefined;
  }
}

function signed(secret, envelope) {
  const body = JSON.stringify(envelope);
  const timestamp = String(Date.now());
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-learning-timestamp': timestamp,
      'x-learning-signature': `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`,
      'ngrok-skip-browser-warning': '1',
    },
    body,
    signal: AbortSignal.timeout(60_000),
  };
}

/** The relay's answer to one signed call: n8n's code and the provider's. */
async function relayed(url, secret, envelope) {
  try {
    const response = await fetch(url, signed(secret, envelope));
    const reply = await response.json().catch(() => null);
    return { http: response.status, status: reply?.status ?? null };
  } catch (error) {
    return { http: null, status: null, error: error.message };
  }
}

// 1. The relay's secret and address.
const env = readEnvFile(envFile);
const secret = env.LEARNING_N8N_SECRET || randomBytes(32).toString('hex');
const fromLeads = env.N8N_WEBHOOK_URL
  ? new URL(env.N8N_WEBHOOK_URL).origin
  : undefined;
const publicUrl = (await tunnelUrl()) ?? env.LEARNING_N8N_URL ?? fromLeads;
writeEnvValues(
  {
    LEARNING_N8N_SECRET: secret,
    ...(publicUrl ? { LEARNING_N8N_URL: publicUrl.replace(/\/+$/, '') } : {}),
  },
  envFile,
);
console.log(
  `Learning AI relay -> ${container}. ${env.LEARNING_N8N_SECRET ? 'Kept' : 'Generated'} LEARNING_N8N_SECRET; ${publicUrl ? `LEARNING_N8N_URL is ${new URL(publicUrl).host}` : 'no public URL found (start ngrok, then rerun)'}. Saved to ${envFile}.`,
);

// 2. n8n and its credentials.
try {
  if (
    docker('inspect', '-f', '{{.State.Running}}', container).trim() !== 'true'
  ) {
    fail(`The ${container} container isn't running. Start your n8n first.`);
  }
} catch {
  fail(`No Docker container called ${container}. Pass --container <name>.`);
}

// Names and types only: the export's encrypted data stays in the container.
const existing = JSON.parse(
  docker(
    'exec',
    container,
    'sh',
    '-c',
    'f=/tmp/learning-list-$$.json; n8n export:credentials --all --output=$f >/dev/null 2>&1; ' +
      "node -e \"const fs=require('fs');const p=process.argv[1];" +
      'const c=fs.existsSync(p)?require(p):[];' +
      'console.log(JSON.stringify(c.map(({id,name,type})=>({id,name,type}))))" $f; rm -f $f',
  ),
);
const workflow = JSON.parse(readFileSync(workflowFile, 'utf8'));
let providers = 0;
for (const [nodeName, type] of [
  ['Groq', 'groqApi'],
  ['Gemini', 'googlePalmApi'],
]) {
  const credential = existing.find((c) => c.type === type);
  const node = workflow.nodes.find((n) => n.name === nodeName);
  if (credential) {
    node.credentials[type] = { id: credential.id, name: credential.name };
    console.log(`- ${nodeName} calls use your "${credential.name}" credential`);
    providers += 1;
  } else {
    console.log(`- No ${type} credential in n8n: ${nodeName} calls will fail`);
  }
}
if (!providers) {
  fail('n8n has neither a Groq nor a Google Gemini credential. Add one first.');
}

console.log('- Credential');
importJson('credentials', [
  {
    id: 'LearningAiHmac01',
    name: 'Learning AI secret',
    type: 'crypto',
    data: { hmacSecret: secret },
  },
]);
console.log('- Workflow');
importJson('workflow', [workflow]);

if (values['no-publish']) {
  console.log(
    '\nImported, not published. Publish "Learning Engine AI relay" in n8n, or rerun without --no-publish.',
  );
  process.exit(0);
}

// 3. Publish: the CLI publishes in the database; n8n loads it on restart.
console.log('- Publishing (restarts n8n, about 30 seconds)');
docker('exec', container, 'n8n', 'publish:workflow', `--id=${workflowId}`);
docker('restart', container);
let up = false;
for (let waited = 0; waited < 120_000 && !up; waited += 3000) {
  await sleep(3000);
  up = await fetch('http://localhost:5678/healthz')
    .then((r) => r.ok)
    .catch(() => false);
}
if (!up)
  fail(
    `n8n didn't come back within 2 minutes; check: docker logs ${container}`,
  );
await sleep(3000);
console.log('  n8n is back up');

// 4. Check it live.
console.log('- Checks');
const unsigned = await fetch(local, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{"provider":"ping"}',
}).catch(() => null);
console.log(
  `  unsigned call: ${unsigned?.status ?? 'no answer'} (expected 401)`,
);
const ping = await relayed(local, secret, { provider: 'ping' });
console.log(
  `  signed ping: ${ping.status ?? ping.http ?? ping.error} (expected 200)`,
);
const groq = await relayed(local, secret, {
  provider: 'groq',
  path: '/openai/v1/chat/completions',
  body: {
    model: 'openai/gpt-oss-20b',
    messages: [{ role: 'user', content: 'Reply with the JSON {"ok": true}.' }],
    response_format: { type: 'json_object' },
    reasoning_effort: 'low',
    max_completion_tokens: 200,
  },
});
console.log(
  `  Groq through n8n: ${groq.status ?? groq.http ?? groq.error} (expected 200)`,
);
const gemini = await relayed(local, secret, {
  provider: 'gemini',
  path: '/v1beta/models/gemini-flash-latest:generateContent',
  body: { contents: [{ role: 'user', parts: [{ text: 'Reply with OK.' }] }] },
});
console.log(
  `  Gemini through n8n: ${gemini.status ?? gemini.http ?? gemini.error} (expected 200)`,
);
if (publicUrl) {
  const outside = await relayed(
    `${publicUrl.replace(/\/+$/, '')}/webhook/learning-ai`,
    secret,
    { provider: 'ping' },
  );
  console.log(
    `  signed ping through the tunnel: ${outside.status ?? outside.http ?? outside.error} (expected 200)`,
  );
}

console.log(`
Done. Render needs LEARNING_N8N_URL and LEARNING_N8N_SECRET from ${envFile}
(with the other learning keys): ahmed-hrichi-api > Environment > Add from .env.`);
