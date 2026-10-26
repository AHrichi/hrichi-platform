// Local stand-in for the production static host (Cloudflare). It applies the
// same rules the host must follow:
//   1. Prerendered routes are served from <route>/index.html.
//   2. Any other route falls back to index.csr.html (client-rendered routes).
//   3. Every response allows cross-origin reads, so the shell can load remotes.
//   4. Hashed assets are immutable; HTML and federation metadata are no-cache.
//   5. Text responses are brotli/gzip compressed.
//
// Usage: node tools/scripts/serve-static.mjs <build/browser dir> <port>
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';

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
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

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
  const contentType = contentTypes[extname(file)] ?? 'application/octet-stream';
  const body = await readFile(file);
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl(file),
    Vary: 'Accept-Encoding',
  };
  // Compress text like Cloudflare does, so local Lighthouse runs see
  // production-sized transfers.
  const accepts = String(req.headers['accept-encoding'] ?? '');
  if (
    /text|javascript|json|svg|manifest/.test(contentType) &&
    body.length > 1024
  ) {
    if (accepts.includes('br')) {
      res.writeHead(200, { ...headers, 'Content-Encoding': 'br' });
      res.end(brotliCompressSync(body));
      return;
    }
    if (accepts.includes('gzip')) {
      res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip' });
      res.end(gzipSync(body));
      return;
    }
  }
  res.writeHead(200, headers);
  res.end(body);
}).listen(port, async () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
  // Tell Nx the continuous task is ready (targets use readyWhen: { signal: true }).
  if (process.env['NX_READY_SIGNAL_SOCKET']) {
    const { emitReadySignal } = await import('@nx/devkit');
    emitReadySignal(server);
  }
});
