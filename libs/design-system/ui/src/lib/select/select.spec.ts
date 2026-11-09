import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Select, type SelectOption } from './select';

@Component({
  imports: [Select],
  template: `
    <ah-select
      [options]="testOptions"
      [(value)]="selectedValue"
      label="Choose Subject"
      placeholder="Select subject..."
    />
  `,
})
class TestHostComponent {
  readonly testOptions: SelectOption[] = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ng', label: 'Angular' },
    { value: 'pg', label: 'PostgreSQL', disabled: true },
  ];
  readonly selectedValue = signal<string | null>('js');
}

describe('Select', () => {
  it('renders correctly with initial selected option', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ah-select-trigger');
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain('JavaScript');
  });

  it('opens popover when trigger is clicked', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ah-select-trigger');
    trigger.click();
    fixture.detectChanges();

    const popover = fixture.nativeElement.querySelector('.ah-select-popover');
    expect(popover).toBeTruthy();

    const options = fixture.nativeElement.querySelectorAll('.ah-select-option');
    expect(options.length).toBe(3);
  });

  it('selects an option on click and closes popover', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ah-select-trigger');
    trigger.click();
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.ah-select-option');
    options[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedValue()).toBe('ng');
    expect(
      fixture.nativeElement.querySelector('.ah-select-popover'),
    ).toBeNull();
    expect(trigger.textContent).toContain('Angular');
  });

  describe('keyboard (select-only combobox)', () => {
    const key = (el: HTMLElement, k: string) =>
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: k,
          bubbles: true,
          cancelable: true,
        }),
      );

    async function openWithKeyboard() {
      const fixture = TestBed.createComponent(TestHostComponent);
      await fixture.whenStable();
      const trigger: HTMLButtonElement =
        fixture.nativeElement.querySelector('.ah-select-trigger');
      key(trigger, 'ArrowDown');
      await fixture.whenStable();
      return { fixture, trigger };
    }

    it('announces the active option through aria-activedescendant', async () => {
      const { fixture, trigger } = await openWithKeyboard();
      const active = trigger.getAttribute('aria-activedescendant');
      expect(active).toBeTruthy();
      const option = fixture.nativeElement.querySelector(`#${active}`);
      expect(option.textContent).toContain('JavaScript');
      expect(option.getAttribute('role')).toBe('option');
    });

    it('skips disabled options and stops at the last enabled one', async () => {
      const { fixture, trigger } = await openWithKeyboard();
      key(trigger, 'ArrowDown');
      key(trigger, 'ArrowDown');
      await fixture.whenStable();
      const active = trigger.getAttribute('aria-activedescendant');
      expect(
        fixture.nativeElement.querySelector(`#${active}`).textContent,
      ).toContain('Angular');
    });

    it('jumps by typeahead and selects with Enter', async () => {
      const { fixture, trigger } = await openWithKeyboard();
      key(trigger, 'a');
      key(trigger, 'Enter');
      await fixture.whenStable();
      expect(fixture.componentInstance.selectedValue()).toBe('ng');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on Escape without letting the event reach a parent dialog', async () => {
      const { fixture, trigger } = await openWithKeyboard();
      let reachedParent = false;
      fixture.nativeElement.addEventListener('keydown', () => {
        reachedParent = true;
      });
      key(trigger, 'Escape');
      await fixture.whenStable();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(reachedParent).toBe(false);
    });

    it('labels the trigger with a real <label>', async () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      await fixture.whenStable();
      const label = fixture.nativeElement.querySelector('label');
      const trigger = fixture.nativeElement.querySelector('.ah-select-trigger');
      expect(label.getAttribute('for')).toBe(trigger.id);
    });
  });
});
