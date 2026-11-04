import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const WORKFLOW_FILE = path.resolve('tools/n8n/workflows/chapter-doc-parser.json');
const CONTAINER = process.env.N8N_CONTAINER || 'n8n';

console.log('--- Installing Chapter Doc Parser n8n Workflow ---');

if (!fs.existsSync(WORKFLOW_FILE)) {
  console.error('Workflow file not found at:', WORKFLOW_FILE);
  process.exit(1);
}

try {
  // Check if Docker container is running
  const status = execFileSync('docker', ['ps', '--filter', `name=${CONTAINER}`, '--format', '{{.Names}}'], {
    encoding: 'utf8',
  }).trim();

  if (!status.includes(CONTAINER)) {
    console.log(`Note: Docker container '${CONTAINER}' is not actively running.`);
    console.log(`You can manually import '${WORKFLOW_FILE}' directly into n8n via:`);
    console.log('1. Open your n8n dashboard (e.g. http://localhost:5678)');
    console.log('2. Click Workflows -> "Import from File" or paste JSON');
    console.log('3. Activate the workflow');
    process.exit(0);
  }

  // 1. Stream workflow JSON into container and import
  const workflowContent = fs.readFileSync(WORKFLOW_FILE, 'utf8');
  execFileSync('docker', ['exec', '-i', CONTAINER, 'n8n', 'import:workflow', '--input=/dev/stdin'], {
    input: workflowContent,
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],
  });

  // 2. Publish/activate workflow
  const workflowId = '1nT7usBnNIeNWKP4';
  try {
    execFileSync('docker', ['exec', CONTAINER, 'n8n', 'publish:workflow', `--id=${workflowId}`], {
      encoding: 'utf8',
    });
    console.log(`✓ Workflow ID '${workflowId}' published/activated in n8n.`);
  } catch (pubErr) {
    console.log('Publish note:', pubErr.message);
  }

  // 3. Restart container so runtime reloads published webhooks into active memory
  console.log(`Restarting '${CONTAINER}' container to reload active webhooks...`);
  execFileSync('docker', ['restart', CONTAINER], { encoding: 'utf8' });

  // 4. Wait for healthz
  console.log('Waiting for n8n to become ready...');
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch('http://localhost:5678/healthz');
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`✓ Workflow imported and active in container '${CONTAINER}'!`);
  console.log('Testing webhook connectivity at http://localhost:5678/webhook/parse-chapter-doc...');

  // 5. Ping the webhook to verify it is live
  try {
    const res = await fetch('http://localhost:5678/webhook/parse-chapter-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true }),
    });
    const data = await res.json();
    if (data && data.isPing) {
      console.log('✓ n8n Webhook is LIVE and responding! Service:', data.service, 'v' + data.version, 'AI:', data.aiEngine);
    }
  } catch (pingErr) {
    console.log('Note: Webhook ping returned:', pingErr.message);
  }

  console.log('\nReady to use: http://localhost:5678/webhook/parse-chapter-doc');
} catch (err) {
  console.log('Manual import ready:');
  console.log(`Workflow JSON is located at: ${WORKFLOW_FILE}`);
  console.log('Import it into n8n Web UI via: Workflows -> Import from File.');
}
