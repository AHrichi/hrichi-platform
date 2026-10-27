import type { RemoteMeta } from '@ah/platform/federation';

/**
 * Exposed as `./meta`. Requires IndexedDB for client-side financial state.
 */
export const remoteMeta: RemoteMeta = {
  id: 'product-strategy',
  title: 'StrategyApp',
  version: '1.0.0',
  capabilities: ['indexeddb'],
};
