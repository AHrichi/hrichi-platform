import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  MarbleDiagram,
  type MarbleItem,
  type OperatorTransform,
  type StreamLane,
} from './marble-diagram';

@Component({
  imports: [MarbleDiagram],
  template: `
    <ah-marble-diagram
      [title]="title()"
      [description]="description()"
      [streams]="streams()"
      [operator]="operator()"
      (marbleClick)="onMarbleClick($event)"
    />
  `,
})
class TestHost {
  readonly title = signal<string>('Combining Streams');
  readonly description = signal<string>('Visualizing combineLatest stream sync');
  readonly streams = signal<readonly StreamLane[]>([
    {
      id: 'stream-a',
      label: 'Stream A (Timer)',
      badge: 'Interval',
      marbles: [
        { id: 'a1', value: '1', positionPercent: 20, variant: 'data-1' },
        { id: 'a2', value: '2', positionPercent: 60, variant: 'data-1' },
      ],
      isCompleted: true,
    },
    {
      id: 'stream-b',
      label: 'Stream B (Clicks)',
      badge: 'DOM',
      marbles: [
        { id: 'b1', value: 'X', positionPercent: 40, variant: 'data-2' },
      ],
      isCompleted: false,
      error: 'Network Timeout',
    },
  ]);
  readonly operator = signal<OperatorTransform | null>({
    name: 'combineLatest(([a, b]) => `${a}-${b}`)',
    description: 'Combines the latest values from each input observable',
    formula: 'ƒ(latest A, latest B)',
  });

  lastClickedMarble: { streamId: string; marble: MarbleItem } | null = null;

  onMarbleClick(event: { streamId: string; marble: MarbleItem }): void {
    this.lastClickedMarble = event;
  }
}

describe('MarbleDiagram', () => {
  it('renders header, stream lanes, marbles and operator', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();

    const hostElem: HTMLElement = fixture.nativeElement;

    // Check title and description
    const title = hostElem.querySelector('.diagram-title');
    expect(title?.textContent?.trim()).toBe('Combining Streams');

    const desc = hostElem.querySelector('.diagram-description');
    expect(desc?.textContent?.trim()).toBe('Visualizing combineLatest stream sync');

    // Check lanes count
    const lanes = hostElem.querySelectorAll('.stream-lane');
    expect(lanes.length).toBe(2);

    // Stream A label and badge
    expect(lanes[0].textContent).toContain('Stream A (Timer)');
    expect(lanes[0].textContent).toContain('Interval');

    // Check completion marker in Stream A
    const completionMarker = lanes[0].querySelector('.terminal-completed');
    expect(completionMarker).toBeTruthy();

    // Check error marker in Stream B
    const errorMarker = lanes[1].querySelector('.terminal-error');
    expect(errorMarker).toBeTruthy();

    // Check operator block
    const operator = hostElem.querySelector('.operator-box');
    expect(operator).toBeTruthy();
    expect(operator?.textContent).toContain('combineLatest');
    expect(operator?.textContent).toContain('ƒ(latest A, latest B)');
  });

  it('handles marble selection and click emission', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();

    const firstMarble = fixture.nativeElement.querySelector(
      '.marble-node',
    ) as HTMLButtonElement;
    expect(firstMarble).toBeTruthy();
    expect(firstMarble.textContent?.trim()).toBe('1');

    firstMarble.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.lastClickedMarble).toEqual({
      streamId: 'stream-a',
      marble: { id: 'a1', value: '1', positionPercent: 20, variant: 'data-1' },
    });
    expect(firstMarble.classList.contains('marble--selected')).toBe(true);
  });

  it('generates screen reader announcements for emissions, completion and errors', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();

    const liveRegion = fixture.nativeElement.querySelector('.sr-only[role="status"]');
    expect(liveRegion).toBeTruthy();
    const text = liveRegion?.textContent || '';
    expect(text).toContain('Stream A (Timer) emitted 2');
    expect(text).toContain('Stream A (Timer) completed');
    expect(text).toContain('Stream B (Clicks) emitted X');
    expect(text).toContain('Network Timeout');
  });
});
