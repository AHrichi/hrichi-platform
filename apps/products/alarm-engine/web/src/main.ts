const g = globalThis as typeof globalThis & { ngDevMode?: boolean };
if (typeof g.ngDevMode === 'undefined') {
  g.ngDevMode = false;
}

import('./bootstrap').catch((err) => console.error(err));
