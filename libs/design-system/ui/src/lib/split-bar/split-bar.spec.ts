import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SplitBar } from './split-bar';

@Component({
  imports: [SplitBar],
  template: `
    <ah-split-bar
      [segments]="[
        {
          label: 'Ahmed',
          percentage: 56,
          value: '1,240 msgs',
          color: '#25D366',
        },
        {
          label: 'Yasmine',
          percentage: 44,
          value: '980 msgs',
          color: '#38BDF8',
        },
      ]"
    />
  `,
})
class Host {}

describe('SplitBar', () => {
  it('renders proportional segments and legend items', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const segments = fixture.nativeElement.querySelectorAll(
      '.ah-split-bar__segment',
    );
    expect(segments.length).toBe(2);

    const legendItems = fixture.nativeElement.querySelectorAll(
      '.ah-split-bar__legend-item',
    );
    expect(legendItems.length).toBe(2);
  });
});
