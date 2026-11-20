import { TestBed } from '@angular/core/testing';
import { SystemDesignShell } from './system-design-shell';

describe('SystemDesignShell', () => {
  it('carries the paper look and pins English left to right', async () => {
    const fixture = TestBed.createComponent(SystemDesignShell);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-look')).toBe('paper');
    expect(host.getAttribute('lang')).toBe('en');
    expect(host.getAttribute('dir')).toBe('ltr');
    expect(host.querySelector('sd-coming-soon')).not.toBeNull();
  });
});
