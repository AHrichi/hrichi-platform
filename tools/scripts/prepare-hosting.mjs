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
//                         Turnstile key, the Orbit API URL, the n8n URL) from
//                         tools/hosting/environments.json, and allow those
//                         origins in the CSP (ADR-0010, ADR-0013). N8N_URL, when
//                         set, replaces the n8n URL, so the tunnel address can
//                         be a CI secret
//   --app <name>          Write build-info.json (app, commit, build time) for the
//                         Federation Inspector (ADR-0012)
//   --frame-self          Let the site frame its own pages (Storybook's manager
//                         shows each story in a same-origin iframe, ADR-0015)
//   --allow-eval          Allow 'unsafe-eval' (Storybook compiles story templates
//                         with Angular's JIT compiler in the browser, ADR-0015)
//   --headers-only        Write only _headers, still allowing the origins that
//                         --federation and --site-config name. serve-static.mjs
//                         applies it, so e2e tests and Lighthouse run under the
//                         real CSP without changing the app's runtime config
//                         (ADR-0006)
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
    'headers-only': { type: 'boolean', default: false },
  },
});
const writeFiles = !values['headers-only'];
const [dir] = positionals;
if (!dir) {
  console.error(
    'Usage: node tools/scripts/prepare-hosting.mjs <dir> [options]',
  );
  process.exit(1);
}

const remoteOrigins = [];
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
if (values.federation && writeFiles) {
  writeFileSync(
    join(dir, 'federation.manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
} else if (values.federation) {
  // Headers only: the build's own manifest (public/) must list every remote,
  // or the shell can't load the ones it misses.
  const built = JSON.parse(
    readFileSync(join(dir, 'federation.manifest.json'), 'utf8'),
  );
  const stale = Object.keys(manifest).filter(
    (name) => built[name] !== manifest[name],
  );
  if (stale.length > 0) {
    console.error(
      `federation.manifest.json is out of step with tools/federation/remotes.json (${values.env}): ${stale.join(', ')}`,
    );
    process.exit(1);
  }
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
  const n8nUrl = process.env.N8N_URL || environment.n8nUrl || null;
  if (writeFiles) {
    writeFileSync(
      join(dir, 'site-config.json'),
      `${JSON.stringify({ apiUrl, turnstileSiteKey, orbitApiUrl, n8nUrl }, null, 2)}
`,
    );
  }
  for (const url of [apiUrl, orbitApiUrl, n8nUrl]) {
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
// OpenStreetMap tiles for LuxPath's site map. In img-src for the page, and in
// connect-src because once the service worker controls the page it fetches
// every request itself, and a worker's fetches are checked against
// connect-src: without it each tile fails with a 504 for returning visitors.
const tiles = 'https://tile.openstreetmap.org';
// OpenStreetMap's Nominatim: place search and names for LuxPath's map picker.
const geocoder = 'https://nominatim.openstreetmap.org';
// Basecamp's forecast for a campsite (Open-Meteo: free, no key).
const weather = 'https://api.open-meteo.com';
// Allow ngrok tunnels and local endpoints for user-configurable AI webhooks (e.g. StudyLM n8n integration).
const devConnectSources =
  ' https://*.ngrok-free.dev https://*.ngrok.app https://*.ngrok.io http://127.0.0.1:* http://localhost:*';
const csp = [
  "default-src 'self'",
  // blob: is required by es-module-shims in shim mode (ADR-0006).
  `script-src 'self' ${evaluate} ${inlineScriptHashes(dir).join(' ')} blob: ${remotes} ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${remotes} ${apiOrigins.join(' ')} ${tiles} ${geocoder} ${weather}${devConnectSources}`,
  `frame-src ${[self, turnstile].join(' ').trim() || "'none'"}`,
  `img-src 'self' data: ${tiles}`,
  "font-src 'self'",
  "manifest-src 'self'",
  // 'self' for the service worker; blob: for workers a page builds itself.
  // No remote starts a Web Worker since the Orbit lab's orbit worker went
  // (ADR-0016), so the remotes' origins aren't listed: the whole policy has
  // to fit Cloudflare's 2,000-character _headers line.
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
      // The Sky lab's "Use my location" asks the page's own origin (ADR-0016);
      // LuxPath uses the camera, and WebXR for its AR tape measure.
      'Permissions-Policy: camera=(self), microphone=(), geolocation=(self), xr-spatial-tracking=(self)',
      ...(values.cors ? ['Access-Control-Allow-Origin: *'] : []),
    ],
  ],
  // Angular and Native Federation name these with a content hash, so they
  // never change: the app's own bundles, every shared federation bundle
  // (`_angular_core.<hash>.js`, `_ah_ui-<hash>.js`, `three.<hash>.js` …) and
  // a remote's exposed entries. Without this they revalidate on every visit.
  // Unhashed files (remoteEntry.json, the manifest, HTML, fonts under
  // media/) keep the host's default: revalidate.
  ...[
    '/chunk-*',
    '/main-*',
    '/polyfills-*',
    '/styles-*',
    '/_angular_*',
    '/_ah_*',
    '/_ngrx_*',
    '/rxjs.*',
    '/rxjs_*',
    '/three.*',
    '/web-vitals-*',
    '/routes-*',
    '/meta-*',
    '/src-*',
  ].map((pattern) => [
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
const stampWorker = writeFiles && existsSync(worker);
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
  // The worker caches HTML by content hash, with the headers it was first
  // fetched with, and reuses it across versions while the HTML is unchanged:
  // a policy change alone would never reach returning visitors' pages. The
  // same stamp on each cached page changes its hash, so the worker refetches
  // it, with the new policy.
  for (const path of Object.keys(ngsw.hashTable)) {
    if (!path.endsWith('.html')) continue;
    const file = join(dir, path);
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8')
      .replace(/<!-- Content-Security-Policy \S+ -->\n?$/, '')
      .replace(/\n?$/, '\n');
    const stamped = `${html}<!-- Content-Security-Policy ${policyHash} -->\n`;
    writeFileSync(file, stamped);
    ngsw.hashTable[path] = createHash('sha1').update(stamped).digest('hex');
  }
  writeFileSync(join(dir, 'ngsw.json'), `${JSON.stringify(ngsw, null, 2)}\n`);
}

console.log(
  `Prepared ${dir} for ${values.env}: _headers${stampWorker ? ', ngsw-worker.js stamped' : ''}${values.app ? ', build-info.json' : ''}${values.federation && writeFiles ? ', federation.manifest.json' : ''}${values['not-found'] ? ', 404.html' : ''}${values.sitemap ? ', sitemap.xml, robots.txt' : ''}${values['site-config'] && writeFiles ? ', site-config.json' : ''}`,
);
