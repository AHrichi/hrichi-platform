// Installs ChatPulse's AI workflow into the local n8n running in Docker:
//   - points the Groq nodes (Whisper + chat) at your existing Groq credential
//   - imports tools/n8n/workflows/whatsapp-analyzer.json and publishes it,
//     which restarts n8n (about 30 seconds)
//   - checks that the container reaches Ollama on the host, then pings the
//     webhook and runs one small analysis through the AI loop
//
// Chat analysis tries Groq gpt-oss-120b, then gpt-oss-20b, then the best
// installed local Ollama model; voice notes use Groq only. Each answer is
// validated and an invalid one is sent back once for repair; a rate limit is
// retried after the wait Groq asks for. Every request has a deadline (5 min
// for analysis, 3 for voice notes) so n8n always answers before the app
// gives up.
//
//   --no-publish        import only
//   --test <routing>    the analysis check: cloud-first (default),
//                       local-first (Ollama first) or none
//   --container <name>  the n8n container (default: n8n)
//
// Usage: node tools/n8n/install-whatsapp-analyzer.mjs
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    'no-publish': { type: 'boolean', default: false },
    test: { type: 'string', default: 'cloud-first' },
    container: { type: 'string', default: 'n8n' },
  },
});
const container = values.container;
const workflowFile = 'tools/n8n/workflows/whatsapp-analyzer.json';
const workflowId = 'WhatsAppPulseAI1';
const local = 'http://localhost:5678/webhook/whatsapp-analyzer';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function docker(...args) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: 'pipe' });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Streams JSON into the container, imports it, and deletes the file. */
function importWorkflow(data) {
  const name = `whatsapp-workflow-${randomBytes(6).toString('hex')}.json`;
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
      'import:workflow',
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

async function post(body, timeoutMs) {
  const started = Date.now();
  const response = await fetch(local, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return {
    reply: await response.json(),
    seconds: Math.round((Date.now() - started) / 1000),
  };
}

/** A tiny two-person chat, enough for the validator's participant checks. */
function sampleAnalysis(aiRouting) {
  const messages = [
    ['Sam', 'Hey, how was the interview today?'],
    ['Lea', 'Really good I think! They liked my portfolio 😊'],
    ['Sam', 'Amazing, I am so proud of you'],
    ['Lea', 'Thanks ❤️ dinner tonight to celebrate?'],
    ['Sam', 'Yes! 8pm at the usual place?'],
    ['Lea', 'Perfect, see you there'],
  ].map(([sender, text], i) => ({
    timestamp: `2026-09-0${1 + (i % 3)} 19:0${i}`,
    sender,
    text,
  }));
  return {
    action: 'analyze_whatsapp_chat',
    aiRouting,
    chatTitle: 'Installer check',
    quantitativeMetrics: {
      totalMessages: 240,
      totalWords: 1700,
      activeDays: 40,
      longestStreakDays: 40,
      lateNightPct: 2,
      participants: [
        {
          name: 'Lea',
          messageSharePct: 50.4,
          avgWordsPerMessage: 8,
          initiationSharePct: 20,
          medianReplySeconds: 60,
          doubleTextIndexPct: 1.7,
          questionCount: 6,
          topEmojis: ['❤️'],
          topWords: ['thanks'],
        },
        {
          name: 'Sam',
          messageSharePct: 49.6,
          avgWordsPerMessage: 7,
          initiationSharePct: 80,
          medianReplySeconds: 55,
          doubleTextIndexPct: 0,
          questionCount: 42,
          topEmojis: ['😊'],
          topWords: ['proud'],
        },
      ],
    },
    sampledWindows: [
      { phase: 'recent', label: 'Recent', startDate: '2026-09-01', messages },
    ],
    wellbeingSignals: [],
  };
}

try {
  if (
    docker('inspect', '-f', '{{.State.Running}}', container).trim() !== 'true'
  ) {
    fail(`The ${container} container isn't running. Start your n8n first.`);
  }
} catch {
  fail(`No Docker container called ${container}. Pass --container <name>.`);
}

const credentials = JSON.parse(
  docker(
    'exec',
    container,
    'sh',
    '-c',
    'f=/tmp/wa-list-$$.json; n8n export:credentials --all --output=$f >/dev/null 2>&1; ' +
      "node -e \"const fs=require('fs');const p=process.argv[1];" +
      'const c=fs.existsSync(p)?require(p):[];' +
      'console.log(JSON.stringify(c.map(({id,name,type})=>({id,name,type}))))" $f; rm -f $f',
  ),
);
const [workflow] = JSON.parse(readFileSync(workflowFile, 'utf8'));
const groq = credentials.find((c) => c.type === 'groqApi');
if (groq) {
  for (const node of workflow.nodes.filter((n) => n.credentials?.groqApi)) {
    node.credentials.groqApi = { id: groq.id, name: groq.name };
  }
  console.log(`- Groq calls use your "${groq.name}" credential`);
} else {
  console.log(
    '- No Groq credential in n8n: every call will fall back to Ollama',
  );
}

try {
  const version = docker(
    'exec',
    container,
    'sh',
    '-c',
    'wget -qO- -T 5 http://host.docker.internal:11434/api/tags',
  );
  const models = JSON.parse(version).models.map((m) => m.name);
  console.log(
    `- Ollama reachable from n8n: ${models.join(', ') || 'no models'}`,
  );
} catch {
  console.log(
    '- n8n cannot reach Ollama at host.docker.internal:11434: the local fallback is off until it can',
  );
}

console.log('- Workflow');
importWorkflow([workflow]);

if (values['no-publish']) {
  console.log(
    '\nImported, not published. Publish it in n8n, or rerun without --no-publish.',
  );
  process.exit(0);
}

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

console.log('- Checks');
const ping = await post({ action: 'ping' }, 15_000).catch((e) => ({
  error: e.message,
}));
console.log(
  `  ping: ${ping.reply?.ok ? 'ok · ' + ping.reply.providers.join(', ') : ping.error}`,
);

if (values.test !== 'none') {
  console.log(
    `  analysis (${values.test}), this can take a few minutes on a local model...`,
  );
  const run = await post(sampleAnalysis(values.test), 10 * 60_000).catch(
    (e) => ({ error: e.message }),
  );
  if (run.error) {
    console.log(`  analysis failed: ${run.error}`);
  } else {
    const r = run.reply;
    console.log(
      `  ${r.ok ? 'ok' : 'failed'} in ${run.seconds}s · ${r.provider}${r.error ? ' · ' + r.error : ''}`,
    );
    for (const a of r.attempts ?? []) {
      console.log(
        `    ${a.attempt}. ${a.provider}${a.repair ? ' (repair)' : ''}: ${a.outcome} (${Math.round(a.ms / 1000)}s)`,
      );
    }
    if (r.qualityWarnings?.length)
      console.log(`    warnings: ${r.qualityWarnings.join('; ')}`);
  }
}
