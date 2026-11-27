// Starts lasertag-edge for the e2e run (ADR-0033): a fresh local D1 in a
// temporary folder, the migrations applied, and test-only values in an env
// file, so the run never depends on a developer's .dev.vars or old data.
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const config = 'apps/lasertag-edge/wrangler.jsonc';
const state = mkdtempSync(join(tmpdir(), 'lasertag-e2e-'));
const envFile = join(state, 'e2e.env');
writeFileSync(
  envFile,
  [
    'LASERTAG_TOKEN_SECRET=e2e-secret-that-is-long-enough-for-hmac-signing',
    'LASERTAG_BOOTSTRAP_CODE=e2e-warehouse-claim-code',
    'ALLOWED_ORIGINS=http://localhost:4315',
    'RP_ID=localhost',
    'RP_NAME=BARQ (e2e)',
    '',
  ].join('\n'),
);
const shell = process.platform === 'win32';
execFileSync(
  'pnpm',
  [
    'exec',
    'wrangler',
    'd1',
    'migrations',
    'apply',
    'lasertag-edge',
    '--local',
    '--persist-to',
    state,
    '--config',
    config,
  ],
  { stdio: 'inherit', shell, env: { ...process.env, CI: '1' } },
);
const dev = spawn(
  'pnpm',
  [
    'exec',
    'wrangler',
    'dev',
    '--config',
    config,
    '--port',
    '8790',
    '--persist-to',
    state,
    '--env-file',
    envFile,
  ],
  { stdio: 'inherit', shell },
);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    dev.kill(signal);
    process.exit(0);
  });
}
dev.on('exit', (code) => process.exit(code ?? 0));
