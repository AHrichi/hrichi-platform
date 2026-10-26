// Generates every app icon from the two brand SVGs in
// libs/design-system/tokens/brand, so the tab icon, PWA icons and Apple touch
// icon can't drift apart. Run it after changing the mark.
//
// Usage: node tools/scripts/brand-icons.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const brand = 'libs/design-system/tokens/brand';
const mark = readFileSync(join(brand, 'mark.svg'), 'utf8');
const fullBleed = readFileSync(join(brand, 'mark-full-bleed.svg'), 'utf8');
const shellPublic = 'apps/portfolio/shell/public';
const appPublics = [shellPublic, 'apps/labs/hello/public'];

const browser = await chromium.launch();
const page = await browser.newPage();

async function png(svg, size, transparent = true) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  return page.screenshot({ omitBackground: transparent });
}

/** An .ico that embeds PNGs (supported by every current browser and Windows). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

try {
  // One page renders every size, so render them one after another.
  const sizes = [];
  for (const size of [16, 32, 48]) {
    sizes.push({ size, data: await png(mark, size) });
  }
  const favicon = ico(sizes);
  for (const dir of appPublics) {
    copyFileSync(join(brand, 'mark.svg'), join(dir, 'favicon.svg'));
    writeFileSync(join(dir, 'favicon.ico'), favicon);
  }

  const icons = join(shellPublic, 'icons');
  mkdirSync(icons, { recursive: true });
  writeFileSync(join(icons, 'icon-192x192.png'), await png(mark, 192));
  writeFileSync(join(icons, 'icon-512x512.png'), await png(mark, 512));
  writeFileSync(
    join(icons, 'maskable-512x512.png'),
    await png(fullBleed, 512, false),
  );
  writeFileSync(
    join(icons, 'apple-touch-icon.png'),
    await png(fullBleed, 180, false),
  );
  console.log(`Brand icons written to ${appPublics.join(', ')}`);
} finally {
  await browser.close();
}
