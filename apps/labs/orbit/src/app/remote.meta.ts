import type { RemoteMeta } from '@ah/platform/federation';

/** Exposed as `./meta`. The shell won't mount the lab without WebGL and workers. */
export const remoteMeta: RemoteMeta = {
  id: 'lab-orbit',
  title: 'Orbit lab',
  version: '0.1.0',
  capabilities: ['webgl', 'worker'],
};
