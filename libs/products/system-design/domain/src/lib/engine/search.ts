import type { CourseModule, ModuleId } from '../model/course';

/** A cheatsheet entry search can find: a section title or a table's first column. */
export interface CheatTerm {
  module: ModuleId;
  title: string;
}

export interface SearchHit {
  kind: 'lesson' | 'cheatsheet';
  /** Lesson id, or module id for a cheatsheet. */
  id: string;
  title: string;
  /** The module title, or the lesson summary. */
  detail: string;
  score: number;
}

const tokens = (q: string) =>
  q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/**
 * Case-insensitive token search. Every query token must match somewhere.
 * Scores: title prefix 5, title 3, keyword 2, summary or module 1, and 1 for
 * a cheatsheet term. Best 12 hits.
 */
export function searchCourse(
  query: string,
  modules: readonly CourseModule[],
  cheatTerms: readonly CheatTerm[] = [],
): SearchHit[] {
  const q = tokens(query);
  if (q.length === 0) return [];
  const hits: SearchHit[] = [];

  for (const m of modules) {
    for (const l of m.lessons) {
      const title = l.title.toLowerCase();
      const keys = l.keywords.map((k) => k.toLowerCase());
      const rest = `${l.summary} ${m.title}`.toLowerCase();
      let score = 0;
      let all = true;
      for (const t of q) {
        let best = 0;
        if (tokens(title).some((w) => w.startsWith(t))) best = 3;
        if (title.startsWith(t)) best = 5;
        if (!best && keys.some((k) => k.includes(t))) best = 2;
        if (!best && rest.includes(t)) best = 1;
        if (!best) all = false;
        score += best;
      }
      if (all)
        hits.push({
          kind: 'lesson',
          id: l.id,
          title: l.title,
          detail: l.summary,
          score,
        });
    }
  }

  for (const term of cheatTerms) {
    const text = term.title.toLowerCase();
    if (q.every((t) => text.includes(t))) {
      const module = modules.find((m) => m.id === term.module);
      hits.push({
        kind: 'cheatsheet',
        id: term.module,
        title: term.title,
        detail: module ? `${module.title} cheatsheet` : 'Cheatsheet',
        score: q.length,
      });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 12);
}
