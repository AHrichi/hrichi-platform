import { computed, inject, Injectable, signal } from '@angular/core';
import { APP_MODE } from '@ah/platform/app-mode';
import type { RoadmapSection, StudySubject } from '@ah/products/studylm/domain';
import type { Lesson } from '@ah/products/studylm/lessons';
import { StudyLmStore } from '../store/studylm.store';
import { LessonGenerationService } from './lesson-generation.service';
import {
  executeInBatches,
  type BatchExecutionProgress,
  type BatchItemError,
  type BatchExecutionResult,
} from './batch-execution';

/**
 * Inside the portfolio (embedded-demo) a visitor shares the owner's free
 * model quota with everyone else, so one click writes at most this many
 * lessons. The standalone app has no cap.
 */
export const DEMO_BULK_LIMIT = 3;

export interface BulkGenerationState {
  isGenerating: boolean;
  progress: BatchExecutionProgress | null;
  statusMessage: string;
  retryingCount: number;
  failedItems: BatchItemError<RoadmapSection>[];
  succeededCount: number;
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class BulkGenerationService {
  private readonly lessonService = inject(LessonGenerationService);
  private readonly store = inject(StudyLmStore);
  private readonly demo =
    inject(APP_MODE, { optional: true }) === 'embedded-demo';

  readonly isGenerating = signal<boolean>(false);
  readonly progress = signal<BatchExecutionProgress | null>(null);
  readonly statusMessage = signal<string>('');
  readonly retryingCount = signal<number>(0);
  readonly failedItems = signal<BatchItemError<RoadmapSection>[]>([]);
  readonly succeededCount = signal<number>(0);
  readonly totalCount = signal<number>(0);

  private activeController: AbortController | null = null;

  /** Unwritten sections for the active subject. */
  readonly pendingSections = computed<RoadmapSection[]>(() => {
    const subject = this.store.activeSubject();
    if (!subject) return [];
    const all = this.store.allSections();
    const savedIds = this.lessonService.saved();
    return all.filter(
      (sec) => !savedIds.has(this.lessonService.idFor(subject, sec)),
    );
  });

  /**
   * Bulk generate lessons for sections of the given subject (defaults to active subject).
   * Runs in batches of `batchSize` with automated retry on error and exponential backoff.
   */
  async bulkGenerateLessons(
    options: {
      subject?: StudySubject;
      sections?: RoadmapSection[];
      batchSize?: number;
      maxRetries?: number;
      retryDelayMs?: number;
    } = {},
  ): Promise<BatchExecutionResult<RoadmapSection, Lesson>> {
    if (this.isGenerating()) {
      throw new Error('Bulk generation is already in progress');
    }

    const subject = options.subject ?? this.store.activeSubject();
    if (!subject) {
      throw new Error('No active subject selected for bulk generation');
    }

    const pending =
      options.sections ??
      this.pendingSections().filter((s) => s.approved !== false);
    const sections = this.demo ? pending.slice(0, DEMO_BULK_LIMIT) : pending;

    if (sections.length === 0) {
      this.statusMessage.set('All sections already have lessons generated.');
      return { succeeded: [], failed: [], cancelled: false };
    }

    this.activeController?.abort();
    this.activeController = new AbortController();
    const signal = this.activeController.signal;

    this.isGenerating.set(true);
    this.statusMessage.set(
      `Starting generation for ${sections.length} lesson(s)...`,
    );
    this.retryingCount.set(0);
    this.failedItems.set([]);
    this.succeededCount.set(0);
    this.totalCount.set(sections.length);

    try {
      const result = await executeInBatches<RoadmapSection, Lesson>(
        sections,
        async (section, attempt, taskSignal) => {
          this.statusMessage.set(
            `Writing lesson: "${section.title}" (attempt ${attempt})...`,
          );
          return await this.lessonService.generateLesson(
            subject,
            section,
            taskSignal,
          );
        },
        {
          batchSize: options.batchSize ?? 2,
          maxRetries: options.maxRetries ?? 2,
          retryDelayMs: options.retryDelayMs ?? 1500,
          signal,
          onProgress: (p) => {
            this.progress.set(p);
            this.succeededCount.set(p.succeeded);
            this.totalCount.set(p.total);
            this.retryingCount.set(p.retried);
          },
          onItemRetry: (section, attempt, err) => {
            const msg = err instanceof Error ? err.message : String(err);
            this.statusMessage.set(
              `Retry #${attempt} for "${section.title}": ${msg}. Retrying...`,
            );
          },
        },
      );

      this.failedItems.set(result.failed);
      if (result.cancelled) {
        this.statusMessage.set('Bulk generation was cancelled.');
      } else if (result.failed.length > 0) {
        this.statusMessage.set(
          `Completed with ${result.succeeded.length} succeeded, ${result.failed.length} failed.`,
        );
      } else {
        this.statusMessage.set(
          `Successfully generated all ${result.succeeded.length} lessons!`,
        );
      }

      return result;
    } finally {
      this.isGenerating.set(false);
      this.activeController = null;
    }
  }

  cancel(): void {
    if (this.activeController) {
      this.activeController.abort();
      this.statusMessage.set('Cancelling generation...');
    }
  }

  reset(): void {
    this.cancel();
    this.isGenerating.set(false);
    this.progress.set(null);
    this.statusMessage.set('');
    this.retryingCount.set(0);
    this.failedItems.set([]);
    this.succeededCount.set(0);
  }
}
