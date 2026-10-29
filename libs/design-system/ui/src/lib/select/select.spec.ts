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
    expect(fixture.nativeElement.querySelector('.ah-select-popover')).toBeNull();
    expect(trigger.textContent).toContain('Angular');
  });
});
