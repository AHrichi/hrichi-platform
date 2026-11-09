import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MarbleDiagram, type StreamLane, type OperatorTransform } from './marble-diagram';

const sampleCombineLatestStreams: readonly StreamLane[] = [
  {
    id: 'timer-stream',
    label: 'Interval Stream (timer$)',
    badge: 'Source A',
    marbles: [
      { id: 't1', value: '1', positionPercent: 15, variant: 'data-1', tooltip: '1000ms: value 1' },
      { id: 't2', value: '2', positionPercent: 40, variant: 'data-1', tooltip: '2000ms: value 2' },
      { id: 't3', value: '3', positionPercent: 70, variant: 'data-1', tooltip: '3000ms: value 3' },
    ],
    isCompleted: true,
  },
  {
    id: 'action-stream',
    label: 'Action Stream (click$)',
    badge: 'Source B',
    marbles: [
      { id: 'a1', value: 'A', positionPercent: 28, variant: 'data-2', tooltip: 'User clicked A' },
      { id: 'a2', value: 'B', positionPercent: 55, variant: 'data-2', tooltip: 'User clicked B' },
      { id: 'a3', value: 'C', positionPercent: 85, variant: 'data-2', tooltip: 'User clicked C' },
    ],
    isCompleted: true,
  },
  {
    id: 'combined-stream',
    label: 'Combined Stream (result$)',
    badge: 'Output',
    isPrimary: true,
    marbles: [
      { id: 'c1', value: '1A', positionPercent: 28, variant: 'accent', tooltip: 'combineLatest: [1, A]' },
      { id: 'c2', value: '2A', positionPercent: 40, variant: 'accent', tooltip: 'combineLatest: [2, A]' },
      { id: 'c3', value: '2B', positionPercent: 55, variant: 'accent', tooltip: 'combineLatest: [2, B]' },
      { id: 'c4', value: '3B', positionPercent: 70, variant: 'accent', tooltip: 'combineLatest: [3, B]' },
      { id: 'c5', value: '3C', positionPercent: 85, variant: 'accent', tooltip: 'combineLatest: [3, C]' },
    ],
    isCompleted: true,
  },
];

const combineLatestOperator: OperatorTransform = {
  name: 'combineLatest(([a, b]) => `${a}${b}`)',
  description:
    'Waits for all source streams to emit at least once, then emits the latest combination on every subsequent emission.',
  formula: 'output = ƒ(latest A, latest B)',
};

const sampleErrorStream: readonly StreamLane[] = [
  {
    id: 'primary-stream',
    label: 'HTTP Fetch Stream (fetch$)',
    badge: 'Network',
    marbles: [
      { id: 'e1', value: '200', positionPercent: 25, variant: 'success', tooltip: 'First payload OK' },
      { id: 'e2', value: '503', positionPercent: 65, variant: 'danger', tooltip: 'Service Unavailable' },
    ],
    isCompleted: false,
    error: 'Gateway Timeout (504)',
  },
  {
    id: 'fallback-stream',
    label: 'Cache Stream (catchError => of(cached))',
    badge: 'Resilience',
    isPrimary: true,
    marbles: [
      { id: 'fb1', value: 'Cache', positionPercent: 80, variant: 'warning', tooltip: 'Cached stale data recovered' },
    ],
    isCompleted: true,
  },
];

const errorOperator: OperatorTransform = {
  name: 'catchError(err => of(fallbackCache))',
  description:
    'Intercepts stream error notification and smoothly switches to a resilient fallback observable, preventing UI breakdown.',
  formula: 'error -> fallback Observable',
};

/**
 * Interactive Marble Diagram for visualizing asynchronous streams, emissions over time,
 * higher-order flattening operators, and error recovery in RxJS & Angular 22 reactivity.
 */
const meta: Meta<MarbleDiagram> = {
  title: 'Visualizations/MarbleDiagram',
  component: MarbleDiagram,
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 820px; padding: 1.5rem;">
        <ah-marble-diagram
          [title]="title"
          [description]="description"
          [streams]="streams"
          [operator]="operator"
          [showTimeTicks]="showTimeTicks"
        />
      </div>
    `,
  }),
  args: {
    title: 'Reactive Stream Concurrency',
    description: 'Visualizing deterministic event propagation over continuous time',
    streams: sampleCombineLatestStreams,
    operator: combineLatestOperator,
    showTimeTicks: true,
  },
};
export default meta;

export const Default: StoryObj<MarbleDiagram> = {
  args: {
    title: 'Single Stream Lifecycle',
    description: 'Emissions along an asynchronous timeline concluding with complete notification',
    operator: null,
    streams: [
      {
        id: 'single-stream',
        label: 'User Keystrokes (query$)',
        badge: 'Debounced 300ms',
        marbles: [
          { id: 'm1', value: 'A', positionPercent: 20, variant: 'data-1' },
          { id: 'm2', value: 'An', positionPercent: 45, variant: 'data-1' },
          { id: 'm3', value: 'Ang', positionPercent: 75, variant: 'data-1' },
        ],
        isCompleted: true,
      },
    ],
  },
};

export const CombineLatestOperator: StoryObj<MarbleDiagram> = {
  args: {
    title: 'combineLatest Stream Merging',
    description: 'Coordinates multi-source reactivity without race conditions or memory leaks',
    streams: sampleCombineLatestStreams,
    operator: combineLatestOperator,
  },
};

export const ErrorHandlingAndRecovery: StoryObj<MarbleDiagram> = {
  args: {
    title: 'Error Handling with catchError',
    description: 'Graceful degradation when a source encounters fatal network failure',
    streams: sampleErrorStream,
    operator: errorOperator,
  },
};

export const CompactMobileView: StoryObj<MarbleDiagram> = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    title: 'Mobile Reactive Stream',
    description: 'Responsive layout with non-overlapping marbles and wrapped operator card',
    streams: [
      {
        id: 'mobile-source',
        label: 'Outer Search (keystrokes$)',
        badge: 'User Events',
        marbles: [
          { id: 'mk1', value: 'q', positionPercent: 15, variant: 'data-1', tooltip: 'Keypress q' },
          { id: 'mk2', value: 'qu', positionPercent: 42, variant: 'data-1', tooltip: 'Keypress qu' },
          { id: 'mk3', value: 'que', positionPercent: 78, variant: 'data-1', tooltip: 'Keypress que' },
        ],
        isCompleted: false,
      },
      {
        id: 'mobile-dest',
        label: 'Inner HTTP (fetch$)',
        badge: 'Inner catchError',
        isPrimary: true,
        marbles: [
          { id: 'mh1', value: '200', positionPercent: 22, variant: 'success', tooltip: 'HTTP 200 OK' },
          { id: 'mh2', value: '500', positionPercent: 48, variant: 'danger', tooltip: 'HTTP 500 Error' },
          { id: 'mh3', value: '[]', positionPercent: 64, variant: 'warning', tooltip: 'Fallback empty array' },
          { id: 'mh4', value: '200', positionPercent: 84, variant: 'success', tooltip: 'Subsequent search recovered' },
        ],
        isCompleted: true,
      },
    ],
    operator: {
      name: 'switchMap(q => http.get(q).pipe(catchError(fallback)))',
      formula: 'Inner error caught -> Outer stream stays alive',
      description: 'Catching errors inside the switchMap maintains outer stream vitality for future events.',
    },
  },
};

export const CustomShapesAndVariants: StoryObj<MarbleDiagram> = {
  args: {
    title: 'Custom Shapes & Color Spectrum',
    description: 'Circles, squares, diamonds across semantic state tokens',
    operator: null,
    streams: [
      {
        id: 'shapes-stream',
        label: 'Multi-Shape Telemetry',
        badge: 'Sensors',
        marbles: [
          { id: 's1', value: 'C', shape: 'circle', positionPercent: 15, variant: 'accent', tooltip: 'Circle emission' },
          { id: 's2', value: 'S', shape: 'square', positionPercent: 35, variant: 'warning', tooltip: 'Square packet' },
          { id: 's3', value: 'D', shape: 'diamond', positionPercent: 55, variant: 'info', tooltip: 'Diamond milestone' },
          { id: 's4', value: 'OK', shape: 'circle', positionPercent: 75, variant: 'success', tooltip: 'Success acknowledgement' },
        ],
        isCompleted: true,
      },
    ],
  },
};
