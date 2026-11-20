import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';
import { SystemDesignRuntime } from '../store/system-design-runtime';
import { SYSTEM_DESIGN_ROUTES } from '../system-design.routes';
import { SystemDesignShell } from './system-design-shell';

describe('SystemDesignShell', () => {
  it('pins the paper look, English and left-to-right on its host and renders course modules and topbar tabs', async () => {
    const db = new SystemDesignDatabase(`sd-shell-${Math.random()}`);
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

    const fixture = TestBed.createComponent(SystemDesignShell);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-look')).toBe('paper');
    expect(host.getAttribute('lang')).toBe('en');
    expect(host.getAttribute('dir')).toBe('ltr');
    expect(host.textContent).toContain('System Design');
    expect(host.textContent).toContain('Course · 44 lessons');
    expect(host.textContent).toContain('01. Foundations');
    expect(host.querySelectorAll('.module-group').length).toBe(9);
    expect(host.querySelector('sd-progress-card')).not.toBeNull();

    // Toggle search via search trigger button
    const searchBtn = host.querySelector(
      'button.search-trigger',
    ) as HTMLButtonElement;
    searchBtn.click();
    await fixture.whenStable();
    expect(fixture.componentInstance['store'].searchOpen()).toBe(true);

    // Escape closes the search dialog
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }),
    );
    await fixture.whenStable();
    expect(fixture.componentInstance['store'].searchOpen()).toBe(false);

    db.close();
  });
});
