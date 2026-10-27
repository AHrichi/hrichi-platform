// Local stand-in for the production static host (Cloudflare). It applies the
// same rules the host must follow:
//   1. Prerendered routes are served from <route>/index.html.
//   2. Any other route falls back to index.csr.html (client-rendered routes).
//   3. Every response allows cross-origin reads, so the shell can load remotes.
//   4. Hashed assets are immutable; HTML and federation metadata are no-cache.
//   5. Text responses are brotli/gzip compressed, ahead of time like
//      Cloudflare's edge, so Lighthouse never measures compression latency.
//   6. The headers of a `_headers` file's `/*` rule (the CSP among them) go on
//      every response, so e2e tests and Lighthouse run under the real policy.
//      The serve-static targets write one first with prepare-hosting.mjs
//      --headers-only (ADR-0006).
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

async function resolveFile(urlPath) {
  const target = resolve(root, `.${decodeURIComponent(urlPath)}`);
  if (target !== root && !target.startsWith(root + sep)) {
    return null;
  }
  if (await isFile(target)) {
    return target;
  }
  if (extname(urlPath)) {
    return null;
  }
  const prerendered = join(target, 'index.html');
  if (await isFile(prerendered)) {
    return prerendered;
  }
  return join(root, 'index.csr.html');
}

function cacheControl(file) {
  const ext = extname(file);
  if (ext === '.html' || ext === '.json' || ext === '.webmanifest') {
    return 'no-cache';
  }
  return 'public, max-age=31536000, immutable';
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const file = await resolveFile(pathname);
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const { body, br, gzip } = await load(file);
  const headers = {
    ...siteHeaders,
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': cacheControl(file),
    Vary: 'Accept-Encoding',
  };
  const accepts = String(req.headers['accept-encoding'] ?? '');
  if (br && accepts.includes('br')) {
    res.writeHead(200, { ...headers, 'Content-Encoding': 'br' });
    res.end(br);
  } else if (gzip && accepts.includes('gzip')) {
    res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip' });
    res.end(gzip);
  } else {
    res.writeHead(200, headers);
    res.end(body);
  }
});

/** The `/*` rule of `_headers`, as Cloudflare would apply it to every path. */
async function readSiteHeaders() {
  let text;
  try {
    text = await readFile(join(root, '_headers'), 'utf8');
  } catch {
    return {};
  }
  const headers = {};
  let everyPath = false;
  for (const line of text.split('\n')) {
    if (!line.trim()) {
      continue;
    }
    if (!/^\s/.test(line)) {
      everyPath = line.trim() === '/*';
    } else if (everyPath) {
      const colon = line.indexOf(':');
      headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
  }
  return headers;
}

const siteHeaders = await readSiteHeaders();
await warmUp(root);
server.listen(port, async () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
  // Tell Nx the continuous task is ready (targets use readyWhen: { signal: true }).
  if (process.env['NX_READY_SIGNAL_SOCKET']) {
    const { emitReadySignal } = await import('@nx/devkit');
    emitReadySignal(server);
  }
});
