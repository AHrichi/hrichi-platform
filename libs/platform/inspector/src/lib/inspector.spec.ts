import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FederationStore } from '@ah/platform/federation';
import { Inspector } from './inspector';

vi.mock('web-vitals', () => {
  const report =
    (name: string, value: number) => (callback: (metric: object) => void) =>
      callback({ name, value, rating: 'good' });
  return {
    onCLS: report('CLS', 0.01),
    onFCP: report('FCP', 420),
    onINP: () => undefined,
    onLCP: report('LCP', 900),
    onTTFB: report('TTFB', 80),
  };
});

const files: Record<string, unknown> = {
  'federation.manifest.json': {
    'lab-hello': 'https://lab-hello.example/remoteEntry.json',
  },
  'build-info.json': {
    app: 'shell',
    sha: '1111111aaaa',
    builtAt: '2026-10-27T08:00:00Z',
  },
  'https://lab-hello.example/build-info.json': {
    app: 'lab-hello',
    sha: '2222222bbbb',
    builtAt: '2026-10-27T08:05:00Z',
  },
  'remoteEntry.json': {
    name: 'shell',
    shared: [{ packageName: 'rxjs', version: '7.8.2' }],
  },
  'https://lab-hello.example/remoteEntry.json': {
    name: 'lab-hello',
    shared: [{ packageName: 'rxjs', version: '7.8.1' }],
  },
};

async function setup() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url in files
        ? new Response(JSON.stringify(files[url]))
        : new Response('', { status: 404 }),
    ),
  );
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const federation = TestBed.inject(FederationStore);
  federation.recordStart('lab-hello', 100);
  federation.recordLoaded(
    'lab-hello',
    { id: 'lab-hello', title: 'Hello', version: '0.0.0', capabilities: [] },
    342,
  );
  const fixture = TestBed.createComponent(Inspector);
  fixture.componentRef.setInput('stores', {
    PreferencesStore: () => ({ audience: 'engineer' }),
  });
  const element = fixture.nativeElement as HTMLElement;
  const settle = async () => {
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
    }
  };
  await settle();
  const openTab = async (name: string) => {
    (
      [...element.querySelectorAll('[role="tab"]')].find((tab) =>
        tab.textContent?.includes(name),
      ) as HTMLButtonElement
    ).click();
    await settle();
  };
  return { fixture, element, openTab };
}

describe('Inspector', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists each remote with its status, load time and build', async () => {
    const { element } = await setup();

    const row = element.querySelector('tbody tr');
    expect(row?.textContent).toContain('lab-hello');
    expect(row?.textContent).toContain('loaded');
    expect(row?.textContent).toContain('242 ms');
    expect(row?.textContent).toContain('2222222');
    expect(element.textContent).toContain('1111111');
  });

  it('flags shared packages whose versions differ from the shell', async () => {
    const { element, openTab } = await setup();

    await openTab('Shared deps');

    const skewed = element.querySelector('tr.skew');
    expect(skewed?.textContent).toContain('rxjs');
    expect(skewed?.textContent).toContain('7.8.1');
  });

  it('shows store snapshots and Web Vitals', async () => {
    const { element, openTab } = await setup();

    await openTab('State');
    expect(element.querySelector('pre')?.textContent).toContain(
      '"audience": "engineer"',
    );

    await openTab('Web Vitals');
    expect(element.textContent).toContain('900 ms');
    expect(element.textContent).toContain('0.010');
  });

  it('closes on Escape', async () => {
    const { fixture, element } = await setup();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed).toHaveBeenCalled();
  });
});
