import type { BlockKind, BlockOf } from '../spec/blocks';
import type { Step } from '../spec/step';

/**
 * Contracts for the engines that compute what the AI only describes. With
 * `simulate`, the AI picks an algorithm and an input; a simulator turns
 * them into steps, so the steps are always right. JavaScript is executed
 * by a tracer rather than traced by the model. These are the shapes the
 * engines will produce (built in a later phase).
 */

/** The op type a stepped block's steps carry. */
export type OpOf<K extends BlockKind> =
  BlockOf<K> extends {
    steps: readonly Step<infer TOp>[];
  }
    ? TOp
    : never;

/** Kinds whose steps a simulator can produce from `simulate`. */
export type SimulatedKind =
  'array' | 'tree' | 'graph' | 'grid' | 'recursion-tree';

/** Turns a block's `simulate` into steps, in the same format the AI writes. */
export type Simulator<K extends SimulatedKind> = (
  block: BlockOf<K>,
) => Step<OpOf<K>>[];

/** One frame of an executed program, like the frames a scripted trace has. */
export interface ExecutedFrame {
  line: number;
  vars: { scope: string; name: string; value: string }[];
  stack: string[];
  output: string;
}

/** What the JavaScript tracer returns for `code-trace` and `predict-output`. */
export interface Trace {
  frames: ExecutedFrame[];
  /** Everything printed. */
  output: string;
  /** True when the run hit the frame limit and was cut short. */
  truncated: boolean;
  /** The error the program threw, if any. */
  error: string | null;
}

/** The event-loop steps the tracer records for `event-loop` in execute mode. */
export type EventLoopTrace = Step<OpOf<'event-loop'>>[];

/** Input to the layered layout used by graph, flow, tree and concept maps. */
export interface LayoutInput {
  direction: 'lr' | 'tb';
  nodes: { id: string; width: number; height: number }[];
  edges: { id: string; from: string; to: string }[];
}

/** Positions in layout units; the renderer scales them to its viewBox. */
export interface LayoutOutput {
  width: number;
  height: number;
  nodes: { id: string; x: number; y: number }[];
  edges: { id: string; points: [number, number][] }[];
}
