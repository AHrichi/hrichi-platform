import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { n8nWebhookUrl, SiteConfigService } from './site-config';

function setup(platform: 'browser' | 'server' = 'browser') {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return TestBed.inject(SiteConfigService);
}

describe('SiteConfigService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads site-config.json once and fills missing keys with null', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ orbitApiUrl: 'https://orbit.example' })),
    );
    vi.stubGlobal('fetch', fetch);
    const service = setup();

    await expect(service.load()).resolves.toEqual({
      apiUrl: null,
      turnstileSiteKey: null,
      orbitApiUrl: 'https://orbit.example',
      n8nUrl: null,
      learningEdgeUrl: null,
    });
    await service.load();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('turns every backend off when the file is missing or unreadable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    );

    await expect(setup().load()).resolves.toEqual({
      apiUrl: null,
      turnstileSiteKey: null,
      orbitApiUrl: null,
      n8nUrl: null,
      learningEdgeUrl: null,
    });
  });

  it('never fetches while prerendering', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    await expect(setup('server').load()).resolves.toMatchObject({
      orbitApiUrl: null,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('builds n8n webhook URLs only when n8n is configured', () => {
    const config = {
      apiUrl: null,
      turnstileSiteKey: null,
      orbitApiUrl: null,
      n8nUrl: 'https://n8n.example/',
    };
    expect(n8nWebhookUrl(config, 'study-synthesizer')).toBe(
      'https://n8n.example/webhook/study-synthesizer',
    );
    expect(n8nWebhookUrl({ ...config, n8nUrl: null }, 'x')).toBeNull();
  });
});
