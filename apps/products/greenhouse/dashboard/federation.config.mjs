import { withNativeFederation } from '@angular-architects/native-federation/config';
import {
  features,
  shared,
  sharedMappings,
  skip,
} from '../../../../tools/federation/shared.mjs';

export default withNativeFederation({
  name: 'product-greenhouse',

  exposes: {
    './routes': './apps/products/greenhouse/dashboard/src/app/remote.routes.ts',
    './meta': './apps/products/greenhouse/dashboard/src/app/remote.meta.ts',
  },

  shared,
  sharedMappings,
  skip,
  features,
});
