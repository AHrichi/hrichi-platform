// Sends a signed sample lead to the n8n webhook, exactly as the API does
// (N8nChannel in libs/api/leads), to check the workflow end to end.
//
//   N8N_WEBHOOK_URL     the workflow's production webhook URL
//   N8N_WEBHOOK_SECRET  the shared secret (asked at a hidden prompt if unset)
//   --to <email>        where the auto-reply goes (default: your own address)
//   --bad-signature     sign with a wrong secret; the workflow must answer 401
//
// Usage: node tools/n8n/send-test-lead.mjs --to you@example.com
import { createHmac, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    to: { type: 'string', default: 'ahmed.hrichi.web@gmail.com' },
    'bad-signature': { type: 'boolean', default: false },
  },
});

function askHidden(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl._writeToOutput = (text) => {
    if (text.includes(question)) rl.output.write(text);
  };
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    }),
  );
}

const url = process.env.N8N_WEBHOOK_URL;
if (!url) {
  console.error('Set N8N_WEBHOOK_URL to the workflow webhook URL.');
  process.exit(1);
}
const secret =
  process.env.N8N_WEBHOOK_SECRET?.trim() ||
  (await askHidden('Webhook secret (hidden): '));

const body = JSON.stringify({
  id: randomBytes(12).toString('hex'),
  name: 'Test lead',
  email: values.to,
  message: 'A test lead from tools/n8n/send-test-lead.mjs.',
  intent: 'project',
  audience: 'client',
  humanCheck: 'passed',
  createdAt: new Date().toISOString(),
});
const timestamp = String(Date.now());
const signature = createHmac(
  'sha256',
  values['bad-signature'] ? `${secret}-wrong` : secret,
)
  .update(`${timestamp}.${body}`)
  .digest('hex');

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-lead-timestamp': timestamp,
    'x-lead-signature': `sha256=${signature}`,
  },
  body,
});
console.log(`${response.status} ${await response.text()}`);
process.exit(response.ok === !values['bad-signature'] ? 0 : 1);
