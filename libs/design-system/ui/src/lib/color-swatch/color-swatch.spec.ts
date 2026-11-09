import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ColorSwatch, type ColorSwatchItem } from './color-swatch';

describe('ColorSwatch', () => {
  let fixture: ComponentFixture<ColorSwatch>;
  let component: ColorSwatch;

  const mockColors: ColorSwatchItem[] = [
    {
      id: 'nardo',
      name: 'Nardo Grey',
      hex: '#6b7280',
      finish: 'gloss',
      priceLabel: 'Standard',
    },
    {
      id: 'monaco',
      name: 'Monaco Blue',
      hex: '#1e3a8a',
      finish: 'metallic',
      priceLabel: '+€1,200',
    },
    {
      id: 'frozen',
      name: 'Frozen Titanium',
      hex: '#94a3b8',
      finish: 'matte',
      priceLabel: '+€2,400',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ColorSwatch);
    component = fixture.componentInstance;
  });

  it('renders all color options with ARIA radio attributes', async () => {
    fixture.componentRef.setInput('items', mockColors);
    fixture.componentRef.setInput('value', 'nardo');
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.swatch-btn');
    expect(buttons.length).toBe(3);

    expect(buttons[0].getAttribute('role')).toBe('radio');
    expect(buttons[0].getAttribute('aria-checked')).toBe('true');
    expect(buttons[1].getAttribute('aria-checked')).toBe('false');
  });

  it('emits selectionChange when a non-selected swatch is clicked', async () => {
    fixture.componentRef.setInput('items', mockColors);
    fixture.componentRef.setInput('value', 'nardo');
    await fixture.whenStable();

    let selected: ColorSwatchItem | undefined;
    component.selectionChange.subscribe((c) => (selected = c));

    const buttons = fixture.nativeElement.querySelectorAll('.swatch-btn');
    buttons[1].click();

    expect(selected?.id).toBe('monaco');
  });

  it('supports arrow key navigation across swatches', async () => {
    fixture.componentRef.setInput('items', mockColors);
    fixture.componentRef.setInput('value', 'nardo');
    await fixture.whenStable();

    let selected: ColorSwatchItem | undefined;
    component.selectionChange.subscribe((c) => (selected = c));

    const buttons = fixture.nativeElement.querySelectorAll('.swatch-btn');
    buttons[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
    );

    expect(selected?.id).toBe('monaco');
  });

  it('keeps the group reachable by keyboard when nothing is selected', async () => {
    fixture.componentRef.setInput('items', mockColors);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.swatch-btn');
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');
  });

  it('moves focus with the selection and mirrors arrows right-to-left', async () => {
    fixture.componentRef.setInput('items', mockColors);
    fixture.componentRef.setInput('value', 'monaco');
    fixture.nativeElement.setAttribute('dir', 'rtl');
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.swatch-btn');
    buttons[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
    );
    await fixture.whenStable();

    expect(component.value()).toBe('nardo');
    expect(document.activeElement).toBe(buttons[0]);
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
  });
});
