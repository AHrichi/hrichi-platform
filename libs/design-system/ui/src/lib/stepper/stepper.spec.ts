import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Stepper } from './stepper';

@Component({
  imports: [Stepper],
  template: `<label for="spans">Spans</label>
    <ah-stepper
      inputId="spans"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [adaptive]="adaptive()"
      [(value)]="value"
    />`,
})
class Host {
  readonly value = signal(6);
  readonly min = signal(1);
  readonly max = signal(10);
  readonly step = signal(1);
  readonly adaptive = signal(false);
}

async function setup(change?: (host: Host) => void) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  change?.(fixture.componentInstance);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const [less, more] = Array.from(root.querySelectorAll('button'));
  const field = root.querySelector('input') as HTMLInputElement;
  const stable = () => fixture.whenStable();
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    less,
    more,
    field,
    stable,
  };
}

describe('Stepper', () => {
  it('is a labelled spinbutton with − and + out of the tab order', async () => {
    const { less, more, field } = await setup();
    expect(field.id).toBe('spans');
    expect(field.type).toBe('number');
    expect([less.tabIndex, more.tabIndex]).toEqual([-1, -1]);
    expect(less.getAttribute('aria-label')).toBe('Decrease');
    expect(more.getAttribute('aria-label')).toBe('Increase');
    expect(more.getAttribute('aria-controls')).toBe('spans');
  });

  it('steps once per press of − or +', async () => {
    const { host, less, more, stable } = await setup();
    more.click();
    more.click();
    await stable();
    expect(host.value()).toBe(8);
    less.click();
    await stable();
    expect(host.value()).toBe(7);
  });

  it('stops at the ends, marks the end key and knocks against it', async () => {
    const { host, root, more, stable } = await setup((h) => h.value.set(10));
    expect(more.getAttribute('aria-disabled')).toBe('true');
    more.click();
    await stable();
    expect(host.value()).toBe(10);
    expect(root.querySelector('ah-stepper')?.getAttribute('data-wall')).toMatch(
      /^end-/,
    );
  });

  it('jumps between round numbers when adaptive', async () => {
    const { host, less, more, stable } = await setup((h) => {
      h.min.set(10);
      h.max.set(200000);
      h.step.set(10);
      h.adaptive.set(true);
      h.value.set(12345);
    });
    more.click();
    await stable();
    expect(host.value()).toBe(13000);
    less.click();
    less.click();
    await stable();
    expect(host.value()).toBe(11000);
  });

  it('makes a big nudge with Page Up and Page Down', async () => {
    const { host, field, stable } = await setup((h) => {
      h.max.set(60);
      h.value.set(20);
    });
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' }));
    await stable();
    expect(host.value()).toBe(30);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
    await stable();
    expect(host.value()).toBe(10);
  });

  it('takes a typed value and clamps it when the field is left', async () => {
    const { host, field, stable } = await setup();
    field.value = '25';
    field.dispatchEvent(new Event('input'));
    await stable();
    expect(host.value()).toBe(25);
    field.dispatchEvent(new Event('blur'));
    await stable();
    expect(host.value()).toBe(10);
    expect(field.value).toBe('10');
  });
});
