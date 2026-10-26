// Prepares a built app folder for the static host (Cloudflare Workers static
// assets). Runs after `nx build`, before `wrangler deploy`.
//
//   --env <name>          Environment in tools/federation/remotes.json (default: production)
//   --federation          Host only: write federation.manifest.json for --env
//   --not-found <file>    Copy <file> to 404.html (served with a 404 status)
//   --cors                Remote only: allow cross-origin reads of every asset
//
// It always writes `_headers` with security headers and a Content-Security-Policy
// whose script hashes come from the inline scripts in the built HTML (ADR-0006).
//
// Usage: node tools/scripts/prepare-hosting.mjs <dist/browser dir> [options]
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    env: { type: 'string', default: 'production' },
    federation: { type: 'boolean', default: false },
    'not-found': { type: 'string' },
    cors: { type: 'boolean', default: false },
  },
});
const [dir] = positionals;
if (!dir) {
  console.error(
    'Usage: node tools/scripts/prepare-hosting.mjs <dir> [options]',
  );
  process.exit(1);
}

const remoteOrigins = [];
if (values.federation) {
  const registry = JSON.parse(
    readFileSync('tools/federation/remotes.json', 'utf8'),
  );
  const manifest = {};
  for (const [name, origins] of Object.entries(registry)) {
    if (name.startsWith('$')) continue;
    const origin = origins[values.env];
    if (!origin || origin.includes('ACCOUNT_SUBDOMAIN')) {
      console.error(
        `Remote "${name}" has no ${values.env} origin in tools/federation/remotes.json`,
      );
      process.exit(1);
    }
    manifest[name] = `${origin}/remoteEntry.json`;
    remoteOrigins.push(origin);
  }
  writeFileSync(
    join(dir, 'federation.manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

if (values['not-found']) {
  copyFileSync(join(dir, values['not-found']), join(dir, '404.html'));
}

/** Hashes of every executable inline <script> in every HTML file under dir. */
function inlineScriptHashes(root) {
  const hashes = new Set();
  const visit = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) {
        visit(path);
      } else if (entry.name.endsWith('.html')) {
        const html = readFileSync(path, 'utf8');
        for (const [, attrs = '', body] of html.matchAll(
          /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g,
        )) {
          const type = /\stype="([^"]*)"/.exec(attrs)?.[1];
          const executable =
            !type || type === 'text/javascript' || type === 'module';
          if (executable && !/\ssrc=/.test(attrs) && body.length > 0) {
            hashes.add(
              `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
            );
          }
        }
      }
    }
  };
  visit(root);
  return [...hashes].sort();
}

const remotes = remoteOrigins.join(' ');
const csp = [
  "default-src 'self'",
  // blob: is required by es-module-shims in shim mode (ADR-0006).
  `script-src 'self' ${inlineScriptHashes(dir).join(' ')} blob: ${remotes}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${remotes}`,
  "img-src 'self' data:",
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
]
  .map((directive) => directive.replace(/\s+/g, ' ').trim())
  .join('; ');

const rules = [
  [
    '/*',
    [
      `Content-Security-Policy: ${csp}`,
      'Strict-Transport-Security: max-age=31536000; includeSubDomains',
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'Permissions-Policy: camera=(), microphone=(), geolocation=()',
      ...(values.cors ? ['Access-Control-Allow-Origin: *'] : []),
    ],
  ],
  // Angular names these with a content hash, so they never change.
  ...['/chunk-*', '/main-*', '/polyfills-*', '/styles-*'].map((pattern) => [
    pattern,
    ['Cache-Control: public, max-age=31536000, immutable'],
  ]),
];

const headers = rules
  .map(([pattern, lines]) =>
    [pattern, ...lines.map((l) => `  ${l}`)].join('\n'),
  )
  .join('\n\n');
writeFileSync(join(dir, '_headers'), `${headers}\n`);

const longest = Math.max(...headers.split('\n').map((line) => line.length));
if (longest > 2000) {
  console.error(
    `_headers line is ${longest} characters; Cloudflare allows 2000.`,
  );
  process.exit(1);
}
console.log(
  `Prepared ${dir} for ${values.env}: _headers${values.federation ? ', federation.manifest.json' : ''}${values['not-found'] ? ', 404.html' : ''}`,
);
