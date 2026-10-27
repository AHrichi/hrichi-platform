import { remoteMeta } from './remote.meta';
import { remoteRoutes } from './remote.routes';

describe('lab-sky remote contract', () => {
  it('declares what the shell must check before mounting it', () => {
    expect(remoteMeta).toMatchObject({
      id: 'lab-sky',
      capabilities: [],
    });
  });

  it('lazy-loads the lab page', () => {
    expect(remoteRoutes[0].loadComponent).toBeTypeOf('function');
  });
});
