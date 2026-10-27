import { remoteMeta } from './remote.meta';
import { remoteRoutes } from './remote.routes';

describe('lab-rxjs remote contract', () => {
  it('declares what the shell must check before mounting it', () => {
    expect(remoteMeta).toMatchObject({
      id: 'lab-rxjs',
      capabilities: [],
    });
  });

  it('lazy-loads the lab routes', () => {
    expect(remoteRoutes[0].loadChildren).toBeTypeOf('function');
  });
});
