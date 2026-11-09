// Local stand-in for the production static host (Cloudflare Workers static
// assets). It follows the same rules, so e2e tests and Lighthouse CI measure
// what production serves, including its mistakes:
//   1. `_redirects` rules run first, before any asset: 200 rules rewrite,
//      3xx rules redirect (`*` splats and `:placeholders` supported).
//   2. Assets: the exact file, then <path>.html, then <path>/index.html
//      (prerendered routes).
//   3. Not found: `404.html` with a 404 status when the build has one
//      (not_found_handling: 404-page), else `index.html` (single-page-app).
//   4. Every matching `_headers` rule applies (CSP, immutable caching ...).
//      Anything without a Cache-Control rule gets the host's default,
//      `public, max-age=0, must-revalidate`. The serve-static targets write
//      `_headers` first with prepare-hosting.mjs --headers-only (ADR-0006).
//   5. Every response allows cross-origin reads, so a local shell can load
//      local remotes on other ports. (In production the remotes' `_headers`
//      say so.)
//   6. Text responses are brotli/gzip compressed, ahead of time like
//      Cloudflare's edge, so Lighthouse never measures compression latency.
//
// Usage: node tools/scripts/serve-static.mjs <build/browser dir> <port>
import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const [rootArg, portArg = '4200'] = process.argv.slice(2);
if (!rootArg) {
  console.error('Usage: node tools/scripts/serve-static.mjs <dir> <port>');
  process.exit(1);
}
const root = resolve(rootArg);
const port = Number(portArg);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

const compressible = (contentType) =>
  /text|javascript|json|svg|manifest|xml/.test(contentType);

/** path -> { mtimeMs, body, br, gzip }; rebuilt when the file changes. */
const cache = new Map();

async function load(file) {
  const { mtimeMs } = await stat(file);
  const cached = cache.get(file);
  if (cached?.mtimeMs === mtimeMs) {
    return cached;
  }
  const body = await readFile(file);
  const entry = { mtimeMs, body };
  if (compressible(contentTypes[extname(file)] ?? '') && body.length > 1024) {
    entry.br = brotliCompressSync(body, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 9 },
    });
    entry.gzip = gzipSync(body, { level: 9 });
  }
  cache.set(file, entry);
  return entry;
}

async function warmUp(folder) {
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isDirectory()) {
      await warmUp(path);
    } else {
      await load(path);
    }
  }
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** The asset for a URL path, or null. Never escapes the root. */
async function findAsset(urlPath) {
  const target = resolve(root, `.${decodeURIComponent(urlPath)}`);
  if (target !== root && !target.startsWith(root + sep)) {
    return null;
  }
  for (const candidate of [
    target,
    `${target}.html`,
    join(target, 'index.html'),
  ]) {
    if (await isFile(candidate)) {
      return candidate;
    }
  }
  return null;
}

/** Cloudflare-style path pattern (`*` splat, `:name`) to a RegExp. */
function patternToRegExp(pattern) {
  const source = pattern
    .split(/(\*|:[A-Za-z]\w*)/)
    .map((part) => {
      if (part === '*') return '(?<splat>.*)';
      if (part.startsWith(':')) return `(?<${part.slice(1)}>[^/]+)`;
      return part.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`^${source}$`);
}

/** `_redirects`: [{ match, to, status }], in file order. */
async function readRedirects() {
  let text;
  try {
    text = await readFile(join(root, '_redirects'), 'utf8');
  } catch {
    return [];
  }
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status = '302'] = line.split(/\s+/);
      return { match: patternToRegExp(from), to, status: Number(status) };
    });
}

function applyRedirect(pathname) {
  for (const { match, to, status } of redirects) {
    const found = match.exec(pathname);
    if (found) {
      const target = to.replace(
        /:([A-Za-z]\w*)/g,
        (_, name) => found.groups?.[name] ?? '',
      );
      return { target, status };
    }
  }
  return null;
}

/** Every `_headers` rule matching the path, merged in file order. */
function headersFor(pathname) {
  const merged = {};
  for (const { match, headers } of headerRules) {
    if (match.test(pathname)) {
      Object.assign(merged, headers);
    }
  }
  if (!Object.keys(merged).some((h) => h.toLowerCase() === 'cache-control')) {
    merged['Cache-Control'] = 'public, max-age=0, must-revalidate';
  }
  return merged;
}

const server = createServer(async (req, res) => {
  const { pathname, search } = new URL(req.url ?? '/', 'http://localhost');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let assetPath = pathname;
  const redirect = applyRedirect(pathname);
  if (redirect && redirect.status >= 300 && redirect.status < 400) {
    res.writeHead(redirect.status, { Location: redirect.target + search });
    res.end();
    return;
  }
  if (redirect) {
    assetPath = redirect.target;
  }

  let status = 200;
  let file = await findAsset(assetPath);
  if (!file && (await isFile(join(root, '404.html')))) {
    status = 404;
    file = join(root, '404.html');
  } else if (!file && !extname(assetPath)) {
    file = await findAsset('/index.html');
  }
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const { body, br, gzip } = await load(file);
  const headers = {
    ...headersFor(pathname),
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    Vary: 'Accept-Encoding',
  };
  const accepts = String(req.headers['accept-encoding'] ?? '');
  if (br && accepts.includes('br')) {
    res.writeHead(status, { ...headers, 'Content-Encoding': 'br' });
    res.end(br);
  } else if (gzip && accepts.includes('gzip')) {
    res.writeHead(status, { ...headers, 'Content-Encoding': 'gzip' });
    res.end(gzip);
  } else {
    res.writeHead(status, headers);
    res.end(body);
  }
});

/** `_headers`: [{ match, headers }], one per path rule, in file order. */
async function readHeaderRules() {
  let text;
  try {
    text = await readFile(join(root, '_headers'), 'utf8');
  } catch {
    return [];
  }
  const rules = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }
    if (!/^\s/.test(line)) {
      rules.push({ match: patternToRegExp(line.trim()), headers: {} });
    } else if (rules.length) {
      const colon = line.indexOf(':');
      rules.at(-1).headers[line.slice(0, colon).trim()] = line
        .slice(colon + 1)
        .trim();
    }
  }
  return rules;
}

const redirects = await readRedirects();
const headerRules = await readHeaderRules();
await warmUp(root);
server.listen(port, async () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
  // Tell Nx the continuous task is ready (targets use readyWhen: { signal: true }).
  if (process.env['NX_READY_SIGNAL_SOCKET']) {
    const { emitReadySignal } = await import('@nx/devkit');
    emitReadySignal(server);
  }
});
