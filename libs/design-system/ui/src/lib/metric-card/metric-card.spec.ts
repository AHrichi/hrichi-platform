import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { MetricCard } from './metric-card';

@Component({
  imports: [MetricCard],
  template: `
    <ah-metric-card
      label="Delivery Rate"
      value="99.2%"
      icon="⚡"
      hint="Exceeds weekly target"
      [trend]="{ direction: 'up', label: '+1.5%', positive: true }"
      variant="success"
      elevation="raised"
    />
  `,
})
class Host {}

describe('MetricCard', () => {
  it('renders label, value, trend and applies variant and elevation classes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const hostEl = fixture.nativeElement.querySelector('ah-metric-card');
    expect(hostEl.className).toContain('ah-metric-card--success');
    expect(hostEl.className).toContain('ah-metric-card--raised');

    const label = fixture.nativeElement.querySelector('.ah-metric-label');
    expect(label.textContent).toBe('Delivery Rate');

    const value = fixture.nativeElement.querySelector('.ah-metric-value');
    expect(value.textContent).toBe('99.2%');

    const trend = fixture.nativeElement.querySelector('.ah-metric-trend');
    expect(trend.textContent).toContain('+1.5%');
  });
});
