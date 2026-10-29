import type { Meta, StoryObj } from '@storybook/angular';
import { type ConceptGraphData, FlowChart } from './flow-chart';

const sampleEventLoopGraph: ConceptGraphData = {
  title: 'JavaScript Event Loop Execution Order',
  description: 'Deterministic tick dispatch: Call Stack -> Microtask Queue -> Render -> Macrotask Queue',
  direction: 'vertical',
  nodes: [
    {
      id: '1',
      label: 'Call Stack Execution',
      subtext: 'Synchronous bytecode runs to completion on the V8 engine thread',
      type: 'start',
      badge: 'Synchronous',
    },
    {
      id: '2',
      label: 'Drain Microtask Queue',
      subtext: 'Promise reactions, queueMicrotask callbacks run until queue is totally empty',
      type: 'highlight',
      badge: 'Zero Delay',
    },
    {
      id: '3',
      label: 'Animation & DOM Render Frame',
      subtext: 'requestAnimationFrame, layout recalculation and paint composite',
      type: 'process',
      badge: '60/120Hz',
    },
    {
      id: '4',
      label: 'Dispatch Macrotask (Task Queue)',
      subtext: 'Picks exactly ONE oldest callback from timer or I/O queue',
      type: 'end',
      badge: 'Next Tick',
    },
  ],
  edges: [
    { from: '1', to: '2', label: 'Stack Frame Empty' },
    { from: '2', to: '3', label: 'Microtasks Exhausted' },
    { from: '3', to: '4', label: 'UI Painted' },
  ],
  rawMermaid: `graph TD
  A[Call Stack: Synchronous Frame] -->|Stack Empty| B[Drain Microtasks: Promises]
  B -->|Queue Empty| C[DOM Render Frame: Layout/Paint]
  C -->|Next Tick| D[Macrotask: setTimeout / I/O]`,
};

const sampleScopeLookupGraph: ConceptGraphData = {
  title: 'Lexical Environment Scope Chain Traversal',
  description: 'Identifier resolution from inner closure to global window/globalThis',
  direction: 'horizontal',
  nodes: [
    {
      id: 'local',
      label: 'Local Execution Environment',
      subtext: 'Check arguments and declared let/const identifiers',
      type: 'start',
      badge: 'Step 1',
    },
    {
      id: 'outer',
      label: 'Outer Parent Closure Scope',
      subtext: 'Traverse [[Environment]] pointer to enclosing function',
      type: 'decision',
      badge: 'Step 2',
    },
    {
      id: 'global',
      label: 'Global Object / Environment Record',
      subtext: 'If not found, throws ReferenceError in strict mode',
      type: 'end',
      badge: 'Step 3',
    },
  ],
  edges: [
    { from: 'local', to: 'outer', label: 'Identifier missing' },
    { from: 'outer', to: 'global', label: 'Look up chain' },
  ],
};

const meta: Meta<FlowChart> = {
  title: 'Visualizations/FlowChart',
  component: FlowChart,
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    showCodeToggle: {
      control: 'boolean',
    },
  },
  args: {
    graph: sampleEventLoopGraph,
    direction: 'vertical',
    showCodeToggle: true,
  },
};

export default meta;
type Story = StoryObj<FlowChart>;

export const Vertical: Story = {};

export const Horizontal: Story = {
  args: {
    graph: sampleScopeLookupGraph,
    direction: 'horizontal',
  },
};

export const DecisionPipeline: Story = {
  args: {
    graph: {
      title: 'PostgreSQL MVCC Transaction Read Visibility',
      description: 'Determines whether a tuple version is visible to a snapshot',
      nodes: [
        {
          id: 'n1',
          label: 'Tuple xmin < Snapshot xmin',
          subtext: 'Created by transaction that committed before our snapshot started',
          type: 'start',
          badge: 'Check 1',
        },
        {
          id: 'n2',
          label: 'Tuple xmax Evaluation',
          subtext: 'Was tuple deleted or updated by another transaction?',
          type: 'decision',
          badge: 'Decision',
        },
        {
          id: 'n3',
          label: 'Tuple Visible',
          subtext: 'Return row data to query engine',
          type: 'highlight',
          badge: 'Visible',
        },
        {
          id: 'n4',
          label: 'Tuple Inactive / Deleted',
          subtext: 'Skip row version, inspect next tuple pointer',
          type: 'end',
          badge: 'Invisible',
        },
      ],
      edges: [
        { from: 'n1', to: 'n2', label: 'Committed' },
        { from: 'n2', to: 'n3', label: 'xmax not committed' },
        { from: 'n2', to: 'n4', label: 'xmax committed', style: 'dashed' },
      ],
    },
  },
};
