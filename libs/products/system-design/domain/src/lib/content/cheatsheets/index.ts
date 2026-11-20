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

function pendingCheatsheet(module: ModuleId, summary: string): Cheatsheet {
  return {
    module,
    intro: summary,
    sections: [],
  };
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
    summary: 'Load-balancing algorithms and cache strategies.',
    ready: false,
    load: () =>
      Promise.resolve(
        pendingCheatsheet(
          'scaling',
          'Load-balancing algorithms and cache strategies.',
        ),
      ),
  },
  {
    module: 'data',
    title: 'Data & Storage Cheatsheet',
    summary:
      'Database families, isolation anomalies, and partitioning strategies.',
    ready: false,
    load: () =>
      Promise.resolve(
        pendingCheatsheet(
          'data',
          'Database families, isolation anomalies, and partitioning strategies.',
        ),
      ),
  },
  {
    module: 'communication',
    title: 'Communication Cheatsheet',
    summary: 'API styles and message delivery guarantees.',
    ready: false,
    load: () =>
      Promise.resolve(
        pendingCheatsheet(
          'communication',
          'API styles and message delivery guarantees.',
        ),
      ),
  },
  {
    module: 'reliability',
    title: 'Reliability Cheatsheet',
    summary: 'Failure patterns and their remedies.',
    ready: false,
    load: () =>
      Promise.resolve(
        pendingCheatsheet(
          'reliability',
          'Failure patterns and their remedies.',
        ),
      ),
  },
  {
    module: 'architecture',
    title: 'Architecture Cheatsheet',
    summary: 'Monolith vs microservices trade-offs and saga styles.',
    ready: false,
    load: () =>
      Promise.resolve(
        pendingCheatsheet(
          'architecture',
          'Monolith vs microservices trade-offs and saga styles.',
        ),
      ),
  },
  {
    module: 'security',
    title: 'Security Cheatsheet',
    summary: 'Token types and cryptographic primitives.',
    ready: false,
    load: () =>
      Promise.resolve(
        pendingCheatsheet(
          'security',
          'Token types and cryptographic primitives.',
        ),
      ),
  },
  {
    module: 'shipping',
    title: 'Shipping Cheatsheet',
    summary: 'Safe deployment and migration strategies.',
    ready: false,
    load: () =>
      Promise.resolve(
        pendingCheatsheet(
          'shipping',
          'Safe deployment and migration strategies.',
        ),
      ),
  },
  {
    module: 'case-studies',
    title: 'Case Studies Cheatsheet',
    summary: 'System design method checklist and estimation template.',
    ready: false,
    load: () =>
      Promise.resolve(
        pendingCheatsheet(
          'case-studies',
          'System design method checklist and estimation template.',
        ),
      ),
  },
];

export function findCheatsheet(module: ModuleId): CheatsheetMeta | undefined {
  return CHEATSHEETS.find((c) => c.module === module);
}

/** Pre-indexed cheatsheet terms for synchronous course search (`searchCourse`). */
export const CHEAT_TERMS: readonly CheatTerm[] = [
  { module: 'foundations', title: 'Latency Numbers by Order of Magnitude' },
  { module: 'foundations', title: 'Powers of Two & Storage Units' },
  { module: 'foundations', title: 'Availability & the Nines Table' },
  {
    module: 'foundations',
    title: 'Daily Volume to RPS Conversion (÷ 100,000 s/day)',
  },
  { module: 'foundations', title: 'Connection Reuse & Edge Placement' },
  { module: 'foundations', title: 'Headroom Below the Queueing Knee' },
  { module: 'foundations', title: '99.9% (3 nines)' },
  { module: 'foundations', title: '99.99% (4 nines)' },
];
