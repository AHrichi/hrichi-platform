import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  courseProgress,
  CURRICULUM,
  ICON_NAMES,
  type Lesson,
  type LessonProgress,
  sceneAt,
  type SceneState,
} from '@ah/products/system-design/domain';
import { SdCheckChoice } from './checks/check-choice';
import { SdCheckNumeric } from './checks/check-numeric';
import { SdCheckOrder } from './checks/check-order';
import type {
  ChoiceCheck,
  NumericCheck,
  OrderCheck,
} from './checks/check-types';
import { ComingSoon } from './coming-soon/coming-soon';
import { SdHud } from './hud/hud';
import { SdIcon } from './icon/icon';
import { SdInlineText } from './inline-text/inline-text';
import { SdLearnList } from './learn-list/learn-list';
import { SdLegend } from './legend/legend';
import { SdProgressCard } from './progress-card/progress-card';
import { SdIsoScene } from './scene/iso-scene/iso-scene';
import { SdStepPanel } from './step-panel/step-panel';
import { SdTimeline } from './timeline/timeline';

const PAPER_WRAP_OPEN = `<div data-look="paper" style="padding: var(--space-5); background: var(--color-bg-canvas); color: var(--color-text-default); font-family: var(--font-family-mono);">`;
const PAPER_WRAP_CLOSE = `</div>`;

function wrapPaper(inner: string): string {
  return `${PAPER_WRAP_OPEN}${inner}${PAPER_WRAP_CLOSE}`;
}

const storyLesson: Lesson = {
  id: 'story-caching',
  learn: [
    'Why a **cache** helps repeat reads',
    'What a cache miss costs',
    'When cached rows go stale',
  ],
  scene: {
    nodes: [
      { id: 'you', kind: 'user', at: { x: 0, y: 2 }, label: 'You' },
      {
        id: 'app',
        kind: 'server',
        at: { x: 3, y: 2 },
        label: 'App server',
        sublabel: 'Node 24',
      },
      {
        id: 'db',
        kind: 'database',
        at: { x: 6, y: 2 },
        label: 'Primary DB',
        load: 0.72,
      },
    ],
    edges: [
      { id: 'you-app', from: 'you', to: 'app', label: 'HTTPS' },
      { id: 'app-db', from: 'app', to: 'db', label: 'SQL' },
    ],
    zones: [
      {
        id: 'vpc',
        from: { x: 2, y: 0 },
        to: { x: 6, y: 3 },
        hue: 'blue',
        label: 'Private VPC',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'hit', label: 'Hit ratio', icon: 'gauge', value: '—' },
    { id: 'p50', label: 'p50', icon: 'timer', value: '42 ms' },
    { id: 'err', label: 'Errors', icon: 'warning', value: '0%' },
  ],
  steps: [
    {
      id: 'slow',
      label: 'Slow reads',
      kind: 'problem',
      title: 'Every read hits the database',
      body: ['Each page view runs the same **SQL** query.'],
      ops: [{ op: 'packet', edge: 'app-db', kind: 'request', label: 'SELECT' }],
    },
    {
      id: 'add-cache',
      label: 'Add cache',
      kind: 'technique',
      title: 'Keep hot rows in memory',
      body: [
        'An in-memory `cache` answers repeat **reads** in under a millisecond.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Memory lookups avoid disk and query parsing.',
        },
        {
          kind: 'watch-out',
          text: 'Stale reads are a _trade-off_ you choose with a TTL.',
        },
      ],
      changes: [
        { type: 'added', text: 'In-memory cache' },
        { type: 'changed', text: 'Read path checks cache first' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'cache',
            kind: 'cache',
            at: { x: 4, y: 0 },
            label: 'Cache',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'app-cache', from: 'app', to: 'cache', label: 'GET' },
        },
        {
          op: 'add-note',
          note: {
            id: 'lat-note',
            anchor: { node: 'cache' },
            text: 'hit · 1 ms',
            tone: 'good',
            icon: 'bolt',
          },
        },
        { op: 'set-metric', id: 'hit', value: '84%', tone: 'good' },
        { op: 'set-metric', id: 'p50', value: '4 ms', tone: 'good' },
      ],
      learns: [0, 1],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'What the cache bought',
      body: ['Reads got fast; writes gained invalidation work.'],
      ops: [],
      learns: [2],
      takeaways: [
        'Cache hits skip the database',
        'Misses pay the cache check plus the database read',
        'Use a TTL or explicit invalidation to bound staleness',
      ],
    },
  ],
  checks: [],
  cards: [],
};

const rawStep1State = sceneAt(storyLesson, 1);
const deterministicSceneState: SceneState = {
  ...rawStep1State,
  fresh: new Set(),
};

const glyphGalleryState: SceneState = {
  nodes: [
    { id: 'person', kind: 'user', at: { x: 0, y: 0 }, label: 'You' },
    { id: 'device', kind: 'client', at: { x: 2, y: 0 }, label: 'Laptop' },
    {
      id: 'globe',
      kind: 'cdn',
      at: { x: 4, y: 0 },
      label: 'Edge CDN',
      state: 'focus',
    },
    {
      id: 'cube',
      kind: 'server',
      at: { x: 0, y: 2 },
      label: 'App server',
      load: 0.72,
    },
    {
      id: 'cylinder',
      kind: 'database',
      at: { x: 2, y: 2 },
      label: 'Primary DB',
      state: 'hot',
      badge: 'stale',
      load: 0.95,
    },
    {
      id: 'stack',
      kind: 'queue',
      at: { x: 4, y: 2 },
      label: 'Job queue',
      state: 'down',
    },
    {
      id: 'disk',
      kind: 'storage',
      at: { x: 6, y: 2 },
      label: 'Blob store',
      state: 'dim',
    },
  ],
  edges: [],
  zones: [],
  notes: [],
  metrics: {},
  packets: [],
  learned: new Set(),
  fresh: new Set(),
};

const sampleChoice: ChoiceCheck = {
  id: 'story-choice',
  kind: 'choice',
  prompt: 'Where does a cache **hit** stop?',
  options: ['At the in-memory `cache`', 'At the primary database', 'At DNS'],
  answer: 0,
  explain: 'A hit returns the cached value from memory without querying SQL.',
  step: 'add-cache',
};

const sampleNumeric: NumericCheck = {
  id: 'story-numeric',
  kind: 'numeric',
  prompt: 'With an 80% hit ratio on 1,000 reads/s, how many reach the DB?',
  unit: 'reads/s',
  answer: 200,
  tolerance: 0.25,
  explain: '20% of 1,000 reads miss the cache and query the database.',
  step: 'add-cache',
};

const sampleOrder: OrderCheck = {
  id: 'story-order',
  kind: 'order',
  prompt: 'Order the steps of a cache-aside miss',
  items: [
    'Check the `cache` for the key',
    'Query the primary database',
    'Write the result into the cache with a TTL',
  ],
  explain: 'Cache-aside checks memory first, falls back to DB, then populates.',
  step: 'add-cache',
};

const sampleProgress = courseProgress(
  CURRICULUM,
  new Map<string, LessonProgress>([
    [
      CURRICULUM[0].lessons[0].id,
      {
        lessonId: CURRICULUM[0].lessons[0].id,
        furthestStep: 5,
        lastStep: 5,
        completedAt: '2026-11-20T09:00:00Z',
        updatedAt: '2026-11-20T09:00:00Z',
      },
    ],
    [
      CURRICULUM[0].lessons[1].id,
      {
        lessonId: CURRICULUM[0].lessons[1].id,
        furthestStep: 5,
        lastStep: 5,
        completedAt: '2026-11-20T10:00:00Z',
        updatedAt: '2026-11-20T10:00:00Z',
      },
    ],
  ]),
);

const meta: Meta = {
  title: 'System Design/UI Kit',
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj;

export const Icons: Story = {
  render: () => ({
    props: { names: ICON_NAMES },
    moduleMetadata: { imports: [SdIcon] },
    template: wrapPaper(`
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr)); gap: var(--space-3);">
        @for (name of names; track name) {
          <div style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2); border: 1px solid var(--color-border-default); border-radius: var(--radius-md); background: var(--color-bg-surface);">
            <sd-icon [name]="name" [size]="20" />
            <span style="font-size: var(--font-size-100);">{{ name }}</span>
          </div>
        }
      </div>
    `),
  }),
};

export const GlyphsAndStates: Story = {
  render: () => ({
    props: { state: glyphGalleryState },
    moduleMetadata: { imports: [SdIsoScene] },
    template: wrapPaper(`
      <sd-iso-scene
        [state]="state"
        [playing]="false"
        [reducedMotion]="true"
        label="All seven isometric glyph shapes and node states"
      />
    `),
  }),
};

export const IsoScene: Story = {
  render: () => ({
    props: { state: deterministicSceneState },
    moduleMetadata: { imports: [SdIsoScene] },
    template: wrapPaper(`
      <sd-iso-scene
        [state]="state"
        [playing]="false"
        [reducedMotion]="true"
        label="Keep hot rows in memory"
      />
    `),
  }),
};

export const IsoSceneSelectable: Story = {
  render: () => ({
    props: { state: deterministicSceneState },
    moduleMetadata: { imports: [SdIsoScene] },
    template: wrapPaper(`
      <sd-iso-scene
        [state]="state"
        [playing]="false"
        [reducedMotion]="true"
        [selectable]="true"
        selectedNodeId="app"
        label="Design Lab selectable architecture diagram"
      />
    `),
  }),
};

export const HudAndLegend: Story = {
  render: () => ({
    props: {
      hud: storyLesson.hud,
      metrics: {
        hit: { value: '84%', tone: 'good' as const },
        p50: { value: '4 ms', tone: 'normal' as const },
        err: { value: '3.2%', tone: 'bad' as const },
      },
    },
    moduleMetadata: { imports: [SdHud, SdLegend] },
    template: wrapPaper(`
      <div style="display: grid; gap: var(--space-4);">
        <sd-hud [hud]="hud" [metrics]="metrics" />
        <sd-legend />
      </div>
    `),
  }),
};

export const InlineText: Story = {
  render: () => ({
    props: {
      sample:
        'A **write-through** cache updates `redis` and Postgres inside one _synchronous_ path.',
    },
    moduleMetadata: { imports: [SdInlineText] },
    template: wrapPaper(`
      <p style="margin: 0; font-size: var(--font-size-200);">
        <sd-inline-text [text]="sample" />
      </p>
    `),
  }),
};

export const StepPanelTechnique: Story = {
  render: () => ({
    props: { step: storyLesson.steps[1] },
    moduleMetadata: { imports: [SdStepPanel] },
    template: wrapPaper(`
      <div style="max-inline-size: 22rem;">
        <sd-step-panel
          [step]="step"
          [stepIndex]="1"
          [stepCount]="3"
          nextStepLabel="Recap"
        />
      </div>
    `),
  }),
};

export const StepPanelRecap: Story = {
  render: () => ({
    props: { step: storyLesson.steps[2] },
    moduleMetadata: { imports: [SdStepPanel] },
    template: wrapPaper(`
      <div style="max-inline-size: 22rem;">
        <sd-step-panel
          [step]="step"
          [stepIndex]="2"
          [stepCount]="3"
          [canNext]="false"
          nextLessonTitle="Replication & Read Scaling"
        />
      </div>
    `),
  }),
};

export const TimelineAndLearnList: Story = {
  render: () => ({
    props: {
      steps: storyLesson.steps,
      learn: storyLesson.learn,
      learned: new Set([0, 1]),
    },
    moduleMetadata: { imports: [SdTimeline, SdLearnList] },
    template: wrapPaper(`
      <div style="display: grid; gap: var(--space-4); max-inline-size: 32rem;">
        <sd-timeline [steps]="steps" [currentIndex]="1" [furthestIndex]="2" />
        <sd-learn-list [items]="learn" [learned]="learned" />
      </div>
    `),
  }),
};

export const ProgressCard: Story = {
  render: () => ({
    props: { progress: sampleProgress },
    moduleMetadata: { imports: [SdProgressCard] },
    template: wrapPaper(`
      <div style="max-inline-size: 18rem;">
        <sd-progress-card [progress]="progress" [expanded]="true" />
      </div>
    `),
  }),
};

export const CheckChoiceWidget: Story = {
  render: () => ({
    props: { check: sampleChoice },
    moduleMetadata: { imports: [SdCheckChoice] },
    template: wrapPaper(`
      <div style="display: grid; gap: var(--space-4); max-inline-size: 30rem;">
        <sd-check-choice [check]="check" />
        <sd-check-choice [check]="check" [initialChoice]="0" [initialSubmitted]="true" />
      </div>
    `),
  }),
};

export const CheckNumericWidget: Story = {
  render: () => ({
    props: { check: sampleNumeric },
    moduleMetadata: { imports: [SdCheckNumeric] },
    template: wrapPaper(`
      <div style="display: grid; gap: var(--space-4); max-inline-size: 30rem;">
        <sd-check-numeric [check]="check" />
        <sd-check-numeric [check]="check" initialValue="210" [initialSubmitted]="true" />
      </div>
    `),
  }),
};

export const CheckOrderWidget: Story = {
  render: () => ({
    props: { check: sampleOrder },
    moduleMetadata: { imports: [SdCheckOrder] },
    template: wrapPaper(`
      <div style="display: grid; gap: var(--space-4); max-inline-size: 30rem;">
        <sd-check-order [check]="check" />
        <sd-check-order [check]="check" [initialOrder]="check.items" [initialSubmitted]="true" />
      </div>
    `),
  }),
};

export const ComingSoonCard: Story = {
  render: () => ({
    moduleMetadata: { imports: [ComingSoon] },
    template: wrapPaper(`
      <sd-coming-soon
        heading="System Design"
        body="Interactive lessons on distributed systems and architecture."
      />
    `),
  }),
};
