import type { RemoteMeta } from '@ah/platform/federation';

/** Exposed as `./meta`. The System Design course (ADR-0025). */
export const remoteMeta: RemoteMeta = {
  id: 'product-system-design',
  title: 'System Design',
  version: '0.1.0',
  capabilities: ['indexeddb'],
};
