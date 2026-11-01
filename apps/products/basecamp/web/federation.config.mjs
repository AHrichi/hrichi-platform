import { withNativeFederation } from '@angular-architects/native-federation/config';
import {
  features,
  shared,
  sharedMappings,
  skip,
} from '../../../../tools/federation/shared.mjs';

export default withNativeFederation({
  name: 'product-basecamp',

  exposes: {
    './routes': './apps/products/basecamp/web/src/app/remote.routes.ts',
    './meta': './apps/products/basecamp/web/src/app/remote.meta.ts',
  },

  shared,
  sharedMappings,
  skip,
  features,
});
