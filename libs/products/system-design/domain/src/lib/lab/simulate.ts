import {
  DEFAULT_HIT_RATIO,
  LAB_CATALOG,
  MAX_HIT_RATIO,
} from '../content/lab/catalog';
import type {
  LabDesign,
  LabKind,
  LabNode,
  NodeResult,
  SimResult,
  Traffic,
} from './model';

/*
 * The Design Lab simulator (technical-design §8). Deterministic and
 * deliberately simple: every rule is a teaching approximation, not a queueing
 * model of a real system.
 *
 * 1. Shape. One client; links form a DAG from it; links to missing nodes are
 *    reported and ignored. The client reaches one entry point (or a set of
 *    load balancers, which stands for a DNS-fronted pair).
 * 2. Flow. Traffic leaves the client as three classes: static (s), reads
 *    ((1−s)·r) and writes ((1−s)·(1−r)). Nodes are visited in topological
 *    order, so each one sees all of its input before forwarding:
 *    - a CDN answers static requests and forwards the rest;
 *    - a load balancer splits evenly across its up downstream nodes;
 *    - a server sends static requests to object storage (or answers them),
 *      reads to a linked cache, else evenly across up replicas, else the
 *      database, and writes to a linked queue, else the database;
 *    - a cache answers its hit ratio and forwards misses as above;
 *    - a queue ends the user-visible path; workers drain it into the database.
 * 3. Per node. capacity = per-instance × instances (0 when down), ρ = λ / capacity
 *    (a database adds reads/readCap + writes/writeCap), p50 = base / (1 − min(ρ, 0.95)).
 *    Above ρ = 1 the node drops 1 − 1/ρ of everything through it and p50 = base × 20.
 * 4. End to end. A path's p50 is the sum of its nodes' p50s and its
 *    p95 = 2.5 × p50 + 50 ms per node on it with ρ > 0.8. Overall numbers are
 *    share-weighted. Drops behind a queue are a growing backlog, not errors.
 * 5. Cost = Σ instances × unit cost (flat for managed services).
 */

/** Utilisation above which a node is "hot" and adds a p95 penalty. */
export const HOT_UTILIZATION = 0.8;
/** The utilisation p50 saturates at, so latency stays finite below overload. */
export const UTILIZATION_CAP = 0.95;
/** p50 multiplier for an overloaded (ρ > 1) or down node. */
export const OVERLOAD_FACTOR = 20;
/** p95 = P95_FACTOR × p50 + HOT_PENALTY_MS per hot node on the path. */
export const P95_FACTOR = 2.5;
export const HOT_PENALTY_MS = 50;
/** Losing a node that fails at least this share of requests makes it a single point of failure. */
export const SPOF_ERROR_SHARE = 0.1;

type FlowClass = 'static' | 'read' | 'write';

interface Flow {
  cls: FlowClass;
  /** Share of all offered requests, 0–1. */
  share: number;
  /** The fraction still flowing after every node so far. */
  alive: number;
  /** The fraction not yet dropped on the user-visible path. */
  syncAlive: number;
  /** Node ids on the user-visible path (the client excluded). */
  path: string[];
  /** Past a queue: drops here are backlog, not errors. */
  async: boolean;
  /** Where a cache sends its misses (the server's read targets). */
  missTargets?: readonly string[];
}

interface Ending {
  share: number;
  path: readonly string[];
  /** The fraction answered; the rest failed. */
  answered: number;
}

interface Graph {
  byId: Map<string, LabNode>;
  outs: Map<string, string[]>;
  ins: Map<string, string[]>;
}

/** "Web server 2": the catalogue label, numbered when a design has several of a kind. */
export function labNodeLabel(
  design: Pick<LabDesign, 'nodes'>,
  node: Pick<LabNode, 'id' | 'kind'>,
): string {
  const same = design.nodes.filter((n) => n.kind === node.kind);
  const base = LAB_CATALOG[node.kind].label;
  if (same.length < 2) return base;
  return `${base} ${same.findIndex((n) => n.id === node.id) + 1}`;
}

export function designCost(design: Pick<LabDesign, 'nodes'>): number {
  let cost = 0;
  for (const n of design.nodes) {
    const spec = LAB_CATALOG[n.kind];
    cost += spec.flatCost ? spec.cost : spec.cost * n.instances;
  }
  return cost;
}

export function hitRatioOf(node: Pick<LabNode, 'hitRatio'>): number {
  const h = node.hitRatio ?? DEFAULT_HIT_RATIO;
  return Math.min(MAX_HIT_RATIO, Math.max(0, h));
}

function buildGraph(design: LabDesign, problems: string[]): Graph {
  const byId = new Map(design.nodes.map((n) => [n.id, n]));
  const outs = new Map<string, string[]>();
  const ins = new Map<string, string[]>();
  for (const n of design.nodes) {
    outs.set(n.id, []);
    ins.set(n.id, []);
  }
  for (const { from, to } of design.links) {
    if (!byId.has(from) || !byId.has(to)) {
      problems.push(
        `A link from “${from}” to “${to}” points at a missing component.`,
      );
      continue;
    }
    const list = outs.get(from) ?? [];
    if (from === to || list.includes(to)) continue;
    list.push(to);
    ins.get(to)?.push(from);
  }
  return { byId, outs, ins };
}

/** Reachable nodes in topological order, or null when the links loop. */
function topoOrder(graph: Graph, start: string): string[] | null {
  const reachable = new Set<string>([start]);
  const stack = [start];
  while (stack.length) {
    const id = stack.pop() as string;
    for (const to of graph.outs.get(id) ?? [])
      if (!reachable.has(to)) {
        reachable.add(to);
        stack.push(to);
      }
  }
  const indeg = new Map<string, number>();
  for (const id of reachable)
    indeg.set(
      id,
      (graph.ins.get(id) ?? []).filter((f) => reachable.has(f)).length,
    );
  const order: string[] = [];
  const ready = [...reachable].filter((id) => indeg.get(id) === 0);
  while (ready.length) {
    const id = ready.shift() as string;
    order.push(id);
    for (const to of graph.outs.get(id) ?? []) {
      const d = (indeg.get(to) ?? 0) - 1;
      indeg.set(to, d);
      if (d === 0) ready.push(to);
    }
  }
  return order.length === reachable.size ? order : null;
}

function brokenResult(design: LabDesign, problems: string[]): SimResult {
  return {
    nodes: design.nodes.map((n) => ({
      id: n.id,
      inRps: 0,
      capacity: 0,
      utilization: 0,
      p50: 0,
      dropped: 0,
    })),
    p50: 0,
    p95: 0,
    errorRate: 1,
    throughput: 0,
    cost: designCost(design),
    problems,
  };
}

interface Load {
  total: number;
  reads: number;
  writes: number;
  sync: number;
  async: number;
}

function utilization(
  node: LabNode,
  load: Load,
): { capacity: number; rho: number } {
  const spec = LAB_CATALOG[node.kind];
  const n = node.down ? 0 : node.instances;
  if (node.kind === 'database') {
    const readCap = (spec.readCapacity ?? spec.capacity) * n;
    const writeCap = (spec.writeCapacity ?? spec.capacity) * n;
    const part = (x: number, cap: number) =>
      x === 0 ? 0 : cap === 0 ? Infinity : x / cap;
    const rho = part(load.reads, readCap) + part(load.writes, writeCap);
    const capacity =
      rho > 0 && Number.isFinite(rho) ? load.total / rho : readCap;
    return { capacity, rho };
  }
  const capacity = spec.capacity * n;
  if (load.total === 0) return { capacity, rho: 0 };
  return { capacity, rho: capacity === 0 ? Infinity : load.total / capacity };
}

function nodeP50(base: number, rho: number): number {
  if (rho > 1) return base * OVERLOAD_FACTOR;
  return base / (1 - Math.min(rho, UTILIZATION_CAP));
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const fmt = (x: number) => Math.round(x).toLocaleString('en-US');

/** One pass of the rules; `simulate` adds the single-point-of-failure scan. */
function run(design: LabDesign, traffic: Traffic): SimResult {
  const problems: string[] = [];
  const clients = design.nodes.filter((n) => n.kind === 'client');
  if (clients.length === 0)
    return brokenResult(design, [
      'Add a client: traffic needs somewhere to come from.',
    ]);
  if (clients.length > 1)
    problems.push(
      `Use one client; this design has ${clients.length}. Only the first sends traffic.`,
    );
  const client = clients[0];

  const graph = buildGraph(design, problems);
  const order = topoOrder(graph, client.id);
  if (!order)
    return brokenResult(design, [
      ...problems,
      'The links form a loop, so requests would go round forever. Remove a link.',
    ]);

  const label = (id: string) => {
    const n = graph.byId.get(id);
    return n ? labNodeLabel(design, n) : id;
  };
  const kindOf = (id: string): LabKind | undefined => graph.byId.get(id)?.kind;
  const outsOf = (id: string, kinds?: readonly LabKind[]) =>
    (graph.outs.get(id) ?? []).filter((to) => {
      const k = kindOf(to);
      return k !== undefined && (!kinds || kinds.includes(k));
    });
  /** Up targets, or all of them when every one is down (so they fail visibly). */
  const pick = (ids: readonly string[]) => {
    const up = ids.filter((id) => !graph.byId.get(id)?.down);
    return up.length ? up : [...ids];
  };

  const inbox = new Map<string, Flow[]>(order.map((id) => [id, []]));
  const endings: Ending[] = [];
  const stranded = new Set<string>();
  const send = (targets: readonly string[], flow: Flow, fraction = 1) => {
    for (const to of targets)
      inbox
        .get(to)
        ?.push({ ...flow, share: (flow.share * fraction) / targets.length });
  };
  const end = (flow: Flow, answered: boolean, at: string) => {
    if (flow.async) return;
    if (!answered) stranded.add(at);
    endings.push({
      share: flow.share,
      path: flow.path,
      answered: answered ? flow.syncAlive : 0,
    });
  };
  /** Up replicas, else the database: where a server's reads land. */
  const readTargets = (id: string) => {
    const replicas = outsOf(id, ['replica']).filter(
      (r) => !graph.byId.get(r)?.down,
    );
    return replicas.length ? replicas : pick(outsOf(id, ['database']));
  };

  // 1. The client emits three classes to its entry point(s).
  const s = traffic.staticRatio;
  const r = traffic.readRatio;
  let entries = outsOf(client.id);
  if (
    entries.length > 1 &&
    entries.some((id) => kindOf(id) !== 'load-balancer')
  ) {
    problems.push('Clients reach one entry point: add a load balancer.');
    entries = entries.slice(0, 1);
  }
  const seeds: Flow[] = [
    { cls: 'static', share: s, alive: 1, syncAlive: 1, path: [], async: false },
    {
      cls: 'read',
      share: (1 - s) * r,
      alive: 1,
      syncAlive: 1,
      path: [],
      async: false,
    },
    {
      cls: 'write',
      share: (1 - s) * (1 - r),
      alive: 1,
      syncAlive: 1,
      path: [],
      async: false,
    },
  ].filter((f) => f.share > 0);
  if (entries.length === 0) {
    problems.push(
      'Connect the client to something: no request gets an answer.',
    );
    for (const f of seeds) end(f, false, client.id);
  } else {
    for (const f of seeds) send(pick(entries), f);
  }

  // 2. Visit every reachable node once, in topological order.
  const results = new Map<string, NodeResult>();
  const rhoOf = new Map<string, number>();
  for (const id of order) {
    if (id === client.id) continue;
    const node = graph.byId.get(id) as LabNode;
    const spec = LAB_CATALOG[node.kind];
    const flows = inbox.get(id) ?? [];
    const load: Load = { total: 0, reads: 0, writes: 0, sync: 0, async: 0 };
    for (const f of flows) {
      const rps = traffic.rps * f.share * f.alive;
      load.total += rps;
      if (f.cls === 'write') load.writes += rps;
      else load.reads += rps;
      if (f.async) load.async += rps;
      else load.sync += rps;
    }
    const { capacity, rho } = utilization(node, load);
    const drop = rho > 1 ? 1 - 1 / rho : 0;
    const p50 = nodeP50(spec.baseMs, rho);
    rhoOf.set(id, rho);
    results.set(id, {
      id,
      inRps: load.total,
      capacity,
      utilization: rho,
      p50,
      dropped: load.total * drop,
    });
    if (drop > 0 && load.sync > 0)
      problems.push(
        node.down
          ? `${label(id)} is down, so its requests fail.`
          : `Overloaded: ${label(id)} runs at ${pct(rho)} and drops ${pct(drop)} of its requests.`,
      );
    if (drop > 0 && load.async > 0 && !node.down)
      problems.push(
        `Backlog grows: ${label(id)} keeps up with ${fmt(load.async * (1 - drop))} of ${fmt(load.async)} queued writes a second.`,
      );

    for (const incoming of flows) {
      const f: Flow = {
        ...incoming,
        alive: incoming.alive * (1 - drop),
        syncAlive: incoming.async
          ? incoming.syncAlive
          : incoming.syncAlive * (1 - drop),
        path: incoming.async ? incoming.path : [...incoming.path, id],
      };
      route(node, f);
    }
  }

  function route(node: LabNode, f: Flow): void {
    const id = node.id;
    const generic = () => {
      const outs = outsOf(id);
      if (outs.length) send(pick(outs), f);
      else end(f, false, id);
    };
    switch (node.kind) {
      case 'cdn':
        if (f.cls === 'static') end(f, true, id);
        else generic();
        return;
      case 'load-balancer':
        generic();
        return;
      case 'server': {
        if (f.cls === 'static') {
          const stores = outsOf(id, ['storage']);
          if (stores.length) send(pick(stores), f);
          else end(f, true, id);
        } else if (f.cls === 'read') {
          const caches = outsOf(id, ['cache']);
          const targets = readTargets(id);
          if (caches.length) send(pick(caches), { ...f, missTargets: targets });
          else if (targets.length) send(targets, f);
          else end(f, true, id);
        } else {
          const queues = outsOf(id, ['queue']);
          const dbs = outsOf(id, ['database']);
          if (queues.length) send(pick(queues), f);
          else if (dbs.length) send(pick(dbs), f);
          else end(f, true, id);
        }
        return;
      }
      case 'cache': {
        if (f.cls !== 'read') return generic();
        const h = hitRatioOf(node);
        end({ ...f, share: f.share * h }, true, id);
        if (h >= 1) return;
        const targets = f.missTargets?.length ? f.missTargets : readTargets(id);
        const miss = { ...f, share: f.share * (1 - h), missTargets: undefined };
        if (targets.length) send(targets, miss);
        else end(miss, false, id);
        return;
      }
      case 'queue': {
        end(f, true, id);
        const workers = outsOf(id, ['worker']);
        const onward = workers.length ? workers : outsOf(id);
        if (onward.length) send(pick(onward), { ...f, async: true });
        return;
      }
      case 'worker': {
        const dbs = outsOf(id, ['database']);
        const onward = dbs.length ? dbs : outsOf(id);
        if (onward.length) send(pick(onward), f);
        return;
      }
      case 'database':
      case 'replica':
      case 'storage':
        end(f, true, id);
        return;
      default:
        generic();
    }
  }

  for (const id of stranded)
    if (id !== client.id)
      problems.push(
        `${label(id)} has nothing behind it to answer some requests.`,
      );
  for (const n of design.nodes)
    if (n.kind !== 'client' && !results.has(n.id))
      problems.push(`Not connected: ${label(n.id)}.`);

  // 4. End to end, share-weighted.
  let p50 = 0;
  let p95 = 0;
  let errors = 0;
  for (const e of endings) {
    let pathP50 = 0;
    let hot = 0;
    for (const id of e.path) {
      pathP50 += results.get(id)?.p50 ?? 0;
      if ((rhoOf.get(id) ?? 0) > HOT_UTILIZATION) hot++;
    }
    p50 += e.share * pathP50;
    p95 += e.share * (P95_FACTOR * pathP50 + HOT_PENALTY_MS * hot);
    errors += e.share * (1 - e.answered);
  }
  const errorRate = Math.min(1, Math.max(0, errors));

  return {
    nodes: design.nodes
      .map(
        (n) =>
          results.get(n.id) ??
          (n.kind === 'client'
            ? {
                id: n.id,
                inRps: 0,
                capacity: Infinity,
                utilization: 0,
                p50: 0,
                dropped: 0,
              }
            : {
                id: n.id,
                inRps: 0,
                capacity: 0,
                utilization: 0,
                p50: 0,
                dropped: 0,
              }),
      )
      .map((res) =>
        res.id === client.id
          ? { ...res, inRps: traffic.rps, capacity: Infinity }
          : res,
      ),
    p50,
    p95,
    errorRate,
    throughput: traffic.rps * (1 - errorRate),
    cost: designCost(design),
    problems,
  };
}

/** Takes one node down (every instance of it). */
export function withNodeDown(design: LabDesign, id: string): LabDesign {
  return {
    ...design,
    nodes: design.nodes.map((n) => (n.id === id ? { ...n, down: true } : n)),
  };
}

/**
 * Runs the rules, then flags single points of failure: nodes whose loss
 * alone would fail at least `SPOF_ERROR_SHARE` more of the requests.
 */
export function simulate(design: LabDesign, traffic: Traffic): SimResult {
  const result = run(design, traffic);
  if (result.errorRate >= 1) return result;
  const spofs: string[] = [];
  for (const n of design.nodes) {
    if (n.kind === 'client' || n.down) continue;
    if (!Number.isFinite(LAB_CATALOG[n.kind].capacity)) continue;
    const inRps = result.nodes.find((x) => x.id === n.id)?.inRps ?? 0;
    if (inRps === 0) continue;
    const without = run(withNodeDown(design, n.id), traffic);
    if (without.errorRate - result.errorRate >= SPOF_ERROR_SHARE)
      spofs.push(`Single point of failure: ${labNodeLabel(design, n)}.`);
  }
  return { ...result, problems: [...result.problems, ...spofs] };
}
