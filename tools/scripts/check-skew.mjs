// Fails when a deployed remote shares a package at a different version than
// the deployed shell (ADR-0012). Remotes deploy independently, and
// strictVersion singletons make the shell's copy win at runtime, so skew
// means a remote runs against code it wasn't built with. The Federation
// Inspector shows the same comparison in the browser.
//
// Usage: node tools/scripts/check-skew.mjs [site URL]   (default: site.json url)
import { readFileSync } from 'node:fs';

const site =
  process.argv[2] ??
  JSON.parse(readFileSync('libs/shared/content/src/lib/site.json', 'utf8')).url;

async function json(url) {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  return response.json();
}

const versions = (entry) =>
  new Map(entry.shared.map((s) => [s.packageName, s.version]));

const shell = versions(await json(new URL('remoteEntry.json', site)));
const manifest = await json(new URL('federation.manifest.json', site));

const problems = [];
for (const [remote, entryUrl] of Object.entries(manifest)) {
  let entry;
  try {
    entry = await json(entryUrl);
  } catch (error) {
    problems.push(`${remote}: unreachable (${error.message})`);
    continue;
  }
  for (const [name, version] of versions(entry)) {
    const expected = shell.get(name);
    if (expected && version && version !== expected) {
      problems.push(`${remote}: ${name} ${version}, shell has ${expected}`);
    }
  }
  console.log(`${remote}: ${versions(entry).size} shared packages checked`);
}

if (problems.length) {
  console.error(
    `Shared dependency skew on ${site}:\n  ${problems.join('\n  ')}`,
  );
  process.exit(1);
}
console.log(`No shared dependency skew on ${site}`);
