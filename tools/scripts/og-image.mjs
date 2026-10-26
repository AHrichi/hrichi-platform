// Renders the 1200x630 social preview image (Open Graph) with the site's
// tokens and font. Run it again after changing the name, role or brand colors.
//
// Usage: node tools/scripts/og-image.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const output = 'apps/portfolio/shell/public/og-image.png';
const font = readFileSync(
  'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
).toString('base64');

const html = `<!doctype html>
<html><head><style>
  @font-face {
    font-family: 'Inter Variable';
    font-weight: 100 900;
    src: url(data:font/woff2;base64,${font}) format('woff2');
  }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; padding: 80px 88px;
    display: flex; flex-direction: column; justify-content: space-between;
    background: #0f0f12; color: #f7f7f8;
    font-family: 'Inter Variable', sans-serif;
    border-block-start: 12px solid #e2627a;
  }
  .eyebrow { font-size: 26px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #e2627a; }
  h1 { font-size: 96px; font-weight: 700; letter-spacing: -0.035em; line-height: 1; margin-top: 28px; }
  .role { font-size: 44px; font-weight: 500; color: #c2c2c8; margin-top: 24px; }
  .facts { display: flex; gap: 36px; font-size: 28px; color: #9a9aa3; }
  .facts span::before { content: ''; display: inline-block; width: 12px; height: 12px;
    border-radius: 50%; background: #4ade80; margin-right: 14px; vertical-align: middle; }
</style></head>
<body>
  <div>
    <p class="eyebrow">Portfolio</p>
    <h1>Ahmed Hrichi</h1>
    <p class="role">Angular &amp; Full-Stack Developer</p>
  </div>
  <p class="facts"><span>Angular · Nx · Micro-frontends · Three.js · NestJS</span></p>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output });
  console.log(`Social preview written to ${output}`);
} finally {
  await browser.close();
}
