const g = globalThis as typeof globalThis & { ngDevMode?: boolean };
if (typeof g.ngDevMode === 'undefined') {
  g.ngDevMode = false;
}

import { initFederation } from '@angular-architects/native-federation';

initFederation(
  {},
  {
    hostRemoteEntry: { url: './remoteEntry.json' },
  },
)
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
