import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SegmentedControl, SegmentedOption } from './segmented-control';

type Fruit = 'apple' | 'pear' | 'plum';

@Component({
  imports: [SegmentedControl],
  template: `<ah-segmented-control
    label="Fruit"
    [options]="options"
    [(value)]="value"
  />`,
})
class Host {
  readonly options: SegmentedOption<Fruit>[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'pear', label: 'Pear' },
    { value: 'plum', label: 'Plum' },
  ];
  readonly value = signal<Fruit>('apple');
}

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const radios = Array.from<HTMLButtonElement>(
    fixture.nativeElement.querySelectorAll('[role="radio"]'),
  );
  return { fixture, host: fixture.componentInstance, radios };
}

describe('SegmentedControl', () => {
  it('exposes a labelled radio group with one tab stop', async () => {
    const { fixture, radios } = await setup();
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]');

    expect(group.getAttribute('aria-label')).toBe('Fruit');
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it('selects on click and updates the bound value', async () => {
    const { fixture, host, radios } = await setup();

    radios[2].click();
    await fixture.whenStable();

    expect(host.value()).toBe('plum');
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
  });

  it('moves selection and focus with arrow keys, wrapping around', async () => {
    const { fixture, host, radios } = await setup();

    radios[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    await fixture.whenStable();

    expect(host.value()).toBe('plum');
    expect(document.activeElement).toBe(radios[2]);
  });
});
