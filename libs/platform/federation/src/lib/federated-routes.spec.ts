import {
  Component,
  PLATFORM_ID,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Routes } from '@angular/router';
import { federatedRoutes } from './federated-routes';
import { FederationStore } from './federation.store';
import type { RemoteMeta } from './remote-contract';
import { REMOTE_LOADER, RemoteLoader } from './remote-loader';
import { RemoteUnavailable } from './remote-unavailable';

@Component({ template: 'remote page' })
class RemotePage {}

const remoteRoutes: Routes = [{ path: '', component: RemotePage }];
const remoteMeta: RemoteMeta = {
  id: 'lab-test',
  title: 'Test lab',
  version: '1.2.3',
  capabilities: [],
};

/** A loader that answers ./routes and ./meta like a healthy remote. */
function remote(meta: Partial<RemoteMeta> = {}): RemoteLoader {
  return vi.fn(async (_name: string, exposed: string) =>
    exposed === './meta'
      ? { remoteMeta: { ...remoteMeta, ...meta } }
      : { remoteRoutes },
  ) as unknown as RemoteLoader;
}

function setup(
  loader: RemoteLoader,
  platform: 'browser' | 'server' = 'browser',
) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: REMOTE_LOADER, useValue: loader },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
}

function load(
  options?: Parameters<typeof federatedRoutes>[1],
): Promise<Routes> {
  return TestBed.runInInjectionContext(() =>
    federatedRoutes('lab-test', options)(),
  );
}

const recorded = () => TestBed.inject(FederationStore).entityMap()['lab-test'];

describe('federatedRoutes', () => {
  beforeEach(() =>
    vi.spyOn(console, 'error').mockImplementation(() => undefined),
  );
  afterEach(() => vi.useRealTimers());

  it('returns the remote routes and records the load with its meta', async () => {
    const loader = remote();
    setup(loader);

    await expect(load()).resolves.toBe(remoteRoutes);

    expect(loader).toHaveBeenCalledWith('lab-test', './routes');
    expect(loader).toHaveBeenCalledWith('lab-test', './meta');
    expect(recorded()).toMatchObject({
      status: 'loaded',
      meta: remoteMeta,
      failure: null,
    });
    expect(recorded().durationMs).toBeGreaterThanOrEqual(0);
  });

  it('falls back to RemoteUnavailable when the remote rejects', async () => {
    setup(() => Promise.reject(new Error('404')));

    const routes = await load();

    expect(routes).toEqual([
      {
        path: '**',
        component: RemoteUnavailable,
        data: { remoteName: 'lab-test' },
      },
    ]);
    expect(recorded()).toMatchObject({
      status: 'failed',
      failure: { kind: 'error', message: '404' },
    });
  });

  it('falls back when the remote breaks the contract', async () => {
    setup(<T>() => Promise.resolve({ somethingElse: true } as T));

    const [route] = await load();

    expect(route.component).toBe(RemoteUnavailable);
    expect(recorded().failure?.kind).toBe('contract');
  });

  it('falls back when the remote is slower than the timeout', async () => {
    vi.useFakeTimers();
    setup(() => new Promise(() => undefined));

    const routes = load({ timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(50);

    expect((await routes)[0].component).toBe(RemoteUnavailable);
    expect(recorded().failure?.kind).toBe('timeout');
  });

  it('falls back when the browser lacks a capability the remote needs', async () => {
    // jsdom has no WebGL2.
    setup(remote({ capabilities: ['webgl'] }));

    const [route] = await load();

    expect(route.component).toBe(RemoteUnavailable);
    expect(recorded()).toMatchObject({
      status: 'failed',
      failure: { kind: 'capability', missing: ['webgl'] },
      meta: { version: '1.2.3' },
    });
  });

  it('never loads a remote while prerendering on the server', async () => {
    const loader = vi.fn();
    setup(loader, 'server');

    await expect(load()).resolves.toEqual([]);
    expect(loader).not.toHaveBeenCalled();
  });
});
