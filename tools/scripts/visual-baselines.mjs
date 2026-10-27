// Updates the Storybook's screenshot baselines inside the Linux Playwright
// image that CI compares them in (ADR-0015), so they never depend on the
// machine that runs this. Needs Docker.
//
// The image's tag follows the installed @playwright/test; keep the CI job's
// container on the same tag. Linux node_modules live in a Docker volume, so
// the checkout's own node_modules is never touched.
//
// Usage: node tools/scripts/visual-baselines.mjs [--check]
//   --check   Compare with the committed baselines, as CI does, without updating
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const { version } = JSON.parse(
  readFileSync(
    resolve(root, 'node_modules/@playwright/test/package.json'),
    'utf8',
  ),
);
const image = `mcr.microsoft.com/playwright:v${version}-noble`;
const check = process.argv.includes('--check');

const script = [
  'corepack enable',
  'pnpm config set store-dir /pnpm-store',
  'pnpm install --frozen-lockfile',
  `pnpm exec nx run design-system-e2e:e2e --skip-nx-cache${check ? '' : ' -- --update-snapshots'}`,
].join(' && ');

const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--ipc=host',
    '--mount',
    `type=bind,source=${root},target=/work`,
    '--mount',
    'type=volume,source=hrichi-linux-node-modules,target=/work/node_modules',
    '--mount',
    'type=volume,source=hrichi-pnpm-store,target=/pnpm-store',
    '--workdir',
    '/work',
    '--env',
    'VISUAL_REGRESSION=1',
    // Keep Nx's Linux state out of the checkout's .nx folder.
    '--env',
    'NX_DAEMON=false',
    '--env',
    'NX_CACHE_DIRECTORY=/tmp/nx-cache',
    '--env',
    'NX_WORKSPACE_DATA_DIRECTORY=/tmp/nx-data',
    image,
    'bash',
    '-c',
    script,
  ],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
