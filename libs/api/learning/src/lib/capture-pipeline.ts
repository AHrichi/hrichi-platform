import { Logger } from '@nestjs/common';
import * as v from 'valibot';
import type {
  AudioClip,
  DecisionModel,
  ModelLadder,
  Transcriber,
} from '@ah/api/ai';
import {
  type AiIssue,
  type Capture,
  checkExplained,
  checkExtracted,
  type Concept,
  draftConceptFrom,
  explainCall,
  type ExplainedConcept,
  ExplainedConceptSchema,
  type ExplainInput,
  extractCall,
  ExtractedConceptsSchema,
  gateQuestions,
  gateState,
  type MutableKind,
  readGate,
  readTriage,
  type RecordOfKind,
  repairCall,
  reviseCall,
  RevisedExplanationSchema,
  SERVER_WRITER,
  type Topic,
  TRIAGE_QUESTIONS,
  wordCount,
  AI_LIMITS,
} from '@ah/learning/domain';
import type { LearningRepository, StoredRecord } from './learning.repository';
import type { WriteLock } from './write-lock';

/** After this many failed runs a capture stops retrying and shows Retry. */
export const MAX_ATTEMPTS = 3;
/** Drafts nobody kept or discarded are kept for the learner after this. */
export const AUTO_CONFIRM_MS = 48 * 60 * 60_000;

export interface PipelineAi {
  ladder: ModelLadder;
  transcriber: Transcriber & { readonly configured: boolean };
  decisions: DecisionModel;
}

/** A problem the learner should see, with no stack trace. */
export class PipelineError extends Error {
  override readonly name = 'PipelineError';

  constructor(
    message: string,
    /** `not_found`: the record isn't on the server (yet). */
    readonly reason: 'not_found' | 'unavailable' | 'bad_output' = 'bad_output',
  ) {
    super(message);
  }
}

const TRIAGE_MESSAGES = {
  todo: 'This looks like a to-do rather than something to learn. Process it anyway?',
  noise: 'This is too short or unclear to learn from. Process it anyway?',
} as const;

function hueOf(name: string): number {
  let hash = 0;
  for (const char of name.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  return hash;
}

function issuesOf(issues: readonly v.BaseIssue<unknown>[]): AiIssue[] {
  return issues.map((issue) => ({
    path: `/${(v.getDotPath(issue) ?? '').replaceAll('.', '/')}`,
    code: 'schema',
    message: issue.message,
  }));
}

/**
 * Turns captures into draft concepts (design §6.2): transcribe → triage →
 * extract → explain → check → repair at most once → quality gate → drafts
 * in the digest. The capture record is the job: its status says where it
 * is, a failed run counts an attempt, and nothing is ever filled in.
 */
export class CapturePipeline {
  private readonly logger = new Logger('CapturePipeline');
  private running: Promise<void> | null = null;
  private again = false;

  constructor(
    private readonly repository: LearningRepository,
    private readonly lock: WriteLock,
    private readonly ai: PipelineAi,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Starts a run unless one is going; a kick during a run queues one more. */
  kick(): Promise<void> {
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = (async () => {
      do {
        this.again = false;
        await this.runOnce().catch((error: unknown) =>
          this.logger.error('Capture run failed', error as Error),
        );
      } while (this.again);
    })().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /** Processes every waiting capture once. */
  async runOnce(): Promise<number> {
    const queued = await this.repository.findByStatus(
      'capture',
      ['queued'],
      20,
    );
    let processed = 0;
    for (const { data: capture } of queued) {
      if (capture.deletedAt || capture.attempts >= MAX_ATTEMPTS) continue;
      if (capture.hasAudio && !capture.transcript) continue;
      await this.process(capture);
      processed += 1;
    }
    return processed;
  }

  /** The learner's voice note: transcribed now, then processed. */
  async receiveAudio(captureId: string, clip: AudioClip): Promise<Capture> {
    const stored = await this.repository.getRecord('capture', captureId);
    if (!stored || stored.data.deletedAt) {
      throw new PipelineError(
        'That capture isn’t on the server yet.',
        'not_found',
      );
    }
    if (!this.ai.transcriber.configured) {
      throw new PipelineError(
        'This server has no transcription model set up.',
        'unavailable',
      );
    }
    const transcript = (await this.ai.transcriber.transcribe(clip)).slice(
      0,
      4000,
    );
    const capture = await this.write('capture', {
      ...stored.data,
      transcript,
      status: 'queued',
      error: null,
    });
    void this.kick();
    return capture;
  }

  /** "Make it simpler": a new version of a concept's explanation. */
  async revise(conceptId: string, instruction: string): Promise<Concept> {
    const stored = await this.repository.getRecord('concept', conceptId);
    if (!stored || stored.data.deletedAt) {
      throw new PipelineError('That concept isn’t on the server.', 'not_found');
    }
    const concept = stored.data;
    const result = await this.ai.ladder.run(
      reviseCall({
        title: concept.title,
        explanation: {
          essence: concept.explanation.essence,
          simple: concept.explanation.simple ?? '',
          analogy: concept.explanation.analogy ?? '',
          misconception: concept.explanation.misconception ?? '',
        },
        instruction,
      }),
    );
    const parsed = v.safeParse(RevisedExplanationSchema, result.data);
    if (
      !parsed.success ||
      wordCount(parsed.output.essence) > AI_LIMITS.essenceWords ||
      wordCount(parsed.output.simple) > AI_LIMITS.simpleWords
    ) {
      throw new PipelineError('The rewrite didn’t come out right. Try again.');
    }
    return this.write('concept', {
      ...concept,
      explanation: {
        ...concept.explanation,
        ...parsed.output,
        by: 'ai',
      },
    });
  }

  /** Keeps drafts left alone for 48 hours, then runs the queue. */
  async sweep(): Promise<void> {
    const cutoff = this.now().getTime() - AUTO_CONFIRM_MS;
    const drafts = await this.repository.findByStatus(
      'concept',
      ['draft'],
      200,
    );
    for (const { data: concept } of drafts) {
      if (concept.deletedAt || Date.parse(concept.createdAt) > cutoff) continue;
      await this.write('concept', {
        ...concept,
        status: 'active',
        confirmedAt: this.now().toISOString(),
      });
    }
    await this.kick();
  }

  private async process(capture: Capture): Promise<void> {
    const text = (capture.transcript ?? capture.text ?? '').trim();
    if (!text) {
      await this.write('capture', {
        ...capture,
        status: 'failed',
        error: 'There is nothing to process in this capture.',
      });
      return;
    }
    if (!this.ai.ladder.configured) {
      const waiting = 'Waiting: this server has no AI keys set up yet.';
      // Written once, not on every sweep: each write syncs to every device.
      if (capture.error !== waiting) {
        await this.write('capture', { ...capture, error: waiting });
      }
      return;
    }
    let current = await this.write('capture', {
      ...capture,
      status: 'processing',
      error: null,
    });

    try {
      if (!capture.force) {
        const verdict = await this.ai.decisions
          .decide(text, TRIAGE_QUESTIONS)
          .then((decision) => readTriage(decision.answers))
          .catch(() => 'unsure' as const);
        if (verdict === 'todo' || verdict === 'noise') {
          await this.write('capture', {
            ...current,
            status: 'needs_look',
            error: TRIAGE_MESSAGES[verdict],
          });
          return;
        }
      }

      const topics = await this.repository.liveTopics();
      const extracted = await this.ai.ladder.run(
        extractCall({
          text,
          sourceExcerpt: capture.source?.excerpt ?? null,
          topics: topics.map((topic) => topic.data.name).slice(0, 50),
        }),
      );
      const parsed = v.safeParse(ExtractedConceptsSchema, extracted.data);
      if (!parsed.success) {
        throw new PipelineError(
          'The AI couldn’t find the ideas in this capture.',
        );
      }
      // Duplicates are dropped rather than repaired.
      const duplicates = new Set(
        checkExtracted(parsed.output)
          .filter((issue) => issue.code === 'duplicate_concept')
          .map((issue) => Number(issue.path.split('/')[2])),
      );
      const found = parsed.output.concepts.filter((_, i) => !duplicates.has(i));

      const drafts: Concept[] = [];
      const notes: string[] = [];
      for (const item of found) {
        const input: ExplainInput = {
          title: item.title,
          type: item.type,
          span: item.span,
          capture: text,
        };
        const explained = await this.explain(input);
        if (!explained) {
          notes.push(
            `“${item.title}” couldn’t be explained well enough and was left out.`,
          );
          continue;
        }
        const gate = await this.ai.decisions
          .decide(gateState(item.span, explained), gateQuestions(explained))
          .then((decision) =>
            readGate(decision.answers, explained.prompts.length),
          )
          .catch(() => null);
        if (gate?.needsLook)
          notes.push(...gate.reasons.map((r) => `${item.title}: ${r}`));
        if (explained.uncertain) {
          notes.push(`${item.title}: the AI wasn’t sure the facts are right.`);
        }
        const topic = await this.topicFor(item.topic);
        drafts.push(
          draftConceptFrom({
            title: item.title,
            type: item.type,
            topicId: topic.id,
            span: item.span,
            captureId: capture.id,
            explained,
            retired: gate?.leakyPrompts ?? [],
            now: this.now(),
          }),
        );
      }
      if (!drafts.length) {
        throw new PipelineError(
          notes[0] ?? 'No concept came out of this capture.',
        );
      }
      for (const draft of drafts) await this.write('concept', draft);
      current = await this.write('capture', {
        ...current,
        status: notes.length ? 'needs_look' : 'ready',
        error: notes.length ? notes.join(' ').slice(0, 300) : null,
        conceptIds: drafts.map((draft) => draft.id),
      });
    } catch (error) {
      const attempts = current.attempts + 1;
      const message =
        error instanceof PipelineError
          ? error.message
          : 'The AI is busy or unreachable. It will try again.';
      this.logger.warn(
        `Capture ${capture.id} failed (${attempts}): ${String(error)}`,
      );
      await this.write('capture', {
        ...current,
        attempts,
        status: attempts >= MAX_ATTEMPTS ? 'failed' : 'queued',
        error:
          attempts >= MAX_ATTEMPTS
            ? message
            : `${message} (try ${attempts} of ${MAX_ATTEMPTS})`,
      });
    }
  }

  /** Explain, check, and repair once; null when it still fails. */
  private async explain(input: ExplainInput): Promise<ExplainedConcept | null> {
    const first = await this.ai.ladder.run(explainCall(input));
    const parsed = v.safeParse(ExplainedConceptSchema, first.data);
    const issues = parsed.success
      ? checkExplained(parsed.output, input)
      : issuesOf(parsed.issues);
    if (parsed.success && !issues.length) return parsed.output;

    const repaired = await this.ai.ladder.run(
      repairCall(input, first.data, issues),
    );
    const second = v.safeParse(ExplainedConceptSchema, repaired.data);
    if (second.success && !checkExplained(second.output, input).length) {
      return second.output;
    }
    return null;
  }

  private async topicFor(name: string): Promise<Topic> {
    const key = name.trim().toLowerCase();
    const existing = (await this.repository.liveTopics()).find(
      (topic) => topic.data.name.trim().toLowerCase() === key,
    );
    if (existing) return existing.data;
    return this.write('topic', {
      id: crypto.randomUUID(),
      updatedAt: this.now().toISOString(),
      deletedAt: null,
      name: name.trim().slice(0, 60),
      parentId: null,
      hue: hueOf(name),
    });
  }

  /**
   * Stores a server version under the write lock, stamped after the stored
   * one so it always wins (a device's later edit still beats it).
   */
  private write<K extends MutableKind>(
    kind: K,
    data: RecordOfKind[K],
  ): Promise<RecordOfKind[K]> {
    return this.lock.run(async () => {
      const current = await this.repository.getRecord(kind, data.id);
      const after = current ? Date.parse(current.updatedAt) + 1 : 0;
      const updatedAt = new Date(
        Math.max(this.now().getTime(), after),
      ).toISOString();
      const stamped = { ...data, updatedAt } as RecordOfKind[K];
      const record = {
        kind,
        id: data.id,
        seq: await this.repository.nextSeq(),
        by: SERVER_WRITER,
        updatedAt,
        data: stamped,
      } as unknown as StoredRecord<K>;
      await this.repository.putMutable(record);
      return stamped;
    });
  }
}
