import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';
import { LAB_CHALLENGES } from '@ah/products/system-design/domain';
import { SYSTEM_DESIGN_ROUTES } from '../../system-design.routes';
import { SystemDesignRuntime } from '../../store/system-design-runtime';
import { goalSummary } from './lab-home';
import { rpsFromSlider, RPS_STEPS, sliderFromRps } from './lab-screen';

const settle = async (harness: RouterTestingHarness) => {
  await new Promise((r) => setTimeout(r, 30));
  await harness.fixture.whenStable();
};

async function open(url: string, local?: SystemDesignLocalStore) {
  const db = new SystemDesignDatabase(`sd-lab-screen-${Math.random()}`);
  const store = local ?? new SystemDesignLocalStore(db);
  TestBed.configureTestingModule({
    providers: [
      provideRouter(SYSTEM_DESIGN_ROUTES),
      {
        provide: SystemDesignRuntime,
        useValue: { open: () => Promise.resolve(store) },
      },
    ],
  });
  const harness = await RouterTestingHarness.create(url);
  await settle(harness);
  return {
    db,
    local: store,
    harness,
    root: harness.routeNativeElement as HTMLElement,
  };
}

const button = (root: HTMLElement, text: string) => {
  const found = [...root.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(text),
  );
  if (!found) throw new Error(`no button "${text}"`);
  return found;
};

describe('LabHome', () => {
  it('lists the six challenges with goals and statuses, and the sandbox', async () => {
    const db = new SystemDesignDatabase(`sd-lab-home-${Math.random()}`);
    const local = new SystemDesignLocalStore(db);
    await local.putDesign({
      id: 'first-users',
      design: LAB_CHALLENGES[0].starter,
      updatedAt: '2026-11-20T10:00:00.000Z',
    });
    const { root } = await open('/lab', local);

    expect(root.querySelector('h1')?.textContent).toContain('Design Lab');
    const cards = root.querySelectorAll('.card');
    expect(cards).toHaveLength(6);
    expect(cards[0].querySelector('.status')?.textContent?.trim()).toBe(
      'In progress',
    );
    expect(cards[1].querySelector('.status')?.textContent?.trim()).toBe(
      'Not started',
    );
    expect(cards[0].querySelector('a')?.getAttribute('href')).toBe(
      '/lab/first-users',
    );
    expect(root.querySelector('.sandbox-link')?.getAttribute('href')).toBe(
      '/lab/free',
    );
    db.close();
  });

  it('summarises goals in plain words', () => {
    expect(goalSummary(LAB_CHALLENGES[0])).toEqual([
      '800 rps',
      'p95 ≤ 150 ms',
      'cost ≤ 10',
    ]);
    expect(goalSummary(LAB_CHALLENGES[4])).toContain('survives a failure');
  });
});

describe('LabScreen', () => {
  it('solves first-users from the palette; the goals tick and the verdict reads solved', async () => {
    const { db, harness, root } = await open('/lab/first-users');

    expect(root.querySelector('h1')?.textContent).toContain('First users');
    expect(
      root.querySelector('[data-testid="lab-verdict"]')?.textContent,
    ).toContain('Not solved yet.');
    expect(
      root.querySelector('[data-goal-id="maxP95"]')?.getAttribute('data-met'),
    ).toBe('false');
    expect(
      (root.querySelector('fieldset.traffic') as HTMLFieldSetElement).disabled,
    ).toBe(true);

    button(root, 'Load balancer').click();
    await settle(harness);
    button(root, 'Web server').click();
    await settle(harness);

    expect(
      root.querySelector('[data-goal-id="maxP95"]')?.getAttribute('data-met'),
    ).toBe('true');
    expect(
      root.querySelector('[data-testid="lab-verdict"]')?.textContent,
    ).toContain('Solved: every goal is met.');
    expect(root.querySelector('sd-hud')?.textContent).toContain('118 ms');
    expect(root.querySelectorAll('.node-slot[role="button"]')).toHaveLength(5);
    db.close();
  });

  it('selects a node by keyboard and edits it in the inspector', async () => {
    const { db, harness, root } = await open('/lab/free');
    expect(root.querySelector('h1')?.textContent).toContain('Sandbox');
    expect(root.textContent).toContain('Select a component in the diagram');

    const server = root.querySelector(
      '.node-slot[data-slot-id="server-1"]',
    ) as SVGGElement;
    expect(server.getAttribute('tabindex')).toBe('0');
    expect(server.getAttribute('aria-label')).toContain('Web server');
    server.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await settle(harness);

    expect(root.querySelector('#lab-inspector-heading')?.textContent).toContain(
      'Web server',
    );
    expect(
      root.querySelector('[data-testid="lab-load"]')?.textContent,
    ).toContain('80% load');
    (
      root.querySelector('[aria-label="More instances"]') as HTMLButtonElement
    ).click();
    await settle(harness);
    expect(root.querySelector('.stepper-value')?.textContent?.trim()).toBe('2');
    expect(
      root.querySelector('[data-testid="lab-load"]')?.textContent,
    ).toContain('40% load');

    const toggle = root.querySelector('[role="switch"]') as HTMLButtonElement;
    toggle.click();
    await settle(harness);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(root.querySelector('.problem-list')?.textContent).toContain(
      'Web server is down',
    );

    (
      root.querySelector(
        '[aria-label="Remove link to Database"]',
      ) as HTMLButtonElement
    ).click();
    await settle(harness);
    const select = root.querySelector('#lab-connect') as HTMLSelectElement;
    select.value = 'database-1';
    select.dispatchEvent(new Event('change'));
    await settle(harness);
    button(root, 'Connect').click();
    await settle(harness);
    expect(root.querySelector('.links')?.textContent).toContain('Database');

    button(root, 'Delete Web server').click();
    await settle(harness);
    expect(
      root.querySelector('.node-slot[data-slot-id="server-1"]'),
    ).toBeNull();
    expect(document.activeElement?.id).toBe('lab-inspector-heading');
    db.close();
  });

  it('moves sandbox traffic with the sliders', async () => {
    const { db, harness, root } = await open('/lab/free');
    const rps = root.querySelector('#lab-rps') as HTMLInputElement;
    expect(
      (root.querySelector('fieldset.traffic') as HTMLFieldSetElement).disabled,
    ).toBe(false);
    expect(rps.getAttribute('aria-valuetext')).toBe('800 rps');
    rps.value = String(RPS_STEPS);
    rps.dispatchEvent(new Event('input'));
    await settle(harness);
    expect(root.querySelector('output[for="lab-rps"]')?.textContent).toContain(
      '200,000 rps',
    );
    const reads = root.querySelector('#lab-reads') as HTMLInputElement;
    reads.value = '50';
    reads.dispatchEvent(new Event('input'));
    await settle(harness);
    expect(
      root.querySelector('output[for="lab-reads"]')?.textContent,
    ).toContain('50%');
    db.close();
  });

  it('says so when the challenge does not exist', async () => {
    const { db, root } = await open('/lab/nope');
    expect(root.querySelector('h1')?.textContent).toContain(
      'Challenge not found',
    );
    db.close();
  });

  it('maps the RPS slider on a log scale', () => {
    expect(rpsFromSlider(0)).toBe(10);
    expect(rpsFromSlider(RPS_STEPS)).toBe(200_000);
    expect(rpsFromSlider(sliderFromRps(800))).toBe(800);
    expect(rpsFromSlider(sliderFromRps(6_000))).toBe(6_000);
  });
});
