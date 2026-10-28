import type { RemoteMeta } from '@ah/platform/federation';

/**
 * Exposed as `./meta`. Operational control center for B2B commercial logistics.
 */
export const remoteMeta: RemoteMeta = {
  id: 'product-dispatch',
  title: 'PulseOps',
  version: '1.0.0',
  capabilities: ['indexeddb'],
};
