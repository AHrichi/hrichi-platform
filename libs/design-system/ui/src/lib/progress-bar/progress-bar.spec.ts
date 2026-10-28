import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './progress-bar';

@Component({
  imports: [ProgressBar],
  template: `
    <ah-progress-bar
      [value]="75"
      [max]="100"
      label="Bandwidth"
      variant="accent"
      size="lg"
      [showValue]="true"
    />
  `,
})
class Host {}

describe('ProgressBar', () => {
  it('renders progressbar with correct ARIA attributes and percentage width', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const track = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(track.getAttribute('aria-valuenow')).toBe('75');
    expect(track.getAttribute('aria-valuemin')).toBe('0');
    expect(track.getAttribute('aria-valuemax')).toBe('100');
    expect(track.getAttribute('aria-label')).toBe('Bandwidth');

    const fill = fixture.nativeElement.querySelector('.ah-progress-fill');
    expect(fill.style.width).toBe('75%');
    expect(fill.className).toContain('ah-progress-fill--accent');
  });
});
