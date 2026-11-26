import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Thermometer } from './thermometer';

@Component({
  imports: [Thermometer],
  template: `<ah-thermometer
    label="Outside"
    [min]="-25"
    [max]="20"
    [step]="0.5"
    [(value)]="value"
  />`,
})
class Host {
  readonly value = signal(-8);
}

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const scale = root.querySelector('.scale') as HTMLElement;
  const press = async (key: string) => {
    scale.dispatchEvent(new KeyboardEvent('keydown', { key }));
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, scale, press };
}

describe('Thermometer', () => {
  it('is a labelled slider that reads in degrees', async () => {
    const { scale } = await setup();
    expect(scale.getAttribute('role')).toBe('slider');
    expect(scale.getAttribute('aria-label')).toBe('Outside');
    expect(scale.getAttribute('aria-valuenow')).toBe('-8');
    expect(scale.getAttribute('aria-valuetext')).toBe('-8 °C');
  });

  it('warms and cools by a step, and goes to the ends', async () => {
    const { host, press } = await setup();
    await press('ArrowUp');
    await press('ArrowRight');
    expect(host.value()).toBe(-7);
    await press('ArrowDown');
    expect(host.value()).toBe(-7.5);
    await press('End');
    expect(host.value()).toBe(20);
    await press('Home');
    expect(host.value()).toBe(-25);
  });

  it('marks 0 °C when the range crosses it', async () => {
    const { root } = await setup();
    expect(root.querySelector('.zero')).not.toBeNull();
    expect(root.querySelector('.zero-label')?.textContent?.trim()).toBe('0');
  });

  it('turns from blue to red as it warms', async () => {
    const { host, fixture, scale } = await setup();
    const colour = () => scale.style.getPropertyValue('--ah-mercury');
    host.value.set(-20);
    await fixture.whenStable();
    expect(colour()).toContain('--color-blue-500');
    host.value.set(19);
    await fixture.whenStable();
    expect(colour()).toContain('--color-amber-500');
  });
});
