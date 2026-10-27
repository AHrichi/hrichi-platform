// Builds the Sky lab's star catalog from d3-celestial's data (BSD-3-Clause,
// © Olaf Frohn; stars from the XHIP catalogue, Anderson & Francis 2012),
// downloaded at a pinned commit and checked against known hashes (ADR-0016).
// The output is committed, so builds never touch the network.
//
// Writes, with stars sorted brightest first so an index means the same star
// everywhere:
//   libs/three/scenes/sky/src/generated/stars.json        ra, dec, mag, B−V per star
//   libs/three/scenes/sky/src/generated/lines.json        constellation figures
//   libs/labs/sky/domain/src/generated/constellations.json  names and label positions
//   libs/labs/sky/domain/src/generated/star-names.json      named and lettered stars
//
// Usage: node tools/scripts/sky-catalog.mjs
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const commit = '7e720a3de062059d4c5400a379146a601d9010e0';
const files = {
  'stars.6.json':
    '0297b8fa3adfbce1dc26566f61c4abcc1df4f29c6a28729ca06b56d1c6d25602',
  'constellations.lines.json':
    '294f66bef5d5cf50b1e17f16d2efa1d97a15131612c68dd935adef6e7373e13c',
  'constellations.json':
    'ab4ae692027cbc042c0d6791a84456a65eb7c55656107fd00c58ff6e55d4d8b2',
  'starnames.json':
    '19c84bc885f8a97c3b8e1f6a380084c575a9758dedfe35256e911a823ec3a695',
};

async function fetchWithRetries(url, attempts = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

async function download(name) {
  const url = `https://raw.githubusercontent.com/ofrohn/d3-celestial/${commit}/data/${name}`;
  const response = await fetchWithRetries(url);
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  const body = Buffer.from(await response.arrayBuffer());
  const hash = createHash('sha256').update(body).digest('hex');
  if (hash !== files[name]) {
    throw new Error(`${name}: SHA-256 ${hash}, expected ${files[name]}`);
  }
  return JSON.parse(body.toString('utf8'));
}

const [stars, lines, constellations, starNames] = await Promise.all(
  Object.keys(files).map(download),
);

/** d3-celestial stores right ascension as a longitude in −180…180. */
const ra = (longitude) => (longitude < 0 ? longitude + 360 : longitude);
const round = (value, digits) => Number(value.toFixed(digits));

const sorted = [...stars.features].sort(
  (a, b) => a.properties.mag - b.properties.mag,
);
const starData = sorted.flatMap((star) => {
  const [longitude, dec] = star.geometry.coordinates;
  const bv = Number.parseFloat(star.properties.bv);
  return [
    round(ra(longitude), 3),
    round(dec, 3),
    round(star.properties.mag, 2),
    round(Number.isFinite(bv) ? bv : 0.6, 2),
  ];
});

// Proper names, and Greek letters for the stars bright enough to need them.
const names = sorted.flatMap((star, index) => {
  const entry = starNames[star.id];
  if (!entry || !(entry.name || (entry.bayer && star.properties.mag <= 4))) {
    return [];
  }
  const [longitude, dec] = star.geometry.coordinates;
  return [
    {
      index,
      name: entry.name || null,
      bayer: entry.bayer || null,
      constellation: entry.c,
      ra: round(ra(longitude), 3),
      dec: round(dec, 3),
      mag: round(star.properties.mag, 2),
    },
  ];
});

const figures = lines.features.map((figure) => ({
  id: figure.id,
  lines: figure.geometry.coordinates.map((line) =>
    line.flatMap(([longitude, dec]) => [
      round(ra(longitude), 3),
      round(dec, 3),
    ]),
  ),
}));

const labels = constellations.features.map((constellation) => ({
  id: constellation.id,
  name: constellation.properties.name,
  genitive: constellation.properties.gen,
  ra: round(ra(constellation.geometry.coordinates[0]), 2),
  dec: round(constellation.geometry.coordinates[1], 2),
}));

const source = `d3-celestial ${commit.slice(0, 7)} (BSD-3-Clause, © Olaf Frohn); stars from XHIP (Anderson & Francis 2012)`;
function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ source, ...data })}\n`);
  console.log(`Wrote ${path}`);
}

write('libs/three/scenes/sky/src/generated/stars.json', {
  count: sorted.length,
  stars: starData,
});
write('libs/three/scenes/sky/src/generated/lines.json', { figures });
write('libs/labs/sky/domain/src/generated/constellations.json', {
  constellations: labels,
});
write('libs/labs/sky/domain/src/generated/star-names.json', { names });
