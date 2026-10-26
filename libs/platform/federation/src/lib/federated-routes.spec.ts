import {
  Component,
  PLATFORM_ID,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Routes } from '@angular/router';
import { federatedRoutes } from './federated-routes';
import { REMOTE_LOADER, RemoteLoader } from './remote-loader';
import { RemoteUnavailable } from './remote-unavailable';

@Component({ template: 'remote page' })
class RemotePage {}

const remoteRoutes: Routes = [{ path: '', component: RemotePage }];

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

describe('federatedRoutes', () => {
  beforeEach(() =>
    vi.spyOn(console, 'error').mockImplementation(() => undefined),
  );
  afterEach(() => vi.useRealTimers());

  it('returns the remote routes from ./routes', async () => {
    const loader = vi.fn().mockResolvedValue({ remoteRoutes });
    setup(loader);

    await expect(load()).resolves.toBe(remoteRoutes);
    expect(loader).toHaveBeenCalledWith('lab-test', './routes');
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
  });

  it('falls back when the remote breaks the contract', async () => {
    setup(<T>() => Promise.resolve({ somethingElse: true } as T));

    const [route] = await load();

    expect(route.component).toBe(RemoteUnavailable);
  });

  it('falls back when the remote is slower than the timeout', async () => {
    vi.useFakeTimers();
    setup(() => new Promise(() => undefined));

    const routes = load({ timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(50);

    expect((await routes)[0].component).toBe(RemoteUnavailable);
  });

  it('never loads a remote while prerendering on the server', async () => {
    const loader = vi.fn();
    setup(loader, 'server');

    await expect(load()).resolves.toEqual([]);
    expect(loader).not.toHaveBeenCalled();
  });
});
