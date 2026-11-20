import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';
import { SystemDesignRuntime } from '../../store/system-design-runtime';
import { SYSTEM_DESIGN_ROUTES } from '../../system-design.routes';
import { cheatSectionId } from './cheatsheet-screen';

const settle = async (harness: RouterTestingHarness) => {
  await new Promise((r) => setTimeout(r, 30));
  await harness.fixture.whenStable();
};

describe('cheatsheet screens', () => {
  let db: SystemDesignDatabase;

  beforeEach(() => {
    db = new SystemDesignDatabase(`sd-cheat-${Math.random()}`);
    const local = new SystemDesignLocalStore(db);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(SYSTEM_DESIGN_ROUTES),
        {
          provide: SystemDesignRuntime,
          useValue: { open: () => Promise.resolve(local) },
        },
      ],
    });
  });

  afterEach(() => db.close());

  it('lists one card per module, each linking to its sheet', async () => {
    const harness = await RouterTestingHarness.create('/cheatsheets');
    await settle(harness);
    const root = harness.routeNativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent).toContain('Cheatsheets');
    const links = [
      ...root.querySelectorAll<HTMLAnchorElement>('.module-card a'),
    ];
    expect(links).toHaveLength(9);
    expect(links[0].getAttribute('href')).toBe('/cheatsheets/foundations');
    expect(links[2].textContent).toContain('Data & Storage Cheatsheet');
    expect(root.querySelector('.module-card')?.textContent).toContain(
      '01. Foundations',
    );

    links[1].click();
    await settle(harness);
    expect(TestBed.inject(Router).url).toBe('/cheatsheets/scaling');
  });

  it('renders every section kind and links patterns to their lessons', async () => {
    const harness = await RouterTestingHarness.create('/cheatsheets/data');
    await settle(harness);
    const root = harness.routeNativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent).toContain(
      'Data & Storage Cheatsheet',
    );
    expect(root.querySelector('.breadcrumb')?.textContent).toContain(
      'Cheatsheets / 03. Data & Storage',
    );
    const kinds = new Set(
      [...root.querySelectorAll('sd-cheat-section')].map((el) =>
        el.getAttribute('data-kind'),
      ),
    );
    expect(kinds).toEqual(new Set(['numbers', 'table', 'list', 'pattern']));

    const isolation = root.querySelector(
      `#${cheatSectionId('Isolation Levels vs Anomalies')}`,
    );
    expect(isolation?.querySelectorAll('tbody tr')).toHaveLength(5);

    const lessonLinks = [
      ...root.querySelectorAll<HTMLAnchorElement>('a.lesson-link'),
    ];
    expect(lessonLinks.map((a) => a.getAttribute('href'))).toEqual([
      '/learn/replication/1',
      '/learn/indexes/1',
      '/learn/transactions/1',
    ]);
    expect(lessonLinks[0].textContent).toContain('Lesson: Replication →');

    // One table of contents pill per section.
    expect(root.querySelectorAll('.toc-pill')).toHaveLength(
      root.querySelectorAll('sd-cheat-section').length,
    );
    expect(root.querySelector('.back-link')?.getAttribute('href')).toBe(
      '/cheatsheets',
    );
  });

  it('prints through the window', async () => {
    const print = vi.fn();
    const original = window.print;
    window.print = print;
    try {
      const harness = await RouterTestingHarness.create(
        '/cheatsheets/foundations',
      );
      await settle(harness);
      const root = harness.routeNativeElement as HTMLElement;
      root.querySelector<HTMLButtonElement>('.print-btn')?.click();
      expect(print).toHaveBeenCalledTimes(1);
    } finally {
      window.print = original;
    }
  });

  it('shows a way back for an unknown module', async () => {
    const harness = await RouterTestingHarness.create('/cheatsheets/nope');
    await settle(harness);
    const root = harness.routeNativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain(
      'No such cheatsheet',
    );
    expect(root.querySelector('.back-link')?.getAttribute('href')).toBe(
      '/cheatsheets',
    );
  });

  it('builds stable section ids from titles', () => {
    expect(cheatSectionId('Powers of Two & Storage Units')).toBe(
      'sd-cheat-powers-of-two-storage-units',
    );
    expect(cheatSectionId('≈')).toBe('sd-cheat-section');
  });
});
