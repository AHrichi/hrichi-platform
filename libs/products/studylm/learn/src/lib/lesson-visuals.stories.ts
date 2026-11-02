import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  type Block,
  type BlockKind,
  loadBuiltInLessons,
} from '@ah/products/studylm/lessons';
import { QuizCheck } from './checks/choice-checks';
import { SteppedVisual } from './player/stepped-visual';
import { ChartView } from './visuals/chart-view';

/** The first block of each kind in the built-in lessons, as story data. */
async function firstOfEachKind(): Promise<Partial<Record<BlockKind, Block>>> {
  const out: Partial<Record<BlockKind, Block>> = {};
  for (const lesson of await loadBuiltInLessons()) {
    for (const block of lesson.sections.flatMap((s) => s.blocks)) {
      out[block.kind] ??= block;
    }
  }
  return { ...out };
}

const meta: Meta = {
  title: 'StudyLM/Lesson visuals',
  loaders: [async () => ({ blocks: await firstOfEachKind() })],
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj;

/** A stepped visual from the built-in lessons, before its first step. */
function visual(kind: BlockKind): Story {
  return {
    name: kind,
    render: (_args, { loaded }) => ({
      props: { block: (loaded['blocks'] as Record<string, Block>)[kind] },
      moduleMetadata: { imports: [SteppedVisual] },
      template: `<sl-stepped-visual [block]="block" />`,
    }),
  };
}

export const Array = visual('array');
export const StackQueue = visual('stack-queue');
export const HashTable = visual('hash-table');
export const Tree = visual('tree');
export const Graph = visual('graph');
export const Grid = visual('grid');
export const RecursionTree = visual('recursion-tree');
export const Flow = visual('flow');
export const Sequence = visual('sequence');
export const StateMachine = visual('state-machine');
export const Pipeline = visual('pipeline');
export const EventLoop = visual('event-loop');
export const GitGraph = visual('git-graph');
export const ConceptMap = visual('concept-map');
export const CodeWalkthrough = visual('code-walkthrough');
export const CodeTrace = visual('code-trace');

export const Chart: Story = {
  name: 'chart',
  render: (_args, { loaded }) => ({
    props: { block: (loaded['blocks'] as Record<string, Block>)['chart'] },
    moduleMetadata: { imports: [ChartView] },
    template: `<sl-chart-view [block]="block" />`,
  }),
};

export const Quiz: Story = {
  name: 'quiz check',
  render: (_args, { loaded }) => ({
    props: { block: (loaded['blocks'] as Record<string, Block>)['quiz'] },
    moduleMetadata: { imports: [QuizCheck] },
    template: `<sl-quiz [block]="block" />`,
  }),
};
