import type { RemoteMeta } from '@ah/platform/federation';

/** Exposed as `./meta`. The Learning Engine: capture, daily review, sync (ADR-0024). */
export const remoteMeta: RemoteMeta = {
  id: 'product-learning',
  title: 'Learning',
  version: '1.0.0',
  capabilities: ['indexeddb'],
};
