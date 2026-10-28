import { describe, it, expect } from 'vitest';
import { remoteMeta } from './remote.meta';
import { remoteRoutes } from './remote.routes';

describe('product-dispatch remote contract', () => {
  it('declares what the shell must check before mounting it', () => {
    expect(remoteMeta).toMatchObject({
      id: 'product-dispatch',
      title: 'PulseOps',
      capabilities: ['indexeddb'],
    });
  });

  it('lazy-loads the dispatch feature routes', () => {
    expect(remoteRoutes[0].loadChildren).toBeTypeOf('function');
  });
});
