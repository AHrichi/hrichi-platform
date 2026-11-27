// Gives every standalone app its own icon set and web app manifest, so an
// installed app shows its own icon instead of the portfolio's AH mark.
//
// Per app (into its public/ folder):
//   favicon.svg, favicon.ico (16/32/48), icons/icon-192x192.png,
//   icons/icon-512x512.png, icons/maskable-512x512.png,
//   icons/apple-touch-icon.png, manifest.webmanifest
// and the matching <link>/<meta> tags in src/index.html.
//
// An app with `android` (a Capacitor project) also gets its launcher icons:
//   mipmap-*/ic_launcher.png, ic_launcher_round.png and the adaptive icon's
//   ic_launcher_foreground.png, values/ic_launcher_background.xml, and the
//   splash screens drawable*/splash.png.
//
// PNGs are rendered with Playwright's Chromium. Rerun after editing APPS:
//   node tools/scripts/generate-app-icons.mjs [app-key ...]
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * glyph: SVG markup drawn on a 64x64 canvas, centred around (32, 32).
 * Stroked paths inherit the foreground colour; use fill="currentColor" for solids.
 */
const APPS = {
  lighting: {
    dir: 'apps/products/lighting/web',
    name: 'LuxPath · Street & solar lighting field kit',
    shortName: 'LuxPath',
    description:
      'Plan, audit and maintain street and solar lighting in the field.',
    bg: '#b45309',
    fg: '#ffffff',
    theme: '#f59e0b',
    glyph: `<path d="M22 54 V24 a10 10 0 0 1 10-10 h6"/><path d="M34 14 h12 l-3 6 h-6 z" fill="currentColor"/><path d="M40 26 v5 M34 25 l-2.5 4 M46 25 l2.5 4"/><path d="M15 54 h14"/>`,
  },
  lasertag: {
    dir: 'apps/products/lasertag/web',
    name: 'BARQ · Laser tag',
    shortName: 'BARQ',
    description:
      'Your laser tag badge: check in with a QR, keep every game on your profile.',
    bg: '#0b1020',
    fg: '#facc15',
    theme: '#0b1020',
    glyph: `<path d="M36 6 L14 36 H29 L24 58 L50 26 H34 Z" fill="currentColor" stroke-linejoin="round"/>`,
  },
  serracalc: {
    dir: 'apps/products/serracalc/web',
    name: 'SerraCalc · Greenhouse heat, water & climate',
    shortName: 'SerraCalc',
    description:
      'Size greenhouse heating, cooling and irrigation in the field, offline.',
    bg: '#15803d',
    fg: '#ffffff',
    theme: '#15803d',
    glyph: `<path d="M12 50 V28 l10-10 10 10 10-10 10 10 v22 z"/><path d="M32 28 v22 M12 39 h40" stroke-width="2.5"/><circle cx="48" cy="11" r="3.5"/>`,
  },
  strategy: {
    dir: 'apps/products/strategy/web',
    name: 'StrategyApp · Wealth & financial planning',
    shortName: 'StrategyApp',
    description: 'Multi-scenario wealth and financial planning engine.',
    bg: '#0f766e',
    fg: '#ffffff',
    theme: '#0f766e',
    glyph: `<path d="M13 13 V51 H53"/><path d="M20 42 L30 31 L37 37 L50 22"/><path d="M41 22 H50 V31"/>`,
  },
  dispatch: {
    dir: 'apps/products/dispatch/web',
    name: 'PulseOps · Operations & Dispatch Control Center',
    shortName: 'PulseOps',
    description:
      'Commercial laundry and fleet operations dispatch control center.',
    bg: '#1d4ed8',
    fg: '#ffffff',
    theme: '#1d4ed8',
    glyph: `<path d="M8 34 H20 L26 20 L35 47 L41 29 L45 34 H56"/>`,
  },
  studylm: {
    dir: 'apps/products/studylm/web',
    name: 'StudyLM · AI study roadmaps & drills',
    shortName: 'StudyLM',
    description:
      'AI study roadmaps, flashcards and quizzes grounded in your material.',
    bg: '#4f46e5',
    fg: '#ffffff',
    theme: '#4f46e5',
    // Keeps its shortcuts and id (push notifications, ADR-0024 §10).
    keepManifest: true,
    glyph: `<path d="M32 20 C26 15.5 18 15.5 11 18 V48 C18 45.5 26 45.5 32 50 C38 45.5 46 45.5 53 48 V18 C46 15.5 38 15.5 32 20 Z"/><path d="M32 20 V50"/>`,
  },
  whatsapp: {
    dir: 'apps/products/whatsapp/web',
    name: 'ChatPulse · Relationship insights from your chats',
    shortName: 'ChatPulse',
    description: 'Private WhatsApp chat analytics and relationship insights.',
    bg: '#128c7e',
    fg: '#ffffff',
    theme: '#128c7e',
    glyph: `<path d="M32 13 C19.8 13 11 20.9 11 30.4 C11 35.6 13.6 40.2 17.8 43.3 L15.5 52 L25 47.3 C27.2 47.9 29.6 48.2 32 48.2 C44.2 48.2 53 40.3 53 30.6 C53 20.9 44.2 13 32 13 Z"/><path d="M19 31 H25.5 L28.5 24.5 L34 38 L37.5 31 H45" stroke-width="3.6"/>`,
  },
  basecamp: {
    dir: 'apps/products/basecamp/web',
    name: 'Basecamp · Camping trip planner',
    shortName: 'Basecamp',
    description: 'Plan camping trips: sites, gear, weather and the night sky.',
    bg: '#15803d',
    fg: '#ffffff',
    theme: '#15803d',
    glyph: `<path d="M8 51 H56"/><path d="M14 51 L32 16 L50 51"/><path d="M25.5 51 L32 39 L38.5 51"/><path d="M28 10 L32 16 L36 10"/>`,
  },
  learning: {
    dir: 'apps/products/learning/web',
    name: 'Learning · Remember what you learn',
    shortName: 'Learning',
    description: 'Capture an idea in seconds; review a few each day.',
    bg: '#0f172a',
    fg: '#facc15',
    theme: '#0f172a',
    keepManifest: true,
    glyph: `<path d="M25 41 C20 37.5 17 32.5 17 27 C17 18.7 23.7 12 32 12 C40.3 12 47 18.7 47 27 C47 32.5 44 37.5 39 41 V44 H25 Z"/><path d="M26 50 H38 M28.5 55 H35.5"/><path d="M32 22 V31 M28 27 H36" stroke-width="3.6"/>`,
  },
  'system-design': {
    dir: 'apps/products/system-design/web',
    name: 'System Design · Learn how systems grow',
    shortName: 'System Design',
    description:
      'Step-by-step lessons, practice and a traffic lab for system design.',
    bg: '#f2eadd',
    fg: '#1f1c18',
    theme: '#1f1c18',
    // An isometric cube: one server in a growing system.
    glyph: `<path d="M32 12 L50 22 V42 L32 52 L14 42 V22 Z"/><path d="M14 22 L32 32 L50 22 M32 32 V52"/>`,
  },
  'greenhouse-field': {
    dir: 'apps/products/greenhouse/field',
    name: 'Field log · Greenhouse work log',
    shortName: 'Field log',
    description:
      'Log harvest work per worker in the greenhouse, even with no signal.',
    bg: '#15803d',
    fg: '#ffffff',
    theme: '#15803d',
    android: 'android/app/src/main/res',
    // A tunnel greenhouse with its hoops.
    glyph: `<path d="M10 50 V32 C10 20 20 13 32 13 S54 20 54 32 V50 Z"/><path d="M22 50 V17.5 M32 50 V13 M42 50 V17.5 M10 50 H54"/>`,
  },
  'alarm-engine': {
    dir: 'apps/products/alarm-engine/web',
    name: 'Nightly Alarms · Decision engine',
    shortName: 'Nightly Alarms',
    description: 'Decide tonight’s alarm from your study plan and sleep.',
    bg: '#1e1b4b',
    fg: '#fde68a',
    theme: '#090d16',
    keepManifest: true,
    glyph: `<path d="M38 12 A20 20 0 1 0 52 42 A16 16 0 0 1 38 12 Z" fill="currentColor" stroke="none"/><path d="M46 16 l1.6 3.4 l3.4 1.6 l-3.4 1.6 l-1.6 3.4 l-1.6-3.4 l-3.4-1.6 l3.4-1.6 z" fill="currentColor" stroke="none"/>`,
  },
  sky: {
    dir: 'apps/labs/sky',
    name: 'Sky lab · The night sky over any place',
    shortName: 'Sky Lab',
    description:
      'The night sky over any place and time, from a 3D globe to a campsite.',
    bg: '#0b2545',
    fg: '#ffffff',
    theme: '#0b2545',
    glyph: `<path d="M13 45 L25 31 L37 37 L51 18" stroke-width="3"/><g fill="currentColor" stroke="none"><circle cx="13" cy="45" r="3.6"/><circle cx="25" cy="31" r="4.2"/><circle cx="37" cy="37" r="3.6"/><circle cx="51" cy="18" r="4.8"/><circle cx="18" cy="17" r="2"/><circle cx="47" cy="49" r="2"/></g>`,
  },
  rxjs: {
    dir: 'apps/labs/rxjs',
    name: 'RxJS Practice Pad · Stream lab',
    shortName: 'RxJS Pad',
    description: 'Interactive RxJS stream visualizer and marble testing lab.',
    bg: '#b7178c',
    fg: '#ffffff',
    theme: '#b7178c',
    glyph: `<path d="M8 32 H55"/><path d="M49 26 L55 32 L49 38"/><g fill="currentColor" stroke="none"><circle cx="18" cy="32" r="5.5"/><circle cx="32" cy="32" r="5.5"/></g><path d="M41 26.5 V37.5" stroke-width="4"/>`,
  },
  ngrx: {
    dir: 'apps/labs/ngrx',
    name: 'NgRx State Lab · SignalStore & state flow',
    shortName: 'NgRx Lab',
    description: 'NgRx SignalStore, effects and state transitions, hands-on.',
    bg: '#6d28d9',
    fg: '#ffffff',
    theme: '#6d28d9',
    glyph: `<path d="M47 25 A16 16 0 0 0 17.5 25.5"/><path d="M16 16 V26 H26"/><path d="M17 39 A16 16 0 0 0 46.5 38.5"/><path d="M48 48 V38 H38"/><circle cx="32" cy="32" r="4.5" fill="currentColor" stroke="none"/>`,
  },
};

/** The icon as SVG. rounded: app-icon corners; inset: glyph scale (maskable safe zone). */
function iconSvg(app, { rounded = true, inset = 1 } = {}) {
  const shape = rounded
    ? `<rect width="64" height="64" rx="14" fill="${app.bg}"/>`
    : `<rect width="64" height="64" fill="${app.bg}"/>`;
  const t =
    inset === 1
      ? ''
      : ` transform="translate(32 32) scale(${inset}) translate(-32 -32)"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <title>${app.shortName}</title>
  ${shape}
  <g${t} color="${app.fg}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    ${app.glyph}
  </g>
</svg>
`;
}

/** An .ico holding PNG images (supported by every current browser and Windows). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

function manifest(app, existing) {
  const icons = [
    { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    {
      src: 'icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'icons/maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ];
  if (existing) {
    // Keep the app's own manifest (start_url, shortcuts, share_target...).
    return {
      ...existing,
      theme_color: existing.theme_color ?? app.theme,
      icons,
    };
  }
  return {
    name: app.name,
    short_name: app.shortName,
    description: app.description,
    theme_color: app.theme,
    background_color: app.bg,
    display: 'standalone',
    scope: './',
    start_url: './',
    icons,
  };
}

const HEAD_TAGS = (app) => [
  `<meta name="theme-color" content="${app.theme}" />`,
  `<link rel="icon" href="favicon.ico" sizes="48x48" />`,
  `<link rel="icon" href="favicon.svg" type="image/svg+xml" />`,
  `<link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />`,
  `<link rel="manifest" href="manifest.webmanifest" />`,
  `<meta name="apple-mobile-web-app-title" content="${app.shortName}" />`,
];

/** Replaces the icon/manifest/theme tags in index.html with this app's set. */
function patchIndex(file, app) {
  let html = readFileSync(file, 'utf8');
  const drop =
    /^[ \t]*<(link[^>]*rel="(icon|apple-touch-icon|manifest)"|meta[^>]*name="(theme-color|apple-mobile-web-app-title)")[^>]*>\r?\n/gim;
  html = html.replace(drop, '');
  const indent = (/\n([ \t]*)<\/head>/.exec(html)?.[1] ?? '  ') + '  ';
  const tags = HEAD_TAGS(app)
    .map((t) => indent + t)
    .join('\n');
  html = html.replace(/\n([ \t]*)<\/head>/, `\n${tags}\n$1</head>`);
  writeFileSync(file, html);
}

/** Android's density buckets: launcher icon (48dp) and adaptive layer (108dp) sizes. */
const DENSITIES = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
];

/** Capacitor's splash screens: [folder, width, height]. */
const SPLASHES = [
  ['drawable', 480, 320],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
];

/** The glyph alone on transparent ground, inside the adaptive icon's safe zone. */
function foregroundSvg(app) {
  // 108dp layer; the launcher shows the middle 72dp, the safe circle is 66dp.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <g transform="translate(54 54) scale(0.8) translate(-32 -32)" color="${app.fg}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    ${app.glyph}
  </g>
</svg>
`;
}

/** The round launcher icon: the glyph on a disc. */
function roundSvg(app) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="32" fill="${app.bg}"/>
  <g transform="translate(32 32) scale(0.8) translate(-32 -32)" color="${app.fg}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    ${app.glyph}
  </g>
</svg>
`;
}

/** A splash screen: the app colour with the glyph in the middle. */
function splashSvg(app, width, height) {
  const size = Math.round(Math.min(width, height) * 0.32);
  const x = (width - size) / 2;
  const y = (height - size) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${app.bg}"/>
  <g transform="translate(${x} ${y}) scale(${size / 64})" color="${app.fg}" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    ${app.glyph}
  </g>
</svg>
`;
}

const only = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function png(svg, size, height = size) {
  await page.setViewportSize({ width: size, height });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">` +
      svg.replace('<svg ', `<svg width="${size}" height="${height}" `) +
      `</body></html>`,
  );
  return page.locator('svg').screenshot({ omitBackground: true, type: 'png' });
}

/** Launcher icons and splash screens for a Capacitor Android project. */
async function androidIcons(app) {
  const res = join(app.dir, app.android);
  const square = iconSvg(app);
  const round = roundSvg(app);
  const foreground = foregroundSvg(app);
  for (const [density, icon, layer] of DENSITIES) {
    const dir = join(res, `mipmap-${density}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'ic_launcher.png'), await png(square, icon));
    writeFileSync(join(dir, 'ic_launcher_round.png'), await png(round, icon));
    writeFileSync(
      join(dir, 'ic_launcher_foreground.png'),
      await png(foreground, layer),
    );
  }
  writeFileSync(
    join(res, 'values/ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${app.bg}</color>
</resources>
`,
  );
  for (const [folder, width, height] of SPLASHES) {
    mkdirSync(join(res, folder), { recursive: true });
    writeFileSync(
      join(res, folder, 'splash.png'),
      await png(splashSvg(app, width, height), width, height),
    );
  }
}

for (const [key, app] of Object.entries(APPS)) {
  if (only.length && !only.includes(key)) continue;
  const pub = join(app.dir, 'public');
  mkdirSync(join(pub, 'icons'), { recursive: true });

  const rounded = iconSvg(app);
  const square = iconSvg(app, { rounded: false });
  const maskable = iconSvg(app, { rounded: false, inset: 0.72 });

  writeFileSync(join(pub, 'favicon.svg'), rounded);
  writeFileSync(join(pub, 'icons/icon-192x192.png'), await png(rounded, 192));
  writeFileSync(join(pub, 'icons/icon-512x512.png'), await png(rounded, 512));
  writeFileSync(
    join(pub, 'icons/maskable-512x512.png'),
    await png(maskable, 512),
  );
  writeFileSync(
    join(pub, 'icons/apple-touch-icon.png'),
    await png(square, 180),
  );
  const small = [];
  for (const size of [16, 32, 48])
    small.push({ size, data: await png(rounded, size) });
  writeFileSync(join(pub, 'favicon.ico'), ico(small));

  const manifestFile = join(pub, 'manifest.webmanifest');
  const existing =
    app.keepManifest && existsSync(manifestFile)
      ? JSON.parse(readFileSync(manifestFile, 'utf8'))
      : null;
  writeFileSync(
    manifestFile,
    `${JSON.stringify(manifest(app, existing), null, 2)}\n`,
  );

  patchIndex(join(app.dir, 'src/index.html'), app);
  if (app.android) await androidIcons(app);
  console.log(
    `${key}: icons + manifest${app.android ? ' + Android icons' : ''} written`,
  );
}

await browser.close();
