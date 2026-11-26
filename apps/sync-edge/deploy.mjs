// Deploys sync-edge from CI (ADR-0032): its D1 migrations, then the Worker.
// Until the owner creates the database and puts its id in wrangler.jsonc,
// it says so and deploys nothing, so the other apps' deploys go on.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const config = 'apps/sync-edge/wrangler.jsonc';
const id = /"database_id":\s*"([^"]+)"/.exec(readFileSync(config, 'utf8'))?.[1];
if (!id || /^0{8}-/.test(id)) {
  console.log(
    'sync-edge: no D1 database yet (docs/serracalc/AI_HANDOFF.md, §6); not deployed.',
  );
  process.exit(0);
}
const wrangler = (...args) =>
  execFileSync('pnpm', ['exec', 'wrangler', ...args, '--config', config], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
try {
  wrangler('d1', 'migrations', 'apply', 'sync-edge', '--remote');
} catch {
  console.error(
    "sync-edge: applying the D1 migrations failed. Can CI's Cloudflare API token edit D1 (Account · D1 · Edit)? See docs/serracalc/AI_HANDOFF.md, §6.",
  );
  process.exit(1);
}
wrangler('deploy');
