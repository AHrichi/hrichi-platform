// Installs the lead workflow into a local n8n running in Docker:
//   - creates the "Lead webhook secret" (Crypto) and "Portfolio Atlas"
//     (MongoDB) credentials from .env.render (tools/scripts/lead-secrets.mjs)
//   - points the auto-reply at the Gmail OAuth2 credential n8n already has
//   - imports tools/n8n/workflows/lead-intake.json, unpublished
// Secrets go from the file straight into n8n's encrypted store; they are
// never printed, and the temporary copies are deleted. Safe to rerun.
//
//   --container <name>  the n8n container (default: n8n)
//   --env-file <path>   default: .env.render
//
// Usage: node tools/n8n/install.mjs
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { readEnvFile, secretsFile } from '../scripts/env-file.mjs';

const { values } = parseArgs({
  options: {
    container: { type: 'string', default: 'n8n' },
    'env-file': { type: 'string', default: secretsFile },
  },
});
const container = values.container;
const workflowFile = 'tools/n8n/workflows/lead-intake.json';

function docker(...args) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: 'pipe' });
}

/** Runs a command in the container with `input` on its stdin. */
function dockerWithInput(input, ...args) {
  return execFileSync('docker', ['exec', '-i', container, ...args], {
    encoding: 'utf8',
    input,
    stdio: 'pipe',
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/**
 * Streams JSON into the container (no copy on this machine; `docker cp`
 * would leave a root-owned file n8n's user can't delete), runs an n8n
 * import, and deletes the file.
 */
function importJson(kind, data) {
  const name = `lead-${kind}-${randomBytes(6).toString('hex')}.json`;
  try {
    dockerWithInput(
      JSON.stringify(data),
      'sh',
      '-c',
      `umask 077 && cat > /tmp/${name}`,
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
      console.warn(
        `  Could not delete /tmp/${name} in ${container}; remove it by hand.`,
      );
    }
  }
}

const env = readEnvFile(values['env-file']);
for (const key of ['MONGODB_URI', 'N8N_WEBHOOK_SECRET']) {
  if (!env[key]) {
    fail(
      `${key} is missing from ${values['env-file']}. Run node tools/scripts/lead-secrets.mjs first.`,
    );
  }
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

console.log(`Installing the lead workflow into ${container}`);

// Names and types only: the export's encrypted data stays in the container.
const existing = JSON.parse(
  docker(
    'exec',
    container,
    'sh',
    '-c',
    'f=/tmp/lead-list-$$.json; n8n export:credentials --all --output=$f >/dev/null 2>&1; ' +
      "node -e \"const fs=require('fs');const p=process.argv[1];" +
      'const c=fs.existsSync(p)?require(p):[];' +
      'console.log(JSON.stringify(c.map(({id,name,type})=>({id,name,type}))))" $f; rm -f $f',
  ),
);

const workflow = JSON.parse(readFileSync(workflowFile, 'utf8'));
const autoReply = workflow.nodes.find((node) => node.name === 'Auto-reply');
const gmail = existing.find((credential) => credential.type === 'gmailOAuth2');
if (gmail) {
  autoReply.credentials.gmailOAuth2 = { id: gmail.id, name: gmail.name };
  console.log(`- Auto-reply sends with your "${gmail.name}" credential`);
} else {
  console.log(
    '- No Gmail credential found: create one in n8n and pick it in Auto-reply',
  );
}

// Same ids as the workflow file, so reruns update instead of duplicating.
console.log('- Credentials');
importJson('credentials', [
  {
    id: 'LeadWebhookHmac1',
    name: 'Lead webhook secret',
    type: 'crypto',
    data: { hmacSecret: env.N8N_WEBHOOK_SECRET },
  },
  {
    id: 'PortfolioAtlas01',
    name: 'Portfolio Atlas',
    type: 'mongoDb',
    data: {
      configurationType: 'connectionString',
      connectionString: env.MONGODB_URI,
      database: 'portfolio',
    },
  },
]);

console.log('- Workflow');
importJson('workflow', [workflow]);

console.log(`
Done. Next:
  1. Open n8n (http://localhost:5678) > "Portfolio lead intake" > Publish.
  2. Send a signed test lead to another address of yours:
       node tools/n8n/send-test-lead.mjs --to you@example.com
     Expect 202 and an auto-reply at that address.`);
