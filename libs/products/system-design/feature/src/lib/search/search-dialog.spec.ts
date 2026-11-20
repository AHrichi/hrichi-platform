import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SdNav } from '../services/sd-nav';
import { SystemDesignRuntime } from '../store/system-design-runtime';
import { SdSearchDialog } from './search-dialog';

async function setup() {
  const goToLesson = vi.fn().mockResolvedValue(true);
  const goToCheatsheet = vi.fn().mockResolvedValue(true);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: SystemDesignRuntime,
        useValue: { open: () => Promise.resolve(null) },
      },
      { provide: SdNav, useValue: { goToLesson, goToCheatsheet } },
    ],
  });
  const fixture = TestBed.createComponent(SdSearchDialog);
  fixture.componentRef.setInput('open', true);
  let closedCount = 0;
  fixture.componentInstance.closed.subscribe(() => closedCount++);
  await fixture.whenStable();

  const host = fixture.nativeElement as HTMLElement;
  const input = host.querySelector('input.search-input') as HTMLInputElement;
  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const key = async (k: string) => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
    await fixture.whenStable();
  };
  return {
    fixture,
    host,
    input,
    type,
    key,
    goToLesson,
    goToCheatsheet,
    closed: () => closedCount,
  };
}

describe('SdSearchDialog', () => {
  it('searches lessons by keyword and opens the active one on Enter', async () => {
    const { host, type, key, goToLesson, closed } = await setup();
    await type('DNS');

    const options = host.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toContain('One Request, End to End');

    await key('Enter');
    expect(closed()).toBe(1);
    expect(goToLesson).toHaveBeenCalledWith('request-journey', 1);
  });

  it('is an ARIA combobox whose listbox holds only groups and options', async () => {
    const { fixture, host, input, type, key } = await setup();
    fixture.componentRef.setInput('cheatTerms', [
      { module: 'foundations', title: 'Nines table' },
      { module: 'foundations', title: 'Nines and error budgets' },
    ]);
    await type('nines');

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-controls')).toBe('sd-search-results');
    expect(input.getAttribute('aria-expanded')).toBe('true');

    const listbox = host.querySelector('#sd-search-results') as HTMLElement;
    expect(listbox.getAttribute('role')).toBe('listbox');
    for (const child of Array.from(listbox.children))
      expect(child.getAttribute('role')).toBe('group');

    // Lessons come first on screen, then cheatsheets; ids never repeat even
    // when two cheatsheet hits share a module.
    const options = Array.from(host.querySelectorAll('[role="option"]'));
    const ids = options.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = Array.from(listbox.querySelectorAll('[role="group"]'));
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual([
      'Lessons',
      'Cheatsheets',
    ]);

    // ↓ moves the active option in screen order; aria-activedescendant follows.
    expect(input.getAttribute('aria-activedescendant')).toBe(ids[0]);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    for (let i = 1; i < ids.length; i++) {
      await key('ArrowDown');
      expect(input.getAttribute('aria-activedescendant')).toBe(ids[i]);
    }
    await key('ArrowDown');
    expect(input.getAttribute('aria-activedescendant')).toBe(ids[0]);
    await key('ArrowUp');
    expect(input.getAttribute('aria-activedescendant')).toBe(
      ids[ids.length - 1],
    );
  });

  it('opens a cheatsheet, and says when nothing matched', async () => {
    const { fixture, host, input, type, key, goToCheatsheet } = await setup();
    fixture.componentRef.setInput('cheatTerms', [
      { module: 'data', title: 'Isolation zzzanomalies' },
    ]);
    await type('zzzanomalies');
    await key('Enter');
    expect(goToCheatsheet).toHaveBeenCalledWith('data');

    await type('qqqq-no-such-topic');
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      'No lessons or cheatsheets matched',
    );
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
    expect(
      (host.querySelector('#sd-search-results') as HTMLElement).hidden,
    ).toBe(true);
  });
});
