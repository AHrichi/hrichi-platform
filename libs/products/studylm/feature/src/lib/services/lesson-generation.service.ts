import { inject, Injectable, signal } from '@angular/core';
import type { RoadmapSection, StudySubject } from '@ah/products/studylm/domain';
import type {
  AnswerEvaluationRequest,
  AnswerEvaluationResult,
  FeedbackRequest,
} from '@ah/products/studylm/learn';
import type { Lesson, SelfExplainFeedback } from '@ah/products/studylm/lessons';
import { StudyLmStore } from '../store/studylm.store';
import {
  assembleLesson,
  formatId,
  type LessonDraft,
  LessonGenerator,
  lessonIdFor,
} from './lesson-generator';
import { StudyLmApiService } from './studylm-api.service';
import {
  type GeneratedLessonRecord,
  StudyLmStorageService,
} from './studylm-storage.service';

/** A lesson being written, as the screens follow it. */
export interface LessonJob {
  status: 'planning' | 'writing' | 'ready' | 'failed' | 'cancelled';
  draft: LessonDraft | null;
  /** The lesson so far: the blocks finished, in order. */
  lesson: Lesson | null;
  error: string | null;
}

/**
 * Writes lessons for roadmap sections on demand and keeps them on the
 * device. Jobs live here, not in a screen, so writing carries on while
 * the learner moves around StudyLM.
 */
@Injectable({ providedIn: 'root' })
export class LessonGenerationService {
  private readonly api = inject(StudyLmApiService);
  private readonly storage = inject(StudyLmStorageService);
  private readonly store = inject(StudyLmStore);
  private readonly running = new Map<string, AbortController>();

  readonly jobs = signal<Record<string, LessonJob>>({});
  /** Lesson ids already saved, so the roadmap can offer to open them. */
  readonly saved = signal<ReadonlySet<string>>(new Set());

  private readonly generator = new LessonGenerator((request, cancel) =>
    this.api.generateLessonPart(
      request,
      this.store.n8nConfig().activeEndpoint,
      cancel,
    ),
  );

  constructor() {
    void this.storage
      .listGeneratedLessons()
      .then((records) => this.saved.set(new Set(records.map((r) => r.id))));
  }

  idFor(subject: StudySubject, section: RoadmapSection): string {
    return lessonIdFor(subject.id, section.id);
  }

  /** Starts writing; returns the lesson id at once, so a screen can follow. */
  start(subject: StudySubject, section: RoadmapSection): string {
    const id = this.idFor(subject, section);
    void this.generateLesson(subject, section).catch(() => undefined);
    return id;
  }

  /**
   * Generates a lesson and returns a Promise that resolves when finished,
   * or throws if generation failed (so retry mechanisms can retry it).
   */
  async generateLesson(
    subject: StudySubject,
    section: RoadmapSection,
    signal?: AbortSignal,
  ): Promise<Lesson> {
    const id = this.idFor(subject, section);
    this.running.get(id)?.abort();
    const controller = new AbortController();
    this.running.set(id, controller);

    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort(), {
          once: true,
        });
      }
    }

    this.setJob(id, {
      status: 'planning',
      draft: null,
      lesson: null,
      error: null,
    });

    try {
      const { outline, provider } = await this.generator.outline(
        {
          subject: subject.title,
          sectionTitle: section.title,
          sectionSummary: section.summary,
          subtopics: section.subtopics,
          tier: section.difficultyTier,
        },
        controller.signal,
      );
      const draft = await this.generator.write(
        outline,
        section.difficultyTier,
        provider,
        controller.signal,
        (current) =>
          this.setJob(id, {
            status: 'writing',
            draft: current,
            lesson: assembleLesson(id, formatId(section.id), current),
            error: null,
          }),
      );
      const lesson = assembleLesson(id, formatId(section.id), draft);
      await this.finish(id, subject.id, section.id, draft);
      return lesson;
    } catch (error) {
      const job = this.jobs()[id];
      this.setJob(id, {
        status: controller.signal.aborted ? 'cancelled' : 'failed',
        draft: job?.draft ?? null,
        lesson: job?.lesson ?? null,
        error: controller.signal.aborted ? null : messageOf(error),
      });
      throw error;
    } finally {
      if (this.running.get(id)?.signal === controller.signal) {
        this.running.delete(id);
      }
    }
  }

  /** AI feedback on a self-explanation, for the lesson checks. */
  feedback(request: FeedbackRequest): Promise<SelfExplainFeedback> {
    return this.generator.feedback(request, new AbortController().signal);
  }

  /** AI evaluation on a learner's answer, tolerant of typos and variations. */
  async evaluateAnswer(
    request: AnswerEvaluationRequest,
  ): Promise<AnswerEvaluationResult> {
    try {
      const response = await this.api.evaluateAnswer(
        request,
        this.store.n8nConfig().activeEndpoint,
      );
      return {
        correct: response.correct,
        isTypo: response.isTypo,
        feedback: response.feedback,
      };
    } catch {
      return {
        correct: false,
        isTypo: false,
        feedback: `Expected: "${request.expected}".`,
      };
    }
  }

  cancel(id: string): void {
    this.running.get(id)?.abort();
  }

  /** Writes one skipped block again, and puts it in its place. */
  async retryBlock(id: string, blockId: string): Promise<void> {
    const record = await this.storage.getGeneratedLesson(id);
    if (!record) return;
    const section = record.draft.outline.sections.find((s) =>
      s.blocks.some((b) => b.id === blockId),
    );
    const planned = section?.blocks.find((b) => b.id === blockId);
    if (!section || !planned) return;
    const draft: LessonDraft = {
      ...record.draft,
      blocks: { ...record.draft.blocks, [blockId]: { state: 'writing' } },
    };
    this.setJob(id, {
      status: 'writing',
      draft,
      lesson: record.lesson,
      error: null,
    });
    try {
      draft.blocks[blockId] = await this.generator.block(
        record.draft.outline,
        record.draft.tier,
        section,
        planned,
        new AbortController().signal,
      );
    } catch (error) {
      draft.blocks[blockId] = { state: 'skipped', reason: messageOf(error) };
    }
    await this.finish(id, record.subjectId, record.sectionId, draft);
  }

  private async finish(
    id: string,
    subjectId: string,
    sectionId: string,
    draft: LessonDraft,
  ): Promise<void> {
    const lesson = assembleLesson(id, formatId(sectionId), draft);
    const record: GeneratedLessonRecord = {
      id,
      subjectId,
      sectionId,
      draft,
      lesson,
      generatedAt: new Date().toISOString(),
    };
    await this.storage.saveGeneratedLesson(record);
    this.saved.update((ids) => new Set([...ids, id]));
    this.setJob(id, { status: 'ready', draft, lesson, error: null });
  }

  private setJob(id: string, job: LessonJob): void {
    this.jobs.update((jobs) => ({ ...jobs, [id]: job }));
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Writing the lesson failed.';
}
