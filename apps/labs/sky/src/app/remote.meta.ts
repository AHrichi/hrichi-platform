import type { RemoteMeta } from '@ah/platform/federation';

/**
 * Exposed as `./meta`. The lab needs no special browser feature: without
 * WebGL it still describes the night in text.
 */
export const remoteMeta: RemoteMeta = {
  id: 'lab-sky',
  title: 'Sky lab',
  version: '0.2.0',
  capabilities: [],
};
