// The API's image installs only the dependencies Nx writes to
// dist/apps/api/package.json (apps/api/Dockerfile), and Nx leaves out root
// devDependencies. A package the bundle requires but that sits in
// devDependencies passes every test, then crashes the API when Render starts
// it. This fails CI instead.
//
// Usage (after `nx build api`): node tools/scripts/check-api-dependencies.mjs [dist/apps/api]
import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';

const dist = process.argv[2] ?? 'dist/apps/api';
const bundle = readFileSync(`${dist}/main.js`, 'utf8');
const { dependencies = {} } = JSON.parse(
  readFileSync(`${dist}/package.json`, 'utf8'),
);
const builtins = new Set(builtinModules);

const required = new Set();
for (const [, specifier] of bundle.matchAll(/\brequire\(["']([^"']+)["']\)/g)) {
  if (/^(\.|\/|node:)/.test(specifier)) continue;
  const parts = specifier.split('/');
  const name = specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0];
  if (!builtins.has(name)) required.add(name);
}

const missing = [...required].filter((name) => !(name in dependencies)).sort();
if (missing.length) {
  console.error(
    `The API bundle requires ${missing.join(', ')}, which its production install won't have.\n` +
      'Move them from devDependencies to dependencies in package.json.',
  );
  process.exit(1);
}
console.log(
  `All ${required.size} packages the API bundle requires are in its production install.`,
);
