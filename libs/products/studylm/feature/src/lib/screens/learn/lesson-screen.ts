import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  LessonView,
  type LessonProgressState,
} from '@ah/products/studylm/learn';
import { CATALOG, loadBuiltInLessons } from '@ah/products/studylm/lessons';
import type { RoadmapSection } from '@ah/products/studylm/domain';
import { LessonGenerationService } from '../../services/lesson-generation.service';
import { StudyLmStorageService } from '../../services/studylm-storage.service';
import { StudyLmStore } from '../../store/studylm.store';
import { StudyLmScreens } from '../../shell/studylm-screens';

/** One lesson, opened where the learner left it, or followed as it's written. */
@Component({
  selector: 'ah-studylm-lesson-screen',
  imports: [LessonView, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="lesson-top-nav" aria-label="Lesson navigation">
      <a class="back" routerLink="..">← All lessons</a>

      @if (relatedSection(); as sec) {
        <div class="section-hub-nav">
          <span class="hub-label"
            >Section {{ sec.code }}: <strong>{{ sec.title }}</strong></span
          >
          <div class="hub-btn-group">
            <button
              type="button"
              class="hub-nav-btn"
              (click)="goToRoadmap(sec.id)"
              title="Locate and open this section on the Roadmap"
            >
              🗺️ Roadmap
            </button>
            <button
              type="button"
              class="hub-nav-btn"
              (click)="goToFlashcards(sec.id)"
              title="Practice flashcards for this section"
            >
              🃏 Flashcards ({{ sectionCardsCount() }})
            </button>
            <button
              type="button"
              class="hub-nav-btn"
              (click)="goToQuiz(sec.id)"
              title="Take diagnostic quiz for this section"
            >
              🎯 Quiz ({{ sectionQuizCount() }})
            </button>
          </div>
        </div>
      }
    </nav>

    @if (job(); as j) {
      @if (j.status === 'planning' || j.status === 'writing') {
        <section
          class="progress"
          aria-live="polite"
          aria-label="Writing the lesson"
        >
          <p class="title">
            {{
              j.status === 'planning'
                ? 'Planning the lesson…'
                : 'Writing block ' + done() + ' of ' + planned().length + '…'
            }}
          </p>
          <ol class="blocks">
            @for (b of planned(); track b.id) {
              <li [class]="b.state">
                <span aria-hidden="true">{{ icons[b.state] }}</span>
                {{ b.label }}
              </li>
            }
          </ol>
          <button type="button" class="ghost" (click)="cancel()">Cancel</button>
        </section>
      } @else if (j.status === 'failed') {
        <p class="error" role="alert">
          The lesson couldn’t be written: {{ j.error }}
          <a routerLink="../../roadmap">Back to the roadmap</a> to try again.
        </p>
      } @else if (j.status === 'cancelled') {
        <p class="error" role="status">Writing was cancelled.</p>
      }
    }

    @if (skipped().length) {
      <section class="skipped" aria-label="Skipped blocks">
        <p>
          {{ skipped().length }}
          {{ skipped().length === 1 ? 'block was' : 'blocks were' }} left out:
          the AI's version failed the checks, even after a repair.
        </p>
        <ul>
          @for (s of skipped(); track s.id) {
            <li>
              <strong>{{ s.label }}</strong
              >: {{ s.reason }}
              <button
                type="button"
                class="ghost"
                (click)="retry(s.id)"
                [disabled]="busy()"
              >
                Try this block again
              </button>
            </li>
          }
        </ul>
      </section>
    }

    @if (lesson(); as current) {
      <sl-lesson-view
        [lesson]="current"
        [progress]="data.value()?.progress ?? null"
        (progressChange)="save($event)"
      />
    } @else if (data.isLoading()) {
      <p role="status">Loading the lesson…</p>
    } @else if (!job()) {
      <p role="alert">There’s no lesson at this address.</p>
    }

    <!-- Next steps for reinforcing this lesson -->
    @if (relatedSection(); as sec) {
      <aside class="lesson-next-steps" aria-label="Practice next steps">
        <div class="next-steps-header">
          <span class="next-steps-tag">Practice & Reinforce</span>
          <h4>Continue mastering {{ sec.code }}: {{ sec.title }}</h4>
          <p>
            Test your recall with flashcards and check your conceptual
            understanding with quiz questions designed for this section.
          </p>
        </div>
        <div class="next-steps-buttons">
          <button
            type="button"
            class="next-step-btn primary"
            (click)="goToFlashcards(sec.id)"
          >
            🃏 Practice Flashcards ({{ sectionCardsCount() }})
          </button>
          <button
            type="button"
            class="next-step-btn secondary"
            (click)="goToQuiz(sec.id)"
          >
            🎯 Take Diagnostic Quiz ({{ sectionQuizCount() }})
          </button>
          <button
            type="button"
            class="next-step-btn ghost"
            (click)="goToRoadmap(sec.id)"
          >
            🗺️ Back to Roadmap Card
          </button>
        </div>
      </aside>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-4);
    }
    .lesson-top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      flex-wrap: wrap;
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-border-default);
    }
    .back {
      justify-self: start;
      color: var(--color-accent-default);
      font-weight: var(--font-weight-semibold);
      text-decoration: none;
    }
    .section-hub-nav {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .hub-label {
      font-size: var(--font-size-200);
      color: var(--color-text-muted);
      strong {
        color: var(--color-text-default);
      }
    }
    .hub-btn-group {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
    .hub-nav-btn {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-default);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--motion-duration-fast) ease;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-accent-default);
      }
    }
    .lesson-next-steps {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-4);
      margin-top: var(--space-4);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      background: color-mix(
        in srgb,
        var(--color-accent-subtle) 15%,
        var(--color-bg-surface)
      );
    }
    .next-steps-tag {
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-bold);
      color: var(--color-accent-default);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .next-steps-header {
      display: grid;
      gap: var(--space-1);
      h4 {
        margin: 0;
        font-size: var(--font-size-300);
        color: var(--color-text-default);
      }
      p {
        margin: 0;
        font-size: var(--font-size-200);
        color: var(--color-text-muted);
      }
    }
    .next-steps-buttons {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .next-step-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 8px 16px;
      font-size: var(--font-size-200);
      font-weight: var(--font-weight-medium);
      border-radius: var(--radius-md);
      cursor: pointer;
      border: 1px solid transparent;
      transition: all var(--motion-duration-fast) ease;

      &.primary {
        background: var(--color-accent-default);
        color: var(--color-text-on-accent, #ffffff);
        &:hover {
          filter: brightness(1.1);
        }
      }
      &.secondary {
        background: var(--color-bg-raised);
        border-color: var(--color-border-default);
        color: var(--color-text-default);
        &:hover {
          border-color: var(--color-accent-default);
        }
      }
      &.ghost {
        background: transparent;
        color: var(--color-text-muted);
        &:hover {
          color: var(--color-text-default);
        }
      }
    }
    .progress,
    .skipped {
      display: grid;
      gap: var(--space-2);
      max-inline-size: 52rem;
      padding: var(--space-4);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      background: var(--color-bg-surface);
    }
    .title,
    .skipped p {
      margin: 0;
    }
    .title {
      font-weight: var(--font-weight-semibold);
    }
    .blocks {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--font-size-200);
    }
    .blocks .pending {
      color: var(--color-text-muted);
    }
    .blocks .skipped {
      color: var(--color-warning-default);
    }
    .skipped ul {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding-inline-start: var(--space-4);
    }
    .error {
      color: var(--color-danger-default);
    }
    .ghost {
      min-block-size: 2.75rem;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-default);
      font: inherit;
      cursor: pointer;
    }
    .progress .ghost {
      justify-self: start;
    }
  `,
})
export class LessonScreen {
  /** From the route, `learn/:lessonId`; read here so standalone works too. */
  private readonly lessonId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => params.get('lessonId') ?? ''),
    ),
    { initialValue: '' },
  );

  private readonly storage = inject(StudyLmStorageService);
  private readonly generation = inject(LessonGenerationService);
  protected readonly store = inject(StudyLmStore);
  protected readonly screens = inject(StudyLmScreens);

  protected readonly icons: Record<string, string> = {
    pending: '○',
    writing: '…',
    ready: '✓',
    skipped: '!',
  };

  protected readonly data = resource({
    params: () => this.lessonId(),
    loader: async ({ params: id }) => {
      const generated = id.startsWith('gen-');
      const [record, builtIn, progress] = await Promise.all([
        generated ? this.storage.getGeneratedLesson(id) : null,
        generated ? [] : loadBuiltInLessons(),
        this.storage.getLessonProgress(id),
      ]);
      return {
        lesson: record?.lesson ?? builtIn.find((l) => l.id === id) ?? null,
        draft: record?.draft ?? null,
        progress,
        record,
      };
    },
  });

  protected readonly relatedSection = computed<RoadmapSection | null>(() => {
    const rec = this.data.value()?.record;
    if (!rec) return null;
    return this.store.allSections().find((s) => s.id === rec.sectionId) ?? null;
  });

  protected readonly sectionCardsCount = computed(() => {
    const sec = this.relatedSection();
    if (!sec) return 0;
    return this.store.flashcards().filter((c) => c.sectionId === sec.id).length;
  });

  protected readonly sectionQuizCount = computed(() => {
    const sec = this.relatedSection();
    if (!sec) return 0;
    return this.store.quizQuestions().filter((q) => q.sectionId === sec.id)
      .length;
  });

  protected goToRoadmap(sectionId: string): void {
    this.store.setSelectedSection(sectionId);
    void this.screens.goToSectionRoadmap(sectionId);
  }

  protected goToFlashcards(sectionId: string): void {
    this.store.setCardSectionFilter(sectionId);
    void this.screens.goToSectionFlashcards(sectionId);
  }

  protected goToQuiz(sectionId: string): void {
    this.store.setQuizSectionFilter(sectionId);
    void this.screens.goToSectionQuiz(sectionId);
  }

  protected readonly job = computed(
    () => this.generation.jobs()[this.lessonId()] ?? null,
  );
  protected readonly busy = computed(() => {
    const status = this.job()?.status;
    return status === 'planning' || status === 'writing';
  });

  /** While writing, the blocks done so far; afterwards, the saved lesson. */
  protected readonly lesson = computed(() =>
    this.busy()
      ? (this.job()?.lesson ?? null)
      : (this.data.value()?.lesson ?? null),
  );

  private readonly draft = computed(() =>
    this.busy()
      ? (this.job()?.draft ?? null)
      : (this.data.value()?.draft ?? null),
  );

  protected readonly planned = computed(() => {
    const draft = this.draft();
    if (!draft) return [];
    return draft.outline.sections.flatMap((section) =>
      section.blocks.map((b) => ({
        id: b.id,
        label: `${section.title}: ${CATALOG[b.kind].label}`,
        state: draft.blocks[b.id]?.state ?? 'pending',
      })),
    );
  });
  protected readonly done = computed(
    () =>
      this.planned().filter((b) => b.state === 'ready' || b.state === 'skipped')
        .length + 1,
  );
  protected readonly skipped = computed(() => {
    const draft = this.draft();
    if (!draft || this.busy()) return [];
    return this.planned().flatMap((b) => {
      const status = draft.blocks[b.id];
      return status?.state === 'skipped'
        ? [{ ...b, reason: status.reason }]
        : [];
    });
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const name = this.lesson()?.title;
      if (name) title.setTitle(`${name} · StudyLM`);
    });
    // When writing finishes, show the saved lesson.
    effect(() => {
      if (this.job()?.status === 'ready') untracked(() => this.data.reload());
    });
  }

  protected cancel(): void {
    this.generation.cancel(this.lessonId());
  }

  protected retry(blockId: string): void {
    void this.generation.retryBlock(this.lessonId(), blockId);
  }

  protected save(progress: LessonProgressState): void {
    void this.storage.saveLessonProgress({
      lessonId: this.lessonId(),
      ...progress,
      updatedAt: new Date().toISOString(),
    });
  }
}
