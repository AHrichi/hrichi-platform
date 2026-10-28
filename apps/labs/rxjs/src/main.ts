const globalScope = globalThis as unknown as { ngDevMode?: boolean };
if (typeof globalScope.ngDevMode === 'undefined') {
  globalScope.ngDevMode = false;
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
