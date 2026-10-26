// CI guard for ADR-0004 (zoneless everywhere). The lint rule only fires once
// zone.js is installed, so this also checks dependencies, polyfills and sources.
//
// Usage: node tools/scripts/check-zoneless.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const problems = [];

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
  if (pkg[field]?.['zone.js']) {
    problems.push(`package.json ${field} contains zone.js`);
  }
}

const sourceExtensions = ['.ts', '.mts', '.js', '.mjs'];
const zoneImport = /(?:import|from|require\()\s*['"]zone\.js(?:\/[^'"]*)?['"]/;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path);
    } else if (entry.name === 'project.json') {
      const targets = JSON.parse(readFileSync(path, 'utf8')).targets ?? {};
      for (const [name, target] of Object.entries(targets)) {
        const polyfills = target.options?.polyfills ?? [];
        if ([polyfills].flat().some((p) => p.startsWith('zone.js'))) {
          problems.push(`${path} target "${name}" loads zone.js polyfills`);
        }
      }
    } else if (sourceExtensions.some((ext) => entry.name.endsWith(ext))) {
      if (zoneImport.test(readFileSync(path, 'utf8'))) {
        problems.push(`${path} imports zone.js`);
      }
    }
  }
}

for (const root of ['apps', 'libs']) {
  walk(root);
}

if (problems.length) {
  console.error('zone.js found (ADR-0004 requires zoneless):');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}
console.log(
  'Zoneless check passed: no zone.js in dependencies, polyfills or sources.',
);
