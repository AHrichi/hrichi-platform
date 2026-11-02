import * as v from 'valibot';
import {
  CategorizeBlock,
  ClozeBlock,
  OrderStepsBlock,
  ParsonsBlock,
  PredictBlock,
  PredictOutputBlock,
  QuizBlock,
  SelfExplainBlock,
} from './checks';
import { CodeTraceBlock, CodeWalkthroughBlock } from './code';
import { ChartBlock, ConceptMapBlock } from './concepts';
import {
  ArrayBlock,
  GraphBlock,
  GridBlock,
  HashTableBlock,
  RecursionTreeBlock,
  StackQueueBlock,
  TreeBlock,
} from './dsa';
import {
  EventLoopBlock,
  FlowBlock,
  GitGraphBlock,
  PipelineBlock,
  SequenceBlock,
  StateMachineBlock,
} from './systems';
import { CalloutBlock, CompareBlock, ProseBlock } from './text';

/** Every block kind the AI may emit, with its schema. */
export const BLOCK_SCHEMAS = {
  prose: ProseBlock,
  callout: CalloutBlock,
  compare: CompareBlock,
  'code-walkthrough': CodeWalkthroughBlock,
  'code-trace': CodeTraceBlock,
  array: ArrayBlock,
  'stack-queue': StackQueueBlock,
  'hash-table': HashTableBlock,
  tree: TreeBlock,
  graph: GraphBlock,
  grid: GridBlock,
  'recursion-tree': RecursionTreeBlock,
  flow: FlowBlock,
  sequence: SequenceBlock,
  'state-machine': StateMachineBlock,
  pipeline: PipelineBlock,
  'event-loop': EventLoopBlock,
  'git-graph': GitGraphBlock,
  'concept-map': ConceptMapBlock,
  chart: ChartBlock,
  predict: PredictBlock,
  quiz: QuizBlock,
  'self-explain': SelfExplainBlock,
  'order-steps': OrderStepsBlock,
  categorize: CategorizeBlock,
  parsons: ParsonsBlock,
  'predict-output': PredictOutputBlock,
  cloze: ClozeBlock,
} as const;

export type BlockKind = keyof typeof BLOCK_SCHEMAS;
export const BLOCK_KINDS = Object.keys(BLOCK_SCHEMAS) as BlockKind[];

export type BlockOf<K extends BlockKind> = v.InferOutput<
  (typeof BLOCK_SCHEMAS)[K]
>;

export const BlockSchema = v.variant(
  'kind',
  Object.values(BLOCK_SCHEMAS) as [
    (typeof BLOCK_SCHEMAS)[BlockKind],
    ...(typeof BLOCK_SCHEMAS)[BlockKind][],
  ],
);
export type Block = { [K in BlockKind]: BlockOf<K> }[BlockKind];

/** How the catalog groups the kinds. */
export const BLOCK_FAMILIES = {
  text: ['prose', 'callout', 'compare'],
  code: ['code-walkthrough', 'code-trace'],
  dsa: [
    'array',
    'stack-queue',
    'hash-table',
    'tree',
    'graph',
    'grid',
    'recursion-tree',
  ],
  systems: [
    'flow',
    'sequence',
    'state-machine',
    'pipeline',
    'event-loop',
    'git-graph',
  ],
  concepts: ['concept-map', 'chart'],
  checks: [
    'predict',
    'quiz',
    'self-explain',
    'order-steps',
    'categorize',
    'parsons',
    'predict-output',
    'cloze',
  ],
} as const satisfies Record<string, readonly BlockKind[]>;

export type BlockFamily = keyof typeof BLOCK_FAMILIES;

export const CHECK_KINDS: readonly BlockKind[] = BLOCK_FAMILIES.checks;

/** Kinds that play as a sequence of steps or frames. */
export const STEPPED_KINDS: readonly BlockKind[] = [
  'code-walkthrough',
  'code-trace',
  ...BLOCK_FAMILIES.dsa,
  ...BLOCK_FAMILIES.systems,
  'concept-map',
];

export function familyOf(kind: BlockKind): BlockFamily {
  for (const [family, kinds] of Object.entries(BLOCK_FAMILIES)) {
    if ((kinds as readonly BlockKind[]).includes(kind)) {
      return family as BlockFamily;
    }
  }
  throw new Error(`Unknown block kind: ${kind}`);
}

export * from './checks';
export * from './code';
export * from './concepts';
export * from './dsa';
export * from './systems';
export * from './text';
