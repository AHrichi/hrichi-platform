import { withNativeFederation } from '@angular-architects/native-federation/config';
import {
  features,
  shared,
  sharedMappings,
  skip,
} from '../../../../tools/federation/shared.mjs';

export default withNativeFederation({
  name: 'product-system-design',

  exposes: {
    './routes': './apps/products/system-design/web/src/app/remote.routes.ts',
    './meta': './apps/products/system-design/web/src/app/remote.meta.ts',
  },

  shared,
  sharedMappings,
  skip,
  features,
});
