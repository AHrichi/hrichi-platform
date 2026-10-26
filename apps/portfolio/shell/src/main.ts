import { initFederation } from '@angular-architects/native-federation';

initFederation('federation.manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
})
  .catch((err) => {
    // The shell still boots without federation; remote routes show their fallback.
    console.error('[federation] init failed', err);
    return undefined;
  })
  .then((federation) =>
    import('./bootstrap').then((m) => m.bootstrap(federation)),
  )
  .catch((err) => console.error(err));
