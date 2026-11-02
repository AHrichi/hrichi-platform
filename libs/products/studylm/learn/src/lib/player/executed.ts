import type { BlockOf, Step } from '@ah/products/studylm/lessons';
import {
  type ExecutedFrame,
  type LoopEvent,
  runJavaScript,
} from '@ah/products/studylm/tracer';
import type { ShownFrame } from '../visuals/code-trace-view';

/** A code trace ready to play: its frames, and a step per frame. */
export interface PlayedTrace {
  frames: ShownFrame[];
  steps: Step<never>[];
  executed: boolean;
  /** Why the run fell short, if it did. */
  note: string | null;
}

const asStep = (id: string, title: string, narration: string): Step<never> => ({
  id,
  title,
  narration,
  focus: [],
  ops: [],
  pauseFor: null,
});

/** What changed since the frame before, in words. */
function describe(frame: ExecutedFrame, before: ExecutedFrame | null): string {
  const was = new Map(
    before?.vars.map((v) => [`${v.scope}.${v.name}`, v.value]),
  );
  const changed = frame.vars
    .filter((v) => was.get(`${v.scope}.${v.name}`) !== v.value)
    .slice(0, 3)
    .map((v) => `${v.name} = ${v.value}`);
  const printed =
    before && frame.output.length > before.output.length
      ? ` Printed: ${frame.output.slice(before.output.length).trim()}.`
      : '';
  return `${changed.length ? `Now ${changed.join(', ')}.` : 'Nothing changed yet.'}${printed}`;
}

/**
 * Plays a code trace. JavaScript in execute mode is run by the tracer, so
 * every frame is real; anything else plays the frames the AI wrote.
 */
export function playCodeTrace(block: BlockOf<'code-trace'>): PlayedTrace {
  if (block.mode === 'execute' && block.language === 'javascript') {
    const run = runJavaScript(block.code, { call: block.call });
    const frames = run.frames;
    return {
      frames,
      steps: frames.map((f, i) =>
        asStep(
          `f${i + 1}`,
          `Line ${f.line}`,
          describe(f, frames[i - 1] ?? null),
        ),
      ),
      executed: true,
      note: run.error
        ? `The code stopped with ${run.error}.`
        : run.truncated
          ? 'The run was cut short: it took too many steps.'
          : run.totalFrames > frames.length
            ? `Showing the first ${frames.length} of ${run.totalFrames} steps.`
            : null,
    };
  }
  return {
    frames: block.frames.map((f) => ({
      line: f.line,
      vars: f.vars,
      stack: f.stack,
      output: f.output ?? '',
    })),
    steps: block.frames.map((f) => asStep(f.id, `Line ${f.line}`, f.narration)),
    executed: false,
    note: null,
  };
}

type LoopOp = BlockOf<'event-loop'>['steps'][number]['ops'][number];

const SAYS: Record<LoopEvent['op'], (label: string) => [string, string]> = {
  'push-stack': (l) => [
    `Run ${l}`,
    `${l} goes on the call stack and runs from top to bottom.`,
  ],
  'pop-stack': () => ['Done', 'The call stack is empty again.'],
  'web-api': (l) => [
    `Hand off ${l}`,
    `The browser holds ${l}; the code carries on without waiting.`,
  ],
  'queue-task': (l) => [
    `${l} is due`,
    `Its timer is up, so ${l} joins the task queue.`,
  ],
  'queue-microtask': (l) => [
    `Queue ${l}`,
    `${l} joins the microtask queue. It runs as soon as the stack is empty.`,
  ],
  'run-task': (l) => [
    `Run the task ${l}`,
    `The stack and the microtasks are empty, so the oldest task runs: ${l}.`,
  ],
  'run-microtask': (l) => [
    `Run the microtask ${l}`,
    `The stack is empty: microtasks run before any task.`,
  ],
  log: (l) => [`Print ${l}`, `console.log prints ${l}.`],
};

/**
 * The event loop's steps: recorded by running the code in execute mode, or
 * as the AI wrote them. A run step takes its logs and its return with it.
 */
export function playEventLoop(block: BlockOf<'event-loop'>): {
  steps: Step<LoopOp>[];
  note: string | null;
} {
  if (block.mode !== 'execute') return { steps: block.steps, note: null };
  const run = runJavaScript(block.code);
  if (run.error && !run.events.length) return { steps: [], note: run.error };
  const steps: Step<LoopOp>[] = [];
  for (const event of run.events) {
    const op = { op: event.op, label: event.label } as LoopOp;
    const last = steps.at(-1);
    const inRun =
      last &&
      last.ops[0].op.startsWith('run-') &&
      last.ops.at(-1)?.op !== 'pop-stack' &&
      last.ops.length < 6;
    if (inRun && (event.op === 'log' || event.op === 'pop-stack')) {
      last.ops.push(op);
      if (event.op === 'log') last.narration += ` It prints ${event.label}.`;
      continue;
    }
    const [title, narration] = SAYS[event.op](event.label ?? '');
    steps.push({
      id: `e${steps.length + 1}`,
      title,
      narration,
      focus: [],
      ops: [op],
      pauseFor: null,
    });
  }
  return {
    steps: steps.slice(0, 40),
    note: run.error ? `The code stopped with ${run.error}.` : null,
  };
}

/** The output to expect: the tracer's for JavaScript in execute mode. */
export function expectedOutput(block: BlockOf<'predict-output'>): {
  expected: string;
  executed: boolean;
  corrected: boolean;
} {
  if (block.mode === 'execute' && block.language === 'javascript') {
    const run = runJavaScript(block.code);
    if (!run.error && !run.truncated) {
      return {
        expected: run.output,
        executed: true,
        corrected: run.output.trim() !== block.expected.trim(),
      };
    }
  }
  return { expected: block.expected, executed: false, corrected: false };
}
