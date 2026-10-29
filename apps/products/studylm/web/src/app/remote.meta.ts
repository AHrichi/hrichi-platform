import type { RemoteMeta } from '@ah/platform/federation';

/**
 * Exposed as `./meta`. Grounded AI multi-tier study & drill engine inspired by NotebookLM.
 */
export const remoteMeta: RemoteMeta = {
  id: 'product-studylm',
  title: 'StudyLM',
  version: '1.0.0',
  capabilities: ['indexeddb'],
};
