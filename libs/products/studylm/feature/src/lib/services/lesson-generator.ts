import {
  type Block,
  buildGenerateRequest,
  CHECK_KINDS,
  type GenerateRequest,
  type GenerateResponse,
  type GenerateTask,
  type Lesson,
  type LessonOutline,
  type SelfExplainFeedback,
  SPEC_VERSION,
  type TaskInput,
  validateBlock,
  validateFeedback,
  validateLesson,
  validateOutline,
} from '@ah/products/studylm/lessons';

/** Sends one request to the workflow. Rejects on a network or HTTP failure. */
export type AskWorkflow = (
  request: GenerateRequest,
  signal: AbortSignal,
) => Promise<GenerateResponse>;

/** A generation failure the learner can act on. */
export class LessonGenerationError extends Error {
  override readonly name = 'LessonGenerationError';
}

export interface LessonTopic {
  subject: string;
  sectionTitle: string;
  sectionSummary: string;
  subtopics: readonly string[];
  tier: Lesson['tier'];
}

type PlannedBlock = LessonOutline['sections'][number]['blocks'][number];

/** Where a planned block stands while the lesson is written. */
export type BlockStatus =
  | { state: 'pending' }
  | { state: 'writing' }
  | { state: 'ready'; block: Block; repaired: boolean }
  | { state: 'skipped'; reason: string };

/** A lesson as it is being written, and once it is done. */
export interface LessonDraft {
  outline: LessonOutline;
  /** The roadmap section's tier; the outline doesn't carry one. */
  tier: Lesson['tier'];
  blocks: Record<string, BlockStatus>;
  provider: string;
}

/** One worker per lane, so blocks written side by side use different models. */
const MAX_CONCURRENT = 2;
/**
 * When every model in the workflow failed, which on free tiers usually
 * means their per-minute token budgets ran out, a call waits this long
 * and tries once more.
 */
export const BUSY_RETRY_MS = 20_000;

/** Waits, unless the signal aborts first. */
export type Pause = (ms: number, signal: AbortSignal) => Promise<void>;

const pauseFor: Pause = (ms, signal) =>
  new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });

/**
 * Writes a lesson in stages (ADR-0021): an outline, then each block against
 * its own small schema, then at most one repair per block. Every reply goes
 * through the validators; a block that still fails is skipped and says why,
 * never filled in.
 */
export class LessonGenerator {
  constructor(
    private readonly ask: AskWorkflow,
    private readonly pause: Pause = pauseFor,
  ) {}

  async outline(
    topic: LessonTopic,
    signal: AbortSignal,
  ): Promise<{ outline: LessonOutline; provider: string }> {
    const reply = await this.call(
      'lesson-outline',
      {
        subject: clip(topic.subject, 120),
        sectionTitle: clip(topic.sectionTitle, 120),
        sectionSummary: clip(topic.sectionSummary || topic.sectionTitle, 600),
        subtopics: topic.subtopics.slice(0, 8).map((s) => clip(s, 80)),
        tier: topic.tier,
        minutes: 15,
      },
      signal,
    );
    const checked = validateOutline(reply.data);
    if (!checked.ok) {
      throw new LessonGenerationError(
        `The AI's lesson plan didn't pass the checks: ${firstIssue(checked) || 'unknown problem'}`,
      );
    }
    return { outline: checked.value, provider: reply.provider };
  }

  /** Writes every planned block, reporting each change through `update`. */
  async write(
    outline: LessonOutline,
    tier: Lesson['tier'],
    provider: string,
    signal: AbortSignal,
    update: (draft: LessonDraft) => void,
  ): Promise<LessonDraft> {
    const draft: LessonDraft = {
      outline,
      tier,
      provider,
      blocks: Object.fromEntries(
        outline.sections.flatMap((s) =>
          s.blocks.map((b) => [b.id, { state: 'pending' } as BlockStatus]),
        ),
      ),
    };
    const publish = () => update({ ...draft, blocks: { ...draft.blocks } });
    publish();
    const queue = outline.sections.flatMap((section) =>
      section.blocks.map((planned) => ({ section, planned })),
    );
    const worker = async (lane: 0 | 1) => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        signal.throwIfAborted();
        draft.blocks[next.planned.id] = { state: 'writing' };
        publish();
        draft.blocks[next.planned.id] = await this.block(
          outline,
          tier,
          next.section,
          next.planned,
          signal,
          lane,
        );
        publish();
      }
    };
    await Promise.all(
      Array.from({ length: MAX_CONCURRENT }, (_, i) => worker(i ? 1 : 0)),
    );
    return draft;
  }

  /** One block: written, checked, and repaired once if it needs it. */
  async block(
    outline: LessonOutline,
    tier: Lesson['tier'],
    section: LessonOutline['sections'][number],
    planned: PlannedBlock,
    signal: AbortSignal,
    lane: 0 | 1 = 0,
  ): Promise<BlockStatus> {
    const checks = section.blocks
      .filter((b) => (CHECK_KINDS as readonly string[]).includes(b.kind))
      .map((b) => b.id);
    const neighbours = section.blocks
      .filter((b) => b.id !== planned.id)
      .map((b) => b.brief);
    let reply: GenerateResponse;
    try {
      reply = await this.call(
        'lesson-block',
        {
          lessonTitle: clip(outline.title, 120),
          sectionTitle: clip(section.title, 120),
          intent: section.intent,
          tier,
          kind: planned.kind,
          blockId: planned.id,
          brief: planned.brief,
          checks,
          context: neighbours.slice(0, 8),
        },
        signal,
        lane,
      );
    } catch (error) {
      if (signal.aborted) throw error;
      return { state: 'skipped', reason: messageOf(error) };
    }
    const first = validateBlock(withId(reply.data, planned.id), planned.kind);
    if (first.ok)
      return { state: 'ready', block: first.value, repaired: false };

    try {
      const repaired = await this.call(
        'block-repair',
        {
          kind: planned.kind,
          block: (reply.data ?? {}) as Record<string, unknown>,
          issues: issuesOf(first)
            .slice(0, 20)
            .map((issue) => ({
              path: clip(issue.path, 200),
              message: clip(issue.message, 300),
            })),
        },
        signal,
      );
      const second = validateBlock(
        withId(repaired.data, planned.id),
        planned.kind,
      );
      if (second.ok)
        return { state: 'ready', block: second.value, repaired: true };
      return {
        state: 'skipped',
        reason: `It still failed the checks after a repair: ${firstIssue(second)}`,
      };
    } catch (error) {
      if (signal.aborted) throw error;
      return { state: 'skipped', reason: messageOf(error) };
    }
  }

  /** Marks a learner's self-explanation against the rubric. */
  async feedback(
    input: TaskInput<'self-explain-feedback'>,
    signal: AbortSignal,
  ): Promise<SelfExplainFeedback> {
    const reply = await this.call('self-explain-feedback', input, signal);
    const checked = validateFeedback(reply.data);
    if (!checked.ok) {
      throw new LessonGenerationError(
        "The AI's feedback didn't pass the checks; try again.",
      );
    }
    return checked.value;
  }

  private async call<T extends GenerateTask>(
    task: T,
    input: TaskInput<T>,
    signal: AbortSignal,
    lane?: 0 | 1,
  ): Promise<GenerateResponse> {
    const request = buildGenerateRequest(task, input, lane);
    if (!request.ok) {
      throw new LessonGenerationError(
        `StudyLM built a request the workflow would refuse: ${firstIssue(request)}`,
      );
    }
    let reply = await this.ask(request.value as GenerateRequest, signal);
    if (reply.code === 'AI_FAILOVER_EXHAUSTED') {
      await this.pause(BUSY_RETRY_MS, signal);
      reply = await this.ask(request.value as GenerateRequest, signal);
    }
    if (reply.code === 'SPEC_MISMATCH') {
      throw new LessonGenerationError(
        `Your n8n workflow serves lesson format ${reply.specVersion}; StudyLM uses ${SPEC_VERSION}. Re-import tools/scripts/studylm_workflow.json into n8n.`,
      );
    }
    if (!reply.success || reply.code !== 'OK') {
      throw new LessonGenerationError(
        reply.message ??
          (reply.code === 'AI_FAILOVER_EXHAUSTED'
            ? 'Every AI model failed to answer, twice. Free-tier models may be busy; try again in a minute.'
            : `The workflow answered ${reply.code}.`),
      );
    }
    return reply;
  }
}

/**
 * The lesson from an outline and its finished blocks. Skipped blocks are
 * left out, and links the lesson's checks reject are cleared rather than
 * failing the whole lesson: a pauseFor with no check, a reveal with no visual.
 */
export function assembleLesson(
  id: string,
  sectionId: string,
  draft: LessonDraft,
): Lesson {
  const { outline } = draft;
  const ready = (planned: PlannedBlock) => {
    const status = draft.blocks[planned.id];
    return status?.state === 'ready' ? [structuredClone(status.block)] : [];
  };
  const lesson: Lesson = {
    specVersion: SPEC_VERSION,
    id,
    sectionId,
    title: outline.title,
    tier: draft.tier,
    minutes: outline.minutes,
    objectives: outline.objectives,
    sections: outline.sections
      .map((section) => ({
        id: section.id,
        title: section.title,
        intent: section.intent,
        blocks: section.blocks.flatMap(ready),
      }))
      .filter((section) => section.blocks.length > 0),
    cards: outline.cards,
  };
  const blockIds = new Set(
    lesson.sections.flatMap((s) => s.blocks.map((b) => b.id)),
  );
  for (const section of lesson.sections) {
    const checks = new Set(
      section.blocks
        .filter((b) => (CHECK_KINDS as readonly string[]).includes(b.kind))
        .map((b) => b.id),
    );
    for (const block of section.blocks) {
      const steps =
        (block as { steps?: { pauseFor: string | null }[] }).steps ?? [];
      for (const step of steps) {
        if (step.pauseFor && !checks.has(step.pauseFor)) step.pauseFor = null;
      }
      if (
        block.kind === 'predict' &&
        block.reveal &&
        !blockIds.has(block.reveal.block)
      ) {
        block.reveal = null;
      }
    }
  }
  const checked = validateLesson(lesson);
  return checked.ok ? checked.value : lesson;
}

/** A lesson id from the subject and section: known before it is written. */
export function lessonIdFor(subjectId: string, sectionId: string): string {
  let hash = 2166136261;
  for (const ch of `${subjectId}\u0000${sectionId}`) {
    hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  }
  return `gen-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/** A roadmap section id in the format's id shape (lowercase, ≤ 32 chars). */
export function formatId(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `s-${slug}`.slice(0, 32).replace(/-+$/, '') || 's-section';
}

/** The AI sometimes drifts from the planned id; the plan's id wins. */
function withId(data: unknown, id: string): unknown {
  return data && typeof data === 'object' && !Array.isArray(data)
    ? { ...(data as object), id }
    : data;
}

/** A result's issues; written so it narrows without strict null checks too. */
function issuesOf(result: object): { path: string; message: string }[] {
  return 'issues' in result
    ? (result.issues as { path: string; message: string }[])
    : [];
}

function firstIssue(result: object): string {
  return issuesOf(result)[0]?.message ?? '';
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'The request failed.';
}
