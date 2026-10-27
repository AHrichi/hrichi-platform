// Refreshes the bundled orbit snapshot: CelesTrak's "visual" group (the
// brightest satellites, ISS and Tiangong included), in OMM JSON format.
// The Orbit API falls back to it when its database is empty and CelesTrak
// can't be asked yet; the Orbit lab renders it while the API wakes.
//
// One run makes exactly one request. CelesTrak allows one download per data
// update (about every two hours); don't run this in a loop or in CI.
//
// Usage: node tools/scripts/orbit-snapshot.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const url =
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json';
const outputs = ['apps/orbit-api/src/main/resources/catalog-snapshot.json'];

const response = await fetch(url, {
  headers: {
    'User-Agent':
      'hrichi-platform orbit-snapshot (+https://github.com/AHrichi/hrichi-platform)',
  },
  signal: AbortSignal.timeout(60_000),
});
if (!response.ok) {
  // 403 means this address already downloaded the group in this window.
  console.error(
    `CelesTrak answered HTTP ${response.status}; try again in two hours.`,
  );
  process.exit(1);
}
const satellites = await response.json();
const snapshot = {
  fetchedAt: new Date().toISOString(),
  source: 'CelesTrak GP data, GROUP=visual (https://celestrak.org)',
  satellites,
};
for (const output of outputs) {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(snapshot)}\n`);
}
console.log(`Wrote ${satellites.length} satellites to ${outputs.join(', ')}`);
