import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { HeatmapGrid } from './heatmap-grid';

@Component({
  imports: [HeatmapGrid],
  template: `
    <ah-heatmap-grid
      [colLabels]="['00', '01', '02']"
      [rows]="[
        { label: 'Monday', shortLabel: 'Mon', values: [0, 4, 12] },
        { label: 'Tuesday', shortLabel: 'Tue', values: [2, 8, 0] },
      ]"
    />
  `,
})
class Host {}

describe('HeatmapGrid', () => {
  it('renders grid rows, column headers, and intensity levels', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll(
      '.ah-heatmap-grid__row',
    );
    expect(rows.length).toBe(2);

    const cells = fixture.nativeElement.querySelectorAll(
      '.ah-heatmap-grid__cell',
    );
    expect(cells.length).toBe(6);
    expect(cells[2].getAttribute('data-level')).toBe('4');
  });
});
