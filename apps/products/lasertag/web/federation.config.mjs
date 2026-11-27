import { withNativeFederation } from '@angular-architects/native-federation/config';
import {
  features,
  shared,
  sharedMappings,
  skip,
} from '../../../../tools/federation/shared.mjs';

export default withNativeFederation({
  name: 'product-lasertag',

  exposes: {
    './routes': './apps/products/lasertag/web/src/app/remote.routes.ts',
    './meta': './apps/products/lasertag/web/src/app/remote.meta.ts',
  },

  shared,
  sharedMappings,
  skip,
  features,
});
