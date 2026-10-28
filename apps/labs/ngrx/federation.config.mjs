import { withNativeFederation } from '@angular-architects/native-federation/config';
import {
  features,
  shared,
  sharedMappings,
  skip,
} from '../../../tools/federation/shared.mjs';

export default withNativeFederation({
  name: 'lab-ngrx',

  // The remote contract (@ah/platform/federation): every remote exposes ./routes and ./meta.
  exposes: {
    './routes': './apps/labs/ngrx/src/app/remote.routes.ts',
    './meta': './apps/labs/ngrx/src/app/remote.meta.ts',
  },

  shared,
  sharedMappings,
  skip,
  features,
});
