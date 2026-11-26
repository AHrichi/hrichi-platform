import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Dial, type DialVariant } from './dial';

@Component({
  imports: [Dial],
  template: `<ah-dial
    label="Pad efficiency"
    unit="%"
    [variant]="variant()"
    [min]="min()"
    [max]="max()"
    [period]="period()"
    [companion]="companion()"
    [(value)]="value"
  />`,
})
class Host {
  readonly value = signal(80);
  readonly variant = signal<DialVariant>('gauge');
  readonly min = signal(50);
  readonly max = signal(95);
  readonly period = signal<number | null>(null);
  readonly companion = signal(false);
}

async function setup(change?: (host: Host) => void) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  change?.(fixture.componentInstance);
  await fixture.whenStable();
  const face = fixture.nativeElement.querySelector('.face') as HTMLElement;
  const press = async (key: string) => {
    face.dispatchEvent(new KeyboardEvent('keydown', { key }));
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, face, press };
}

describe('Dial', () => {
  it('is a labelled slider with its value read with the unit', async () => {
    const { face } = await setup();
    expect(face.getAttribute('role')).toBe('slider');
    expect(face.tabIndex).toBe(0);
    expect(face.getAttribute('aria-label')).toBe('Pad efficiency');
    expect(face.getAttribute('aria-valuemin')).toBe('50');
    expect(face.getAttribute('aria-valuemax')).toBe('95');
    expect(face.getAttribute('aria-valuenow')).toBe('80');
    expect(face.getAttribute('aria-valuetext')).toBe('80 %');
  });

  it('moves with the arrows, Page keys, Home and End, inside the range', async () => {
    const { host, press } = await setup();
    await press('ArrowUp');
    await press('ArrowRight');
    expect(host.value()).toBe(82);
    await press('ArrowLeft');
    expect(host.value()).toBe(81);
    await press('PageDown');
    expect(host.value()).toBe(76);
    await press('End');
    await press('ArrowUp');
    expect(host.value()).toBe(95);
    await press('Home');
    expect(host.value()).toBe(50);
  });

  it('wraps round as a clock', async () => {
    const { host, press } = await setup((h) => {
      h.variant.set('clock');
      h.min.set(0);
      h.max.set(23);
      h.period.set(24);
      h.value.set(23);
    });
    await press('ArrowUp');
    expect(host.value()).toBe(0);
    await press('ArrowDown');
    expect(host.value()).toBe(23);
  });

  it('stays out of the tab order and the tree beside a typed field', async () => {
    const { face } = await setup((h) => h.companion.set(true));
    expect(face.getAttribute('aria-hidden')).toBe('true');
    expect(face.tabIndex).toBe(-1);
    expect(face.hasAttribute('role')).toBe(false);
    expect(face.hasAttribute('aria-valuenow')).toBe(false);
  });
});
