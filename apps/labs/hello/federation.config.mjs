import { withNativeFederation } from '@angular-architects/native-federation/config';
import { features, shared, skip } from '../../../tools/federation/shared.mjs';

export default withNativeFederation({
  name: 'lab-hello',

  // The remote contract (@ah/platform/federation): every remote exposes ./routes and ./meta.
  exposes: {
    './routes': './apps/labs/hello/src/app/remote.routes.ts',
    './meta': './apps/labs/hello/src/app/remote.meta.ts',
  },

  shared,
  skip,
  features,
});
