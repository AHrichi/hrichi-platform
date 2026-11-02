import * as v from 'valibot';
import { Caption, Code, Id, LIMITS, list, Ref, text } from '../primitives';
import { stepsSchema } from '../step';

// --- flow: data moving through a system ------------------------------------

export const FLOW_NODE_TYPES = [
  'user',
  'browser',
  'client',
  'gateway',
  'server',
  'service',
  'function',
  'database',
  'cache',
  'queue',
  'storage',
  'external',
  'process',
] as const;

export const FLOW_OPS = [
  'send',
  'respond',
  'process',
  'store',
  'fail',
  'highlight',
] as const;

export const FlowOp = v.strictObject({
  op: v.picklist(FLOW_OPS),
  node: v.nullable(Ref),
  edge: v.nullable(Ref),
  packet: v.nullable(text(32, 'The packet\'s label, such as "GET /users".')),
  payload: v.nullable(
    text(
      LIMITS.payloadChars,
      'A preview of what the packet carries, such as a JSON snippet.',
    ),
  ),
});

export const FlowBlock = v.strictObject({
  id: Id,
  kind: v.literal('flow'),
  title: Caption,
  direction: v.pipe(
    v.picklist(['lr', 'tb']),
    v.description('lr: left to right; tb: top to bottom.'),
  ),
  nodes: list(
    v.strictObject({
      id: Id,
      label: text(24, "The component's name."),
      type: v.picklist(FLOW_NODE_TYPES),
      note: v.nullable(text(80, 'A short detail shown under the label.')),
    }),
    2,
    LIMITS.flowNodes,
    'The components.',
  ),
  edges: list(
    v.strictObject({
      id: Id,
      from: Ref,
      to: Ref,
      label: v.nullable(text(24, 'The protocol or channel, such as "HTTPS".')),
    }),
    1,
    LIMITS.flowEdges,
    'The connections.',
  ),
  steps: stepsSchema(
    FlowOp,
    "send (edge, packet, payload): a packet travels from the edge's from to its to; respond (edge, packet, payload): it travels back from to to from; process or store (node, packet); fail (node or edge, packet); highlight (node or edge).",
  ),
});

// --- sequence: messages between actors over time ----------------------------

export const ACTOR_TYPES = [
  'user',
  'browser',
  'client',
  'server',
  'service',
  'database',
  'cache',
  'queue',
  'external',
] as const;
export const MESSAGE_STYLES = ['sync', 'async', 'reply', 'self'] as const;
export const SEQUENCE_OPS = ['show', 'highlight', 'note'] as const;

export const SequenceOp = v.strictObject({
  op: v.picklist(SEQUENCE_OPS),
  message: v.nullable(Ref),
  actor: v.nullable(Ref),
  text: v.nullable(text(120, 'The note, for note.')),
});

export const SequenceBlock = v.strictObject({
  id: Id,
  kind: v.literal('sequence'),
  title: Caption,
  actors: list(
    v.strictObject({
      id: Id,
      label: text(24, "The actor's name."),
      type: v.picklist(ACTOR_TYPES),
    }),
    2,
    LIMITS.actors,
    'The participants, left to right.',
  ),
  messages: list(
    v.strictObject({
      id: Id,
      from: Ref,
      to: Ref,
      label: text(48, 'What is sent, such as "SELECT * FROM users".'),
      style: v.pipe(
        v.picklist(MESSAGE_STYLES),
        v.description(
          'sync: a call that waits; async: fire and forget; reply: an answer; self: from and to are the same actor.',
        ),
      ),
    }),
    1,
    LIMITS.messages,
    'The messages, in the order they happen.',
  ),
  steps: stepsSchema(
    SequenceOp,
    'show (message): the message appears; highlight (message or actor); note (actor, text).',
  ),
});

// --- state machine ------------------------------------------------------------

export const STATE_MACHINE_OPS = ['fire', 'reject'] as const;

export const StateMachineOp = v.strictObject({
  op: v.picklist(STATE_MACHINE_OPS),
  transition: v.nullable(
    v.pipe(Ref, v.description('For fire: the transition taken.')),
  ),
  event: v.nullable(
    text(24, 'For reject: an event the current state does not handle.'),
  ),
});

export const StateMachineBlock = v.strictObject({
  id: Id,
  kind: v.literal('state-machine'),
  title: Caption,
  states: list(
    v.strictObject({
      id: Id,
      label: text(24, "The state's name."),
      initial: v.pipe(
        v.boolean(),
        v.description('Exactly one state is initial.'),
      ),
      final: v.boolean(),
    }),
    2,
    LIMITS.states,
    'The states.',
  ),
  transitions: list(
    v.strictObject({
      id: Id,
      from: Ref,
      to: Ref,
      event: text(24, 'The event that triggers it.'),
    }),
    1,
    LIMITS.transitions,
    'The transitions.',
  ),
  steps: stepsSchema(
    StateMachineOp,
    'fire (transition): it must leave the current state; reject (event): an event the current state ignores.',
  ),
});

// --- pipeline: data transformed stage by stage -------------------------------

export const PIPELINE_OPS = ['enter', 'transform', 'emit', 'fail'] as const;

export const PipelineOp = v.strictObject({
  op: v.picklist(PIPELINE_OPS),
  stage: v.nullable(Ref),
  data: v.nullable(
    text(LIMITS.payloadChars, 'The data as it looks after this op.'),
  ),
});

export const PipelineBlock = v.strictObject({
  id: Id,
  kind: v.literal('pipeline'),
  title: Caption,
  stages: list(
    v.strictObject({
      id: Id,
      label: text(24, "The stage's name."),
      detail: v.nullable(text(120, 'What the stage does.')),
    }),
    2,
    LIMITS.stages,
    'The stages, in order.',
  ),
  steps: stepsSchema(
    PipelineOp,
    'enter (stage, data); transform (stage, data); emit (stage, data): the result leaves the pipeline; fail (stage, data).',
  ),
});

// --- event loop ----------------------------------------------------------------

export const EVENT_LOOP_OPS = [
  'push-stack',
  'pop-stack',
  'web-api',
  'queue-task',
  'queue-microtask',
  'run-task',
  'run-microtask',
  'log',
] as const;

export const EventLoopOp = v.strictObject({
  op: v.picklist(EVENT_LOOP_OPS),
  label: v.nullable(
    text(
      48,
      'The frame, callback or text logged. Null only for pop-stack, run-task and run-microtask.',
    ),
  ),
});

export const EventLoopBlock = v.strictObject({
  id: Id,
  kind: v.literal('event-loop'),
  title: Caption,
  code: Code,
  mode: v.pipe(
    v.picklist(['execute', 'scripted']),
    v.description(
      'execute: the app runs the JavaScript and records the steps, so leave steps empty. scripted: you write the steps.',
    ),
  ),
  steps: stepsSchema(
    EventLoopOp,
    'push-stack (label); pop-stack; web-api (label: a timer or request handed to the browser); queue-task or queue-microtask (label); run-task and run-microtask move the oldest callback onto the stack; log (label). A task runs only when the stack and the microtask queue are empty.',
  ),
});

// --- git graph -------------------------------------------------------------------

export const GIT_OPS = [
  'commit',
  'branch',
  'checkout',
  'merge',
  'rebase',
  'tag',
  'reset',
] as const;

export const GitOp = v.strictObject({
  op: v.picklist(GIT_OPS),
  ref: v.nullable(
    text(
      24,
      'The branch or tag name, for branch, checkout, merge, rebase and tag.',
    ),
  ),
  commit: v.nullable(
    v.pipe(
      Id,
      v.description(
        'The id of the new commit, for commit and merge; the target, for reset.',
      ),
    ),
  ),
  message: v.nullable(text(48, 'The commit message, for commit and merge.')),
});

export const GitGraphBlock = v.strictObject({
  id: Id,
  kind: v.literal('git-graph'),
  title: Caption,
  start: v.strictObject({
    branch: text(24, 'The first branch, usually "main".'),
    commit: v.pipe(Id, v.description('The id of the first commit.')),
  }),
  steps: stepsSchema(
    GitOp,
    'commit (commit, message) on the current branch; branch (ref) at HEAD; checkout (ref); merge (ref, commit, message) into the current branch; rebase (ref): replay the current branch onto ref; tag (ref); reset (commit).',
  ),
});
