import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SdNav } from '../services/sd-nav';
import { SystemDesignRuntime } from '../store/system-design-runtime';
import { SdSearchDialog } from './search-dialog';

describe('SdSearchDialog', () => {
  it('searches lessons by keyword, navigates with ↑/↓ and opens the lesson on Enter', async () => {
    const goToLesson = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: SystemDesignRuntime,
          useValue: { open: () => Promise.resolve(null) },
        },
        { provide: SdNav, useValue: { goToLesson, goToCheatsheet: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(SdSearchDialog);
    fixture.componentRef.setInput('open', true);
    let closedCount = 0;
    fixture.componentInstance.closed.subscribe(() => closedCount++);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input.search-input') as HTMLInputElement;
    input.value = 'DNS';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const options = host.querySelectorAll('button.hit-btn');
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].textContent).toContain('One Request, End to End');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();

    expect(closedCount).toBe(1);
    expect(goToLesson).toHaveBeenCalledWith('request-journey', 1);
  });
});
