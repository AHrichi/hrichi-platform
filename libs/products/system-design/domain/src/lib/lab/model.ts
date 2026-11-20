/**
 * The Design Lab's contracts (technical-design §8). A design is a small graph
 * of components the learner wires together; `simulate()` turns it and a
 * traffic profile into per-node load and end-to-end numbers.
 */

export type LabKind =
  | 'client'
  | 'cdn'
  | 'load-balancer'
  | 'server'
  | 'cache'
  | 'database'
  | 'replica'
  | 'queue'
  | 'worker'
  | 'storage';

export interface LabNode {
  id: string;
  kind: LabKind;
  /** 1–20. One node is one failure domain: `down` takes out every instance. */
  instances: number;
  /** Caches only, 0–0.99. Defaults to the catalogue's 0.8. */
  hitRatio?: number;
  down?: boolean;
}

export interface LabLink {
  from: string;
  to: string;
}

export interface LabDesign {
  nodes: LabNode[];
  links: LabLink[];
}

export interface Traffic {
  /** Requests per second, 10–200,000. */
  rps: number;
  /** The share of dynamic requests that read, 0–1. */
  readRatio: number;
  /** The share of all requests for static files, 0–1. */
  staticRatio: number;
}

export interface NodeResult {
  id: string;
  inRps: number;
  /** Requests per second the node can take at the current mix; `Infinity` when unbounded. */
  capacity: number;
  /** ρ: offered load over capacity. Above 1 the node drops traffic. */
  utilization: number;
  p50: number;
  /** Requests per second this node drops (or defers, behind a queue). */
  dropped: number;
}

export interface SimResult {
  nodes: NodeResult[];
  p50: number;
  p95: number;
  /** 0–1: the share of user requests that fail. */
  errorRate: number;
  /** Successful requests per second. */
  throughput: number;
  cost: number;
  /** Plain-English warnings. */
  problems: string[];
}

export interface ChallengeGoals {
  maxP95?: number;
  /** 0–1. */
  maxErrorRate?: number;
  maxCost?: number;
  /** Kinds whose nodes are taken down one at a time; the design must keep serving. */
  survivesAnySingleFailure?: LabKind[];
}

export interface LabChallenge {
  id: string;
  title: string;
  brief: string;
  traffic: Traffic;
  goals: ChallengeGoals;
  starter: LabDesign;
  hint: string;
}

export type GoalId = 'maxP95' | 'maxErrorRate' | 'maxCost' | 'survives';

export interface GoalCheck {
  id: GoalId;
  /** Plain English, for example "p95 ≤ 150 ms". */
  label: string;
  met: boolean;
  /** What the design achieves, formatted, for example "117.8 ms". */
  actual: string;
}

export interface ChallengeCheck {
  result: SimResult;
  goals: GoalCheck[];
  solved: boolean;
}
