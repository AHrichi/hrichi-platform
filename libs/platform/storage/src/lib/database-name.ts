import type { AppMode } from '@ah/platform/app-mode';

/**
 * The IndexedDB database an app keeps its data in: its own name when it runs
 * standalone, and `ah-demo-<app>` inside the portfolio, so trying a demo never
 * opens someone's real data (ADR-0002, docs/architecture.md §2.3).
 *
 * Until November 2026 the portfolio's demos opened their standalone names by
 * mistake. A browser that already has such a database, and no demo one, keeps
 * using it, so nothing saved in the portfolio is hidden. Nothing is copied:
 * on the portfolio's origin that database only ever held the demo's data.
 */
export async function databaseName(
  mode: AppMode,
  app: string,
  standaloneName: string,
): Promise<string> {
  if (mode === 'standalone') {
    return standaloneName;
  }
  const demoName = `ah-demo-${app}`;
  if (await databaseExists(demoName)) {
    return demoName;
  }
  return (await databaseExists(standaloneName)) ? standaloneName : demoName;
}

/**
 * Whether this origin has a database called `name`. Opening one that doesn't
 * exist creates it, so that upgrade is aborted, which leaves nothing behind.
 */
export function databaseExists(name: string): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(name);
      request.onupgradeneeded = () => request.transaction?.abort();
      request.onsuccess = () => {
        request.result.close();
        resolve(true);
      };
      // Our own abort, or storage that can't be opened: either way, not there.
      request.onerror = (event) => {
        event.preventDefault();
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}
