// Prints the prerendered /cv page to <dir>/<site.cvFile> (A4, tagged PDF), so
// the downloadable CV is always the same content as the site. JavaScript is
// off: the prerendered HTML is complete, and federation isn't needed.
//
// Usage: node tools/scripts/cv-pdf.mjs <dist/browser dir>
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';

const [dirArg] = process.argv.slice(2);
if (!dirArg) {
  console.error('Usage: node tools/scripts/cv-pdf.mjs <dir>');
  process.exit(1);
}
const root = resolve(dirArg);
const site = JSON.parse(
  readFileSync('libs/shared/content/src/lib/site.json', 'utf8'),
);
const contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: 'msedge' });
}
try {
  const page = await browser.newPage({
    javaScriptEnabled: false,
    colorScheme: 'light',
  });
  // Serve the build folder to the page without starting a server.
  await page.route('http://cv.local/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    const file = resolve(
      root,
      `.${extname(pathname) ? pathname : join(pathname, 'index.html')}`,
    );
    if (file !== root && !file.startsWith(root + sep)) {
      return route.fulfill({ status: 404 });
    }
    try {
      await route.fulfill({
        body: await readFile(file),
        contentType: contentTypes[extname(file)] ?? 'application/octet-stream',
      });
    } catch {
      await route.fulfill({ status: 404 });
    }
  });

  await page.goto('http://cv.local/cv', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  const output = join(root, site.cvFile);
  await page.pdf({
    path: output,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
  });
  console.log(`CV PDF written to ${output}`);
} finally {
  await browser.close();
}
