import { TestBed } from '@angular/core/testing';
import { ICON_NAMES } from '@ah/products/system-design/domain';
import { SdIcon } from './icon';

describe('SdIcon', () => {
  it('draws non-empty vector paths for every IconName in the closed set', async () => {
    const fixture = TestBed.createComponent(SdIcon);

    for (const name of ICON_NAMES) {
      fixture.componentRef.setInput('name', name);
      await fixture.whenStable();

      const host = fixture.nativeElement as HTMLElement;
      const svg = host.querySelector('svg');
      const paths = host.querySelectorAll('path');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(paths.length).toBeGreaterThan(0);
      for (const path of paths) {
        expect(path.getAttribute('d')?.length).toBeGreaterThan(3);
      }
    }
  });

  it('applies custom size and accessible label when provided', async () => {
    const fixture = TestBed.createComponent(SdIcon);
    fixture.componentRef.setInput('name', 'database');
    fixture.componentRef.setInput('size', 18);
    fixture.componentRef.setInput('label', 'Primary database');
    await fixture.whenStable();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('18');
    expect(svg?.getAttribute('height')).toBe('18');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Primary database');
    expect(svg?.getAttribute('aria-hidden')).toBeNull();
  });
});
