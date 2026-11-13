import {
  CONCEPT_FIELD_GROUPS,
  type Concept,
  type ConceptFieldGroup,
  type ConceptFieldRevisions,
  type Explanation,
  type ExplanationSnapshot,
  LIMITS,
} from './records';

/**
 * Which version of a mutable record wins (design §4.3).
 *
 * The later `updatedAt` wins. On a tie, the larger writer id wins, so every
 * device and the server pick the same version whatever order the copies
 * arrive in. Timestamps are ISO strings in UTC; comparing them as instants
 * keeps an offset like `+01:00` from deciding the order.
 */
export interface Revision {
  updatedAt: string;
  /** The device that wrote this version. */
  by: string;
}

export function compareRevisions(a: Revision, b: Revision): number {
  const byTime = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
  if (byTime !== 0) return Math.sign(byTime);
  if (a.by === b.by) return 0;
  return a.by < b.by ? -1 : 1;
}

/** Whether `incoming` should replace `current` (none yet: always). */
export function incomingWins(
  current: Revision | null | undefined,
  incoming: Revision,
): boolean {
  return !current || compareRevisions(incoming, current) > 0;
}

/** Stamps the mutated field group(s) on a concept so concurrent edits in other groups survive sync. */
export function stampConceptGroups(
  concept: Concept,
  groups: readonly ConceptFieldGroup[],
  revision: Revision,
  baseline?: Revision,
): Concept {
  const next: ConceptFieldRevisions = { ...(concept.fieldRevisions ?? {}) };
  if (!concept.fieldRevisions) {
    const base = baseline ?? { updatedAt: concept.updatedAt, by: revision.by };
    for (const group of CONCEPT_FIELD_GROUPS) next[group] = base;
  }
  for (const group of groups) next[group] = revision;
  return { ...concept, fieldRevisions: next };
}

/**
 * Replaces a concept's explanation, preserving up to 3 prior snapshots in
 * `explanationHistory` and incrementing `version` (design §4.1, §6).
 */
export function withRevisedExplanation(
  concept: Concept,
  explanation: Explanation,
  at: string,
  by: string,
): Concept {
  const prev: ExplanationSnapshot = {
    essence: concept.explanation.essence,
    simple: concept.explanation.simple,
    analogy: concept.explanation.analogy,
    misconception: concept.explanation.misconception,
    ownWords: concept.explanation.ownWords,
    by: concept.explanation.by,
    savedAt: at,
  };
  const explanationHistory = [
    prev,
    ...(concept.explanationHistory ?? []),
  ].slice(0, LIMITS.explanationHistory);
  return stampConceptGroups(
    {
      ...concept,
      updatedAt: at,
      explanation,
      explanationHistory,
      version: (concept.version ?? 1) + 1,
    },
    ['explanation'],
    { updatedAt: at, by },
    { updatedAt: concept.updatedAt, by },
  );
}

function groupRevision(
  record: { updatedAt: string; by: string; data: Concept },
  group: ConceptFieldGroup,
): Revision {
  if (record.data.fieldRevisions?.[group]) {
    return record.data.fieldRevisions[group];
  }
  if (record.data.fieldRevisions) {
    return { updatedAt: record.data.createdAt, by: record.by };
  }
  return { updatedAt: record.updatedAt, by: record.by };
}

export interface MergedConcept {
  concept: Concept;
  updatedAt: string;
  by: string;
  /** At least one field group was replaced by `incoming`. */
  fromIncoming: boolean;
  /** At least one field group stayed with `current` (mixed merge). */
  keptCurrent: boolean;
}

/**
 * Merges two copies of a concept field-group by field-group (`explanation`,
 * `prompts`, `status`, `topic`) using the same deterministic instant/writer tie
 * breaker on every device and server.
 */
export function mergeConcepts(
  current: { updatedAt: string; by: string; data: Concept },
  incoming: { updatedAt: string; by: string; data: Concept },
): MergedConcept {
  const winners = {} as Record<ConceptFieldGroup, boolean>;
  const winningRevs: Revision[] = [];
  const nextRevs: ConceptFieldRevisions = {};
  const anyFieldRev = !!(
    current.data.fieldRevisions || incoming.data.fieldRevisions
  );

  for (const group of CONCEPT_FIELD_GROUPS) {
    const curRev = groupRevision(current, group);
    const incRev = groupRevision(incoming, group);
    const incWon = incomingWins(curRev, incRev);
    winners[group] = incWon;
    const chosenRev = incWon ? incRev : curRev;
    winningRevs.push(chosenRev);
    const chosenExplicit = incWon
      ? incoming.data.fieldRevisions?.[group]
      : current.data.fieldRevisions?.[group];
    if (chosenExplicit) {
      nextRevs[group] = chosenExplicit;
    } else if (anyFieldRev) {
      nextRevs[group] = chosenRev;
    }
  }

  const fromIncoming = CONCEPT_FIELD_GROUPS.some((group) => winners[group]);
  if (!fromIncoming) {
    return {
      concept: current.data,
      updatedAt: current.updatedAt,
      by: current.by,
      fromIncoming: false,
      keptCurrent: true,
    };
  }

  const allFromIncoming = CONCEPT_FIELD_GROUPS.every((group) => winners[group]);
  const keptCurrent = !allFromIncoming;

  let top = winningRevs[0];
  for (const rev of winningRevs.slice(1)) {
    if (compareRevisions(rev, top) > 0) top = rev;
  }

  const expSource = winners.explanation ? incoming.data : current.data;
  const promptsSource = winners.prompts ? incoming.data : current.data;
  const statusSource = winners.status ? incoming.data : current.data;
  const topicSource = winners.topic ? incoming.data : current.data;

  const createdAt =
    Date.parse(current.data.createdAt) <= Date.parse(incoming.data.createdAt)
      ? current.data.createdAt
      : incoming.data.createdAt;

  const mergedVersion = Math.max(
    current.data.version ?? 1,
    incoming.data.version ?? 1,
  );
  const hasHistory =
    expSource.explanationHistory !== undefined ||
    current.data.explanationHistory !== undefined ||
    incoming.data.explanationHistory !== undefined;
  const hasVersion =
    current.data.version !== undefined || incoming.data.version !== undefined;

  const merged: Concept = {
    id: incoming.data.id,
    updatedAt: top.updatedAt,
    deletedAt: statusSource.deletedAt,
    topicId: topicSource.topicId,
    title: expSource.title,
    type: expSource.type,
    status: statusSource.status,
    explanation: expSource.explanation,
    ...(hasHistory
      ? { explanationHistory: expSource.explanationHistory ?? [] }
      : {}),
    ...(hasVersion ? { version: mergedVersion } : {}),
    ...(anyFieldRev ? { fieldRevisions: nextRevs } : {}),
    prompts: promptsSource.prompts,
    sources: expSource.sources,
    confirmedAt: statusSource.confirmedAt,
    createdAt,
  };

  return {
    concept: merged,
    updatedAt: top.updatedAt,
    by: top.by,
    fromIncoming: true,
    keptCurrent,
  };
}

/**
 * The newest acceptable `updatedAt`. A device whose clock runs far ahead
 * would otherwise write a version nothing could ever replace.
 */
export const MAX_CLOCK_SKEW_MS = 10 * 60_000;

export function isFromTheFuture(updatedAt: string, now: Date): boolean {
  return Date.parse(updatedAt) > now.getTime() + MAX_CLOCK_SKEW_MS;
}
