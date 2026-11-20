import {
  LAB_CATALOG,
  MAX_HIT_RATIO,
  MAX_INSTANCES,
  MIN_INSTANCES,
} from '../content/lab/catalog';
import type { LabDesign, LabKind, LabLink, LabNode } from './model';

/*
 * Pure edits on a design. Every function returns a new design and leaves the
 * input untouched, so the store can keep the previous one for undo or diffing.
 */

export const EMPTY_DESIGN: LabDesign = { nodes: [], links: [] };

export function cloneDesign(design: LabDesign): LabDesign {
  return {
    nodes: design.nodes.map((n) => ({ ...n })),
    links: design.links.map((l) => ({ ...l })),
  };
}

const hasLink = (links: readonly LabLink[], from: string, to: string) =>
  links.some((l) => l.from === from && l.to === to);

function uniqueLinks(links: readonly LabLink[]): LabLink[] {
  const out: LabLink[] = [];
  for (const l of links)
    if (l.from !== l.to && !hasLink(out, l.from, l.to)) out.push(l);
  return out;
}

export function outsOf(design: LabDesign, id: string): string[] {
  return design.links.filter((l) => l.from === id).map((l) => l.to);
}

export function insOf(design: LabDesign, id: string): string[] {
  return design.links.filter((l) => l.to === id).map((l) => l.from);
}

const ofKind = (design: LabDesign, kind: LabKind) =>
  design.nodes.filter((n) => n.kind === kind).map((n) => n.id);

/** `server-3`: the first free `<kind>-<n>`. */
export function newNodeId(design: LabDesign, kind: LabKind): string {
  const taken = new Set(design.nodes.map((n) => n.id));
  for (let i = 1; ; i++) {
    const id = `${kind}-${i}`;
    if (!taken.has(id)) return id;
  }
}

/** Whether the palette can add another of this kind (one client only). */
export function canAdd(design: LabDesign, kind: LabKind): boolean {
  return kind !== 'client' || !design.nodes.some((n) => n.kind === 'client');
}

/** Whether `to` can reach `from`, so a link from → to would close a loop. */
function reaches(design: LabDesign, from: string, to: string): boolean {
  const seen = new Set<string>();
  const stack = [from];
  while (stack.length) {
    const id = stack.pop() as string;
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...outsOf(design, id));
  }
  return false;
}

/** Nodes `from` could link to: not itself, not the client, not linked yet, no loops. */
export function connectableTargets(design: LabDesign, from: string): LabNode[] {
  return design.nodes.filter(
    (n) =>
      n.id !== from &&
      n.kind !== 'client' &&
      !hasLink(design.links, from, n.id) &&
      !reaches(design, n.id, from),
  );
}

export function connect(
  design: LabDesign,
  from: string,
  to: string,
): LabDesign {
  if (!connectableTargets(design, from).some((n) => n.id === to)) return design;
  return { ...design, links: [...design.links, { from, to }] };
}

export function disconnect(
  design: LabDesign,
  from: string,
  to: string,
): LabDesign {
  return {
    ...design,
    links: design.links.filter((l) => !(l.from === from && l.to === to)),
  };
}

export function removeNode(design: LabDesign, id: string): LabDesign {
  return {
    nodes: design.nodes.filter((n) => n.id !== id),
    links: design.links.filter((l) => l.from !== id && l.to !== id),
  };
}

export type LabNodePatch = Partial<
  Pick<LabNode, 'instances' | 'hitRatio' | 'down'>
>;

export function clampInstances(n: number): number {
  return Math.min(MAX_INSTANCES, Math.max(MIN_INSTANCES, Math.round(n)));
}

export function updateNode(
  design: LabDesign,
  id: string,
  patch: LabNodePatch,
): LabDesign {
  return {
    ...design,
    nodes: design.nodes.map((n) => {
      if (n.id !== id) return n;
      const next: LabNode = { ...n, ...patch };
      next.instances = LAB_CATALOG[n.kind].scalable
        ? clampInstances(next.instances)
        : 1;
      if (next.hitRatio !== undefined)
        next.hitRatio = Math.min(MAX_HIT_RATIO, Math.max(0, next.hitRatio));
      if (!next.down) delete next.down;
      return next;
    }),
  };
}

/** The node requests enter through: the CDN when it leads somewhere, else the client. */
function entryHolder(design: LabDesign): string | undefined {
  const cdn = ofKind(design, 'cdn').find((id) => outsOf(design, id).length > 0);
  return cdn ?? ofKind(design, 'client')[0];
}

/**
 * Adds a component and wires it where it usually goes, so one click makes a
 * working change:
 * - a second of a kind copies the first one's links (a server joins its
 *   siblings behind the same load balancer, a load balancer forms a pair);
 * - a CDN or the first load balancer slots in front of what the client
 *   (or CDN) reached;
 * - caches, queues, replicas and storage hang off every server; a database
 *   takes every server's and worker's writes; a worker drains every queue.
 */
export function addNode(
  design: LabDesign,
  kind: LabKind,
): { design: LabDesign; id: string } {
  if (!canAdd(design, kind)) return { design, id: '' };
  const id = newNodeId(design, kind);
  const node: LabNode = { id, kind, instances: 1 };
  const nodes = [...design.nodes, node];
  let links = [...design.links];
  const sibling = ofKind(design, kind)[0];

  if (sibling && kind !== 'cdn') {
    for (const from of insOf(design, sibling)) links.push({ from, to: id });
    for (const to of outsOf(design, sibling)) links.push({ from: id, to });
  } else {
    const servers = ofKind(design, 'server');
    switch (kind) {
      case 'cdn':
      case 'load-balancer': {
        const holder =
          kind === 'cdn' ? ofKind(design, 'client')[0] : entryHolder(design);
        if (!holder) break;
        const targets = outsOf(design, holder);
        links = links.filter((l) => l.from !== holder);
        links.push({ from: holder, to: id });
        const behind = targets.length
          ? targets
          : kind === 'load-balancer'
            ? servers
            : [];
        for (const to of behind) links.push({ from: id, to });
        break;
      }
      case 'server': {
        const lbs = ofKind(design, 'load-balancer');
        const holder = entryHolder(design);
        if (lbs.length) for (const from of lbs) links.push({ from, to: id });
        else if (holder && outsOf(design, holder).length === 0)
          links.push({ from: holder, to: id });
        for (const k of [
          'cache',
          'queue',
          'database',
          'replica',
          'storage',
        ] as const)
          for (const to of ofKind(design, k)) links.push({ from: id, to });
        break;
      }
      case 'cache':
      case 'queue':
      case 'replica':
      case 'storage':
        for (const from of servers) links.push({ from, to: id });
        if (kind === 'queue')
          for (const to of ofKind(design, 'worker'))
            links.push({ from: id, to });
        break;
      case 'database':
        for (const from of [...servers, ...ofKind(design, 'worker')])
          links.push({ from, to: id });
        break;
      case 'worker':
        for (const from of ofKind(design, 'queue'))
          links.push({ from, to: id });
        for (const to of ofKind(design, 'database').slice(0, 1))
          links.push({ from: id, to });
        break;
      case 'client': {
        const entry = design.nodes.find(
          (n) => n.kind !== 'client' && insOf(design, n.id).length === 0,
        );
        if (entry) links.push({ from: id, to: entry.id });
        break;
      }
    }
  }
  return { design: { nodes, links: uniqueLinks(links) }, id };
}
