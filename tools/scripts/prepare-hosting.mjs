// Prepares a built app folder for the static host (Cloudflare Workers static
// assets). Runs after `nx build`, before `wrangler deploy`.
//
//   --env <name>          Environment in tools/federation/remotes.json (default: production)
//   --federation          Host only: write federation.manifest.json for --env
//   --not-found <file>    Copy <file> to 404.html (served with a 404 status)
//   --cors                Remote only: allow cross-origin reads of every asset
//   --sitemap             Write sitemap.xml and robots.txt from Angular's
//                         prerendered-routes.json and the site URL (site.json)
//   --site-config         Write site-config.json (the contact form's API URL and
//                         Turnstile key, the Orbit API URL) from
//                         tools/hosting/environments.json, and allow those
//                         origins in the CSP (ADR-0010, ADR-0013)
//   --app <name>          Write build-info.json (app, commit, build time) for the
//                         Federation Inspector (ADR-0012)
//   --frame-self          Let the site frame its own pages (Storybook's manager
//                         shows each story in a same-origin iframe, ADR-0015)
//   --allow-eval          Allow 'unsafe-eval' (Storybook compiles story templates
//                         with Angular's JIT compiler in the browser, ADR-0015)
//
// It always writes `_headers` with security headers and a Content-Security-Policy
// whose script hashes come from the inline scripts in the built HTML (ADR-0006).
//
// Usage: node tools/scripts/prepare-hosting.mjs <dist/browser dir> [options]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
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
    sitemap: { type: 'boolean', default: false },
    'site-config': { type: 'boolean', default: false },
    app: { type: 'string' },
    'frame-self': { type: 'boolean', default: false },
    'allow-eval': { type: 'boolean', default: false },
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

const apiOrigins = [];
const turnstileOrigins = [];
if (values['site-config']) {
  const environments = JSON.parse(
    readFileSync('tools/hosting/environments.json', 'utf8'),
  );
  const environment = environments[values.env];
  if (!environment) {
    console.error(
      `No "${values.env}" entry in tools/hosting/environments.json`,
    );
    process.exit(1);
  }
  const {
    apiUrl = null,
    turnstileSiteKey = null,
    orbitApiUrl = null,
  } = environment;
  writeFileSync(
    join(dir, 'site-config.json'),
    `${JSON.stringify({ apiUrl, turnstileSiteKey, orbitApiUrl }, null, 2)}
`,
  );
  for (const url of [apiUrl, orbitApiUrl]) {
    if (url) {
      apiOrigins.push(new URL(url).origin);
    }
  }
  if (turnstileSiteKey) {
    turnstileOrigins.push('https://challenges.cloudflare.com');
  }
}

// Written at deploy time rather than compiled in, so the commit SHA never
// invalidates Nx's build cache.
if (values.app) {
  const sha =
    process.env.GITHUB_SHA ??
    execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  writeFileSync(
    join(dir, 'build-info.json'),
    `${JSON.stringify({ app: values.app, sha, builtAt: new Date().toISOString() }, null, 2)}
`,
  );
}

if (values['not-found']) {
  copyFileSync(join(dir, values['not-found']), join(dir, '404.html'));
}

if (values.sitemap) {
  const site = JSON.parse(
    readFileSync('libs/shared/content/src/lib/site.json', 'utf8'),
  );
  // Angular writes the list next to the browser folder.
  const { routes } = JSON.parse(
    readFileSync(join(dir, '..', 'prerendered-routes.json'), 'utf8'),
  );
  const today = new Date().toISOString().slice(0, 10);
  const urls = Object.keys(routes)
    .sort()
    .map(
      (route) =>
        `  <url><loc>${new URL(route, site.url).href}</loc><lastmod>${today}</lastmod></url>`,
    );
  writeFileSync(
    join(dir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
  );
  writeFileSync(
    join(dir, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site.url).href}\n`,
  );
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
const turnstile = turnstileOrigins.join(' ');
const self = values['frame-self'] ? "'self'" : '';
const evaluate = values['allow-eval'] ? "'unsafe-eval'" : '';
const csp = [
  "default-src 'self'",
  // blob: is required by es-module-shims in shim mode (ADR-0006).
  `script-src 'self' ${evaluate} ${inlineScriptHashes(dir).join(' ')} blob: ${remotes} ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${remotes} ${apiOrigins.join(' ')}`,
  `frame-src ${[self, turnstile].join(' ').trim() || "'none'"}`,
  "img-src 'self' data:",
  "font-src 'self'",
  "manifest-src 'self'",
  // blob: starts a remote's Web Worker inside the shell (ADR-0014).
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${self || "'none'"}`,
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

// A service worker keeps the CSP its script was served with, and browsers
// reinstall it only when the script's bytes change. Stamping the policy's
// hash into the script carries every CSP change (a new remote or API origin)
// to returning visitors' workers. ngsw.json lists the script's hash, so that
// changes too (ADR-0014).
const worker = join(dir, 'ngsw-worker.js');
const stampWorker = existsSync(worker);
if (stampWorker) {
  const policyHash = createHash('sha256').update(csp).digest('base64');
  const original = readFileSync(worker, 'utf8')
    .replace(/\/\/ Content-Security-Policy \S+\n$/, '')
    .replace(/\n?$/, '\n');
  const script = `${original}// Content-Security-Policy ${policyHash}\n`;
  writeFileSync(worker, script);
  const ngsw = JSON.parse(readFileSync(join(dir, 'ngsw.json'), 'utf8'));
  ngsw.hashTable['/ngsw-worker.js'] = createHash('sha1')
    .update(script)
    .digest('hex');
  writeFileSync(join(dir, 'ngsw.json'), `${JSON.stringify(ngsw, null, 2)}\n`);
}

console.log(
  `Prepared ${dir} for ${values.env}: _headers${stampWorker ? ', ngsw-worker.js stamped' : ''}${values.app ? ', build-info.json' : ''}${values.federation ? ', federation.manifest.json' : ''}${values['not-found'] ? ', 404.html' : ''}${values.sitemap ? ', sitemap.xml, robots.txt' : ''}${values['site-config'] ? ', site-config.json' : ''}`,
);
