import type { Concept, ConceptLink, LinkRelation } from '../records';
import { type Answer, CONFIDENT, type Question } from './decisions';

/**
 * Links between concepts (design §4.1, §6.3). When the AI drafts a
 * concept, a cheap word-overlap shortlist picks the existing concepts it
 * might relate to, and one decision call names the relation for each, or
 * none. Suggestions wait for the learner in the Inbox; a confirmed
 * "similar" or "contrasts" link gives the Daily Set its contrast cards.
 */

/** Concepts sent to the decision model for one new concept. */
export const MAX_LINK_CANDIDATES = 5;
/** Suggestions kept for one new concept, most confident first. */
export const MAX_LINKS_PER_CONCEPT = 3;

/** Relations that make two concepts worth comparing side by side. */
export const CONTRAST_RELATIONS: readonly LinkRelation[] = [
  'similar',
  'contrasts',
];

const STOP_WORDS = new Set(
  (
    'about above after again also because been before being between both ' +
    'could does doing down during each from further have having here into ' +
    'just more most once only other over same should some such than that ' +
    'their them then there these they this those through under until very ' +
    'were what when where which while with would your thing things something ' +
    'means mean using used make makes when whom whose will can'
  ).split(' '),
);

function wordsOf(concept: Concept): Set<string> {
  const text = [
    concept.title,
    concept.explanation.essence,
    ...concept.prompts.flatMap((prompt) => prompt.keyPoints),
  ]
    .join(' ')
    .toLowerCase();
  const words = new Set<string>();
  for (const word of text.match(/\p{L}[\p{L}\p{N}'-]*/gu) ?? []) {
    const stem = word.replace(/(ies|es|s)$/u, '');
    if (stem.length >= 4 && !STOP_WORDS.has(word)) words.add(stem);
  }
  return words;
}

/**
 * The concepts most likely related to `concept`, by shared words in title,
 * essence and key points (cosine over word sets). The concept itself,
 * deleted concepts and concepts sharing no word are left out.
 */
export function linkCandidates(
  concept: Concept,
  others: readonly Concept[],
  max = MAX_LINK_CANDIDATES,
): Concept[] {
  const mine = wordsOf(concept);
  if (!mine.size) return [];
  return others
    .filter((other) => other.id !== concept.id && !other.deletedAt)
    .map((other) => {
      const theirs = wordsOf(other);
      let shared = 0;
      for (const word of theirs) if (mine.has(word)) shared += 1;
      const score = theirs.size
        ? shared / Math.sqrt(mine.size * theirs.size)
        : 0;
      return { other, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) => b.score - a.score || a.other.title.localeCompare(b.other.title),
    )
    .slice(0, max)
    .map(({ other }) => other);
}

/** Only titles and essences: what the relation depends on (context rot). */
export function linkState(concept: Concept, candidates: readonly Concept[]) {
  return {
    concept: { title: concept.title, essence: concept.explanation.essence },
    others: candidates.map((other) => ({
      title: other.title,
      essence: other.explanation.essence,
    })),
  };
}

export function linkQuestions(
  concept: Concept,
  candidates: readonly Concept[],
): Record<string, Question> {
  const questions: Record<string, Question> = {};
  candidates.forEach((other, i) => {
    const a = `"${concept.title}"`;
    const b = `"${other.title}"`;
    questions[`link${i}`] = {
      type: 'choice',
      instructions: `How is ${a} related to ${b}?`,
      criteria: {
        none: 'not related, or only loosely',
        similar: `${a} and ${b} are easy to confuse: alike, but different in an important way`,
        contrasts: `${a} and ${b} are opposites or direct alternatives`,
        prerequisite: `${a} must be understood before ${b}`,
        example_of: `${a} is an example or a special case of ${b}`,
        causes: `${a} causes or leads to ${b}`,
      },
    };
  });
  return questions;
}

export interface LinkSuggestion {
  to: string;
  relation: LinkRelation;
  confidence: number;
}

const RELATIONS: readonly LinkRelation[] = [
  'similar',
  'contrasts',
  'prerequisite',
  'example_of',
  'causes',
];

export function readLinks(
  answers: Record<string, Answer>,
  candidates: readonly Concept[],
): LinkSuggestion[] {
  const suggestions: LinkSuggestion[] = [];
  candidates.forEach((other, i) => {
    const answer = answers[`link${i}`];
    if (answer?.type !== 'choice' || answer.confidence < CONFIDENT) return;
    const relation = RELATIONS.find((r) => r === answer.choice);
    if (relation) {
      suggestions.push({
        to: other.id,
        relation,
        confidence: answer.confidence,
      });
    }
  });
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_LINKS_PER_CONCEPT);
}

/** A new link record: the AI's wait for the learner, the learner's don't. */
export function linkRecord(input: {
  from: string;
  to: string;
  relation: LinkRelation;
  by: ConceptLink['by'];
  now: Date;
}): ConceptLink {
  return {
    id: crypto.randomUUID(),
    updatedAt: input.now.toISOString(),
    deletedAt: null,
    from: input.from,
    to: input.to,
    relation: input.relation,
    by: input.by,
    confirmed: input.by === 'user',
  };
}

/** How a link reads, from `a` (its `from`) to `b`. */
export function describeLink(
  relation: LinkRelation,
  a: string,
  b: string,
): string {
  switch (relation) {
    case 'similar':
      return `“${a}” and “${b}” are easy to mix up`;
    case 'contrasts':
      return `“${a}” and “${b}” are opposites or alternatives`;
    case 'prerequisite':
      return `“${a}” helps to understand “${b}”`;
    case 'example_of':
      return `“${a}” is an example of “${b}”`;
    case 'causes':
      return `“${a}” leads to “${b}”`;
  }
}

/** The other end of a link, seen from `conceptId`. */
export function otherEnd(link: ConceptLink, conceptId: string): string {
  return link.from === conceptId ? link.to : link.from;
}
