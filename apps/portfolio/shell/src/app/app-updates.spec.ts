import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { FederationStore } from '@ah/platform/federation';
import { Subject } from 'rxjs';
import { AppUpdates } from './app-updates';

const meta = {
  id: 'lighting',
  title: 'LuxPath',
  version: '1',
  capabilities: [],
};

/** Answers the manifest and build-info.json, with the remote's live commit. */
function stubFetch(live: { sha: string }) {
  const fetch = vi.fn(async (url: string | URL) =>
    String(url).endsWith('federation.manifest.json')
      ? new Response(
          JSON.stringify({ 'product-lighting': 'https://lighting.example/' }),
        )
      : new Response(
          JSON.stringify({ app: 'product-lighting', sha: live.sha }),
        ),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

function setup(worker?: Partial<SwUpdate>) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      ...(worker ? [{ provide: SwUpdate, useValue: worker }] : []),
    ],
  });
  return TestBed.inject(AppUpdates);
}

async function settle() {
  for (let i = 0; i < 5; i++) {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
  }
}

describe('AppUpdates', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('offers a reload once a loaded remote has a newer build live', async () => {
    const live = { sha: 'aaa' };
    const fetch = stubFetch(live);
    const updates = setup();
    updates.start();
    const federation = TestBed.inject(FederationStore);
    federation.recordStart('product-lighting', 0);
    federation.recordLoaded('product-lighting', meta, 10);
    await settle();

    await updates.check();
    expect(updates.visible()).toBe(false);

    live.sha = 'bbb';
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 10 * 60 * 1000);
    await updates.check();
    expect(updates.state()).toBe('ready');
    expect(fetch).toHaveBeenCalledWith(
      new URL('https://lighting.example/build-info.json'),
      { cache: 'no-store' },
    );

    updates.dismiss();
    expect(updates.visible()).toBe(false);
  });

  it('offers a reload when the service worker has the next shell ready', async () => {
    stubFetch({ sha: 'aaa' });
    const versionUpdates = new Subject<VersionEvent>();
    const updates = setup({
      isEnabled: true,
      versionUpdates,
      unrecoverable: new Subject(),
      checkForUpdate: async () => false,
    });
    updates.start();

    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    });
    expect(updates.state()).toBe('ready');
    expect(updates.visible()).toBe(true);
  });
});
