const g = globalThis as typeof globalThis & { ngDevMode?: boolean };
if (typeof g.ngDevMode === 'undefined') {
  g.ngDevMode = false;
}

import { initFederation } from '@angular-architects/native-federation';

/**
 * A missing or broken manifest must not take the shell down: initFederation
 * also writes the import map for the shell's own shared packages, so it has
 * to run even when no remote is reachable (remote routes then show their fallback).
 */
async function loadManifest(): Promise<Record<string, string>> {
  try {
    const response = await fetch('federation.manifest.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(
      '[federation] manifest unavailable; starting without remotes',
      err,
    );
    return {};
  }
}

loadManifest()
  .then((manifest) =>
    initFederation(manifest, {
      hostRemoteEntry: { url: './remoteEntry.json' },
    }),
  )
  .then((federation) =>
    import('./bootstrap').then((m) => m.bootstrap(federation)),
  )
  .catch((err) => console.error(err));
