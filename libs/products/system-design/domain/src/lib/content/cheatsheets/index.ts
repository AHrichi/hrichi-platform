import type { CheatTerm } from '../../engine/search';
import type { Cheatsheet } from '../../model/cheatsheet';
import type { ModuleId } from '../../model/course';

export interface CheatsheetMeta {
  module: ModuleId;
  title: string;
  summary: string;
  ready: boolean;
  load: () => Promise<Cheatsheet>;
}

/** Extracts searchable terms (section titles and first-column entries) from a cheatsheet. */
export function cheatTermsFrom(sheet: Cheatsheet): CheatTerm[] {
  const terms: CheatTerm[] = [];
  const seen = new Set<string>();
  const push = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    terms.push({ module: sheet.module, title: trimmed });
  };

  for (const section of sheet.sections) {
    push(section.title);
    if (section.kind === 'numbers' || section.kind === 'table') {
      for (const row of section.rows) {
        if (row[0]) push(row[0]);
      }
    }
  }
  return terms;
}

export const CHEATSHEETS: readonly CheatsheetMeta[] = [
  {
    module: 'foundations',
    title: 'Foundations Cheatsheet',
    summary:
      'Latency numbers, powers of two, availability nines table, and RPS conversions.',
    ready: true,
    load: () => import('./foundations').then((m) => m.cheatsheet),
  },
  {
    module: 'scaling',
    title: 'Scaling Cheatsheet',
    summary:
      'Load-balancing algorithms, cache strategies, and hit-ratio maths.',
    ready: true,
    load: () => import('./scaling').then((m) => m.cheatsheet),
  },
  {
    module: 'data',
    title: 'Data & Storage Cheatsheet',
    summary:
      'Database families, isolation anomalies, and partitioning strategies.',
    ready: true,
    load: () => import('./data').then((m) => m.cheatsheet),
  },
  {
    module: 'communication',
    title: 'Communication Cheatsheet',
    summary: 'API styles, HTTP idempotency, and message delivery guarantees.',
    ready: true,
    load: () => import('./communication').then((m) => m.cheatsheet),
  },
  {
    module: 'reliability',
    title: 'Reliability Cheatsheet',
    summary:
      'Failure patterns and their remedies, breakers, rate limits, and backoff.',
    ready: true,
    load: () => import('./reliability').then((m) => m.cheatsheet),
  },
  {
    module: 'architecture',
    title: 'Architecture Cheatsheet',
    summary:
      'Monolith vs microservices trade-offs, saga styles, and batch vs stream.',
    ready: true,
    load: () => import('./architecture').then((m) => m.cheatsheet),
  },
  {
    module: 'security',
    title: 'Security Cheatsheet',
    summary: 'Token types, cryptographic primitives, and authorization models.',
    ready: true,
    load: () => import('./security').then((m) => m.cheatsheet),
  },
  {
    module: 'shipping',
    title: 'Shipping Cheatsheet',
    summary: 'Deploy strategies, expand/contract migrations, and test types.',
    ready: true,
    load: () => import('./shipping').then((m) => m.cheatsheet),
  },
  {
    module: 'case-studies',
    title: 'Case Studies Cheatsheet',
    summary:
      'The design method checklist, an estimate template, and classic problems.',
    ready: true,
    load: () => import('./case-studies').then((m) => m.cheatsheet),
  },
];

export function findCheatsheet(module: ModuleId): CheatsheetMeta | undefined {
  return CHEATSHEETS.find((c) => c.module === module);
}

/**
 * Pre-indexed cheatsheet terms for synchronous course search (`searchCourse`),
 * so the search dialog never has to load every sheet. Generated from the
 * sheets with `cheatTermsFrom`; the content spec fails when it drifts.
 */
export { CHEAT_TERMS } from './terms';
