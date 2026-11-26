import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Ruler } from './ruler';

@Component({
  imports: [Ruler],
  template: `<ah-ruler
    label="Ridge height"
    unit="m"
    [min]="1.5"
    [max]="12"
    [step]="0.1"
    [companion]="companion()"
    [(value)]="value"
  />`,
})
class Host {
  readonly value = signal(6.3);
  readonly companion = signal(false);
}

async function setup(change?: (host: Host) => void) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  change?.(fixture.componentInstance);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const window = root.querySelector('.window') as HTMLElement;
  const press = async (key: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, window, press };
}

describe('Ruler', () => {
  it('is a labelled slider', async () => {
    const { window } = await setup();
    expect(window.getAttribute('role')).toBe('slider');
    expect(window.getAttribute('aria-label')).toBe('Ridge height');
    expect(window.getAttribute('aria-valuetext')).toBe('6.3 m');
  });

  it('labels round numbers on the tape', async () => {
    const { root } = await setup();
    const labels = Array.from(root.querySelectorAll('.label')).map((label) =>
      label.textContent?.trim(),
    );
    expect(labels).toEqual([
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
    ]);
  });

  it('steps with the arrows and jumps label to label with the Page keys', async () => {
    const { host, press } = await setup();
    await press('ArrowRight');
    expect(host.value()).toBe(6.4);
    await press('PageUp');
    expect(host.value()).toBe(7.4);
    await press('PageDown');
    await press('PageDown');
    expect(host.value()).toBe(5.4);
    await press('End');
    expect(host.value()).toBe(12);
  });

  it('stays out of the tab order and the tree beside a typed field', async () => {
    const { window } = await setup((h) => h.companion.set(true));
    expect(window.getAttribute('aria-hidden')).toBe('true');
    expect(window.tabIndex).toBe(-1);
    expect(window.hasAttribute('role')).toBe(false);
  });
});
